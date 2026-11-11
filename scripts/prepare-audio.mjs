// One-time build helper; never runs in Pages builds or in the browser.
// Requires local ffmpeg/ffprobe. Only downloads the licensed files listed here.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { WORDS } from '../src/data/words.ts';

const sourceTitle = (word) =>
  word.id === 'orange' ? 'File:En - orange.wav' : `File:En-us-${word.id}.ogg`;
const query = new URL('https://commons.wikimedia.org/w/api.php');
query.search = new URLSearchParams({
  action: 'query',
  format: 'json',
  prop: 'imageinfo',
  iiprop: 'url|extmetadata',
  titles: WORDS.map(sourceTitle).join('|'),
});
const headers = {
  'User-Agent':
    'WordSprout/0.1 (educational pronunciation assets; https://wordsprout.hatim.eu.org)',
};
const metadataResponse = await fetch(query, { headers, signal: AbortSignal.timeout(30_000) });
if (!metadataResponse.ok) throw new Error(`Commons metadata: ${metadataResponse.status}`);
const metadata = await metadataResponse.json();
const pages = Object.values(metadata.query.pages);
mkdirSync('.wrangler/audio-source', { recursive: true });
mkdirSync('public/audio', { recursive: true });
const manifest = [];
const plain = (value) => (value ?? '').replace(/<[^>]*>/g, '').replaceAll('&amp;', '&');
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

for (const word of WORDS) {
  const title = sourceTitle(word);
  const info = pages.find((page) => page.title === title)?.imageinfo?.[0];
  if (!info) throw new Error(`找不到音频 ${title}`);
  const meta = info.extmetadata;
  const license = meta.LicenseShortName?.value;
  if (!['CC BY-SA 3.0', 'CC0', 'Public domain'].includes(license))
    throw new Error(`请人工确认 ${title} 的许可：${license}`);
  const url = new URL(info.url);
  if (url.hostname !== 'upload.wikimedia.org' || url.protocol !== 'https:')
    throw new Error('意外下载域名');
  url.search = '';
  const source = `.wrangler/audio-source/${word.id}.${title.endsWith('.wav') ? 'wav' : 'ogg'}`;
  if (!existsSync(source)) {
    let response;
    for (let attempt = 0; attempt < 4; attempt++) {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      if (response.status !== 429) break;
      const seconds = Math.max(10, Number(response.headers.get('Retry-After')) || 30);
      await response.arrayBuffer();
      if (seconds > 60)
        throw new Error(`Commons 要求等待 ${seconds}s，请稍后重试，已有文件会复用。`);
      console.log(`${word.id}: Commons 限流，等待 ${seconds}s`);
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
    if (!response.ok) throw new Error(`${title}: ${response.status}`);
    writeFileSync(source, new Uint8Array(await response.arrayBuffer()));
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  const output = `public/audio/${word.id}.mp3`;
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    source,
    '-map_metadata',
    '-1',
    '-ac',
    '1',
    '-ar',
    '44100',
    '-af',
    'loudnorm=I=-18:TP=-2:LRA=7',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '64k',
    output,
  ]);
  const duration = Number(
    execFileSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        output,
      ],
      { encoding: 'utf8' },
    ).trim(),
  );
  if (!Number.isFinite(duration) || duration < 0.2 || duration > 10)
    throw new Error(`${word.id} 音频时长异常：${duration}`);
  const item = {
    word: word.id,
    file: `/audio/${word.id}.mp3`,
    source: info.descriptionurl,
    download: url.toString(),
    author: plain(meta.Artist?.value) || '作者未标注（Commons PD-self）',
    license,
    license_url: (
      meta.LicenseUrl?.value || 'https://commons.wikimedia.org/wiki/Template:PD-self'
    ).replace('http:', 'https:'),
    changes:
      'Converted to MP3, mono 44.1 kHz / 64 kbps; loudness normalized. No spoken content changed.',
    duration,
  };
  manifest.push(item);
  console.log(`${word.id}: ${duration.toFixed(2)}s, ${license}`);
}
writeFileSync('public/audio/sources.json', JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(
  'public/audio-credits.html',
  `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>发音来源 · WordSprout</title><link rel="stylesheet" href="/audio-credits.css"></head><body>
<main><a href="/">← 回到 WordSprout</a><h1>单词发音来源</h1><p>感谢 Wikimedia Commons 的录音贡献者。以下音频转换为 MP3 并统一了音量，未修改朗读内容。改编音频沿用所列许可，许可只适用于音频素材。</p>
<table><thead><tr><th>单词 / 原始录音</th><th>录音作者</th><th>许可</th></tr></thead><tbody>
${manifest.map((item) => `<tr><td><a href="${escape(item.source)}">${escape(item.word)}</a></td><td>${escape(item.author)}</td><td><a href="${escape(item.license_url)}">${escape(item.license)}</a></td></tr>`).join('\n')}
</tbody></table><p><a href="/audio/sources.json">查看完整来源与转换说明</a></p></main></body></html>\n`,
);
