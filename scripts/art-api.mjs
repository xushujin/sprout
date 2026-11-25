/**
 * Image-generation client shared by the art scripts.
 *
 * Two providers are supported and picked from the URL:
 *
 *   …/chat/completions     the picture is a base64 data URL inside the assistant
 *                          message, e.g. `![image_1](data:image/png;base64,iVBORw0…)`.
 *                          No size / background parameters exist, so aspect ratio
 *                          and transparency live in the prompt (`aspectHint()`).
 *   …/images/generations   the classic images API: prompt in, `b64_json` out, with
 *                          real `size` and `background: 'transparent'` fields.
 *
 *   IMAGE_API_URL  default https://new.orbitix.site/v1/chat/completions
 *   IMAGE_MODEL    default gpt-image-2.5-flare
 *   IMAGE_API_KEY  else the git-ignored `.env.art`
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const DEFAULT_API_URL = 'https://new.orbitix.site/v1/chat/completions';
export const DEFAULT_MODEL = 'gpt-image-2.5-flare';

const DATA_URL = /data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\s]+)/i;
const REMOTE_URL = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/;
const IMAGE_SIZE = { '1:1': '1024x1024', '2:3': '1024x1536', '3:2': '1536x1024' };

/** Read credentials from the environment, falling back to `.env.art`. */
export async function readConfig(root) {
  const file = resolve(root, '.env.art');
  const text = existsSync(file) ? await readFile(file, 'utf8') : '';
  const pick = (name) => text.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim();

  const key = process.env.IMAGE_API_KEY || pick('IMAGE_API_KEY');
  if (!key) {
    console.error('缺少 IMAGE_API_KEY。请写入 .env.art 或通过环境变量传入。');
    process.exit(1);
  }
  return {
    key,
    apiUrl: process.env.IMAGE_API_URL || pick('IMAGE_API_URL') || DEFAULT_API_URL,
    model: process.env.IMAGE_MODEL || pick('IMAGE_MODEL') || DEFAULT_MODEL,
  };
}

/** Pull the first picture out of an assistant message. */
export function extractImage(payload) {
  const message = payload?.choices?.[0]?.message;
  if (!message) return null;

  const parts = Array.isArray(message.content) ? message.content : [message.content];
  const texts = [];
  for (const part of parts) {
    if (typeof part === 'string') texts.push(part);
    else if (part?.type === 'text' && part.text) texts.push(part.text);
    else if (part?.type === 'image_url') texts.push(`![]( ${part.image_url?.url ?? ''} )`);
  }
  const content = texts.join('\n');

  const inline = content.match(DATA_URL);
  if (inline) {
    return {
      buffer: Buffer.from(inline[2].replace(/\s+/g, ''), 'base64'),
      remote: null,
      text: content,
    };
  }

  const remote = content.match(REMOTE_URL);
  if (remote) return { buffer: null, remote: remote[1], text: content };

  return null;
}

export function aspectHint(aspect) {
  if (!aspect || aspect === '1:1') return '';
  if (aspect === '2:3') {
    return ' Composition: a tall vertical portrait canvas, 2:3 aspect ratio, the character fully inside the frame with headroom above and floor below.';
  }
  if (aspect === '3:2') {
    return ' Composition: a wide horizontal landscape canvas, 3:2 aspect ratio.';
  }
  return ` Composition: ${aspect} aspect ratio.`;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Ask for one picture. Returns the PNG bytes.
 *
 * Retries because the model occasionally answers with prose instead of an
 * image; from the third attempt the prompt is nudged to render immediately.
 * `aspect` is the human form ('2:3'), `shape` the canvas the caller wants.
 */
export async function generateImage({
  key,
  prompt,
  aspect = '1:1',
  attempts = 5,
  backoff = 1500,
  apiUrl = process.env.IMAGE_API_URL || DEFAULT_API_URL,
  model = process.env.IMAGE_MODEL || DEFAULT_MODEL,
}) {
  // Two providers are supported: the chat protocol above, and the classic
  // images protocol (prompt in, b64_json out) for accounts still on it.
  const imagesProtocol = apiUrl.includes('/images/generations');
  const pixelSize = IMAGE_SIZE[aspect] ?? IMAGE_SIZE['1:1'];
  let lastError = 'unknown error';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const nudge =
      attempt >= 3 ? ' Render this illustration directly as one image now, no prose reply.' : '';
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          imagesProtocol
            ? {
                model,
                prompt: `${prompt}${aspectHint(aspect)}${nudge}`,
                n: 1,
                size: pixelSize,
                background: 'transparent',
                output_format: 'png',
              }
            : {
                model,
                messages: [{ role: 'user', content: `${prompt}${aspectHint(aspect)}${nudge}` }],
              },
        ),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        lastError = payload?.error?.message?.slice(0, 180) ?? `HTTP ${response.status}`;
        await sleep(backoff * attempt);
        continue;
      }

      if (imagesProtocol) {
        const first = payload?.data?.[0];
        if (first?.b64_json) return Buffer.from(first.b64_json, 'base64');
        if (first?.url) {
          const download = await fetch(first.url);
          if (download.ok) return Buffer.from(await download.arrayBuffer());
          lastError = `图片下载失败 HTTP ${download.status}`;
        } else {
          lastError = 'images 协议没有返回图片';
        }
        await sleep(backoff * attempt);
        continue;
      }

      const found = extractImage(payload);
      if (!found) {
        lastError = `没有图片：${String(payload?.choices?.[0]?.message?.content ?? '').slice(0, 120)}`;
        await sleep(backoff * attempt);
        continue;
      }
      if (found.buffer) return found.buffer;

      const download = await fetch(found.remote);
      if (!download.ok) {
        lastError = `图片下载失败 HTTP ${download.status}`;
        await sleep(backoff * attempt);
        continue;
      }
      return Buffer.from(await download.arrayBuffer());
    } catch (error) {
      lastError = error.message;
      await sleep(backoff * attempt);
    }
  }
  throw new Error(lastError);
}
