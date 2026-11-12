import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const human = JSON.parse(readFileSync('public/audio/sources.json', 'utf8')).filter(
  (item) => item.kind !== 'synthesized',
);
const known = new Set(human.map((item) => item.word));
const licenseCounts = human.reduce((counts, item) => {
  counts[item.license] = (counts[item.license] ?? 0) + 1;
  return counts;
}, {});
const licenseSummary = Object.entries(licenseCounts)
  .map(([license, count]) => `${count} 项 ${license}`)
  .join('、');
const words = JSON.parse(readFileSync('.wrangler/vocabulary-audio-input.json', 'utf8'));
const generated = words
  .filter((word) => !known.has(word.id))
  .map((word) => {
    if (!existsSync(`public/audio/${word.id}.mp3`)) throw new Error(`缺失音频 ${word.id}`);
    return {
      word: word.id,
      text: word.en,
      ...(word.spoken
        ? {
            pronunciation: word.spoken,
            note: 'Context-specific pronunciation; read-past is pronounced /red/.',
          }
        : {}),
      file: `/audio/${word.id}.mp3`,
      kind: 'synthesized',
      author: 'WordSprout · local Piper synthesis',
      source: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/high',
      model: 'en_US-ljspeech-high',
      dataset: 'LJ Speech (public domain)',
      dataset_url: 'https://keithito.com/LJ-Speech-Dataset/',
      changes:
        'Synthesized offline with Piper 1.8.0; converted to mono 44.1 kHz / 64 kbps MP3; normalized loudness.',
    };
  });
const manifest = [...human, ...generated];
writeFileSync('public/audio/sources.json', JSON.stringify(manifest, null, 2) + '\n');
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
writeFileSync(
  'public/audio-credits.html',
  `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>发音来源与许可 · WordSprout</title><link rel="stylesheet" href="/audio-credits.css"></head><body><main><a href="/">← 回到 WordSprout</a><h1>发音来源与许可</h1><p>当前为本项目独立编排的 ${words.length} 个课标参考词提供 MP3。音频按各自来源条件提供，免费使用不代表没有版权。教材配套音频未使用。</p><h2>本机生成的语音（${generated.length} 项）</h2><p>使用 <a href="https://github.com/OHF-Voice/piper1-gpl">Piper</a> 和 <a href="https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/high">en_US-ljspeech-high 模型</a>在本机预生成。模型仓库标注 MIT，具体模型卡标注训练数据为 LJ Speech 公有领域数据；<a href="https://keithito.com/LJ-Speech-Dataset/">数据集发布者</a>说明公有领域结论适用于美国。工具和模型不随站点分发，不能据此宣称所有相关权利在所有地区均不存在。</p><h2>开放许可真人录音（${human.length} 项）</h2><p>${licenseSummary}。CC BY-SA 录音仍有版权，但允许在遵守署名和相同方式共享等条件下免费使用、改编、再分发。以下保留作者、来源、许可和改动说明；没有使用教材配套录音。</p><p>处理方式：将原始音频转码为单声道 MP3 并统一音量，未修改朗读内容。转码版沿用原录音许可。</p><table><thead><tr><th>词 / 来源</th><th>作者</th><th>许可</th></tr></thead><tbody>${human.map((item) => `<tr><td><a href="${escape(item.source)}">${escape(item.word)}</a></td><td>${escape(item.author)}</td><td><a href="${escape(item.license_url)}">${escape(item.license)}</a></td></tr>`).join('\n')}</tbody></table><p><a href="/audio/sources.json">逐项来源清单</a> · <a href="/vocabulary/credits.html">词库使用说明</a></p></main></body></html>\n`,
);
console.log(
  `Audio manifest: ${human.length} recordings + ${generated.length} local synthesized entries.`,
);
