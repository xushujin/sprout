# WordSprout 内容核对记录

范围：本项目现有全部题库、公开词表、导入工具、配套发音与 Pages 部署。

本次采用“允许免费公开使用和再分发，按具体条件履行”的准入标准，不把“免费”“开源”“公有领域”“没有版权”混为一谈，也不对所有司法辖区作绝对无侵权保证。

## 词库处理

| 对象                | 核对结果                                                                                                       | 决定                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 600 词课标参考词库  | 以教育部 2022 年课标二级词汇 505 词为范围参照，补充 95 个常用词；项目独立编排年级、难度、释义和题目            | 保留 1–6 年级及入门/基础/进阶                            |
| 外研版社区词表 8 册 | Qwerty Learner 仓库带 GPL v3，但未提供足以确认外研社教材内容再分发权的证明；不能依据仓库许可证代替原权利人授权 | 移除入口、索引、处理数据、原始数据、许可证副本及导入脚本 |
| 教材专用发音        | 本身为合成语音，但已无合格对应题库，不继续公开不必要内容                                                       | 移除 794 个公共 MP3（含 read-past 变体）                 |
| 旧版选择和统计      | 本地只记录词 ID、答题次数和积分，不保留原教材释义                                                              | 选择迁移为同年级通用练习；保留历史统计及待同步队列       |

删除文件的路径清单见 `removed-paths.json`，只保留文件名，不备份教材内容。

## 保留音频

- 60 个开放许可录音：逐一查询 Wikimedia Commons 的文件元数据，对照当前清单。54 个 CC BY-SA 3.0、1 个 CC0、5 个公有领域标记匹配。保留署名、原页面、许可链接和转码/音量处理说明；CC BY-SA 仍有版权，改编须遵守相同许可等条件。
- 540 个本机合成音频：使用 Piper / en_US-ljspeech-high。模型仓库 README 标注 MIT；该模型 MODEL_CARD 标注训练数据 LJ Speech 为 public domain；数据集发布者把公有领域声明限定于美国。保留这些来源事实，不自行将生成 MP3 宣告成全球公有领域。
- Piper 工具、模型权重未部署到网站；GPL 工具的输出不会仅因工具 GPL 而自动受 GPL，输出是否包含受保护内容仍需单独分析。
- 没有复制教材附带录音、出版物插图或商业歌曲。背景音乐、提示音及 SVG 插图由本项目代码生成；emoji 由设备字形渲染。

核对证据：`verified-sources.json`、`commons-source-metadata.json`、`piper-repository-readme.txt`、`ljspeech-model-card.txt`。元数据核对是许可证来源记录，不是版权权属或当地法律的保证。

## 发布与防止回流

- `npm run build` 前后强制检查 600 词及音频允许清单，拒绝额外词表、旧索引、旧导入脚本和无署名的文件。
- `404.html` 与独立生成的 `/admin/`、`/leaderboard/` 静态页面入口让下线的词表地址真实返回 404，同时可直达并刷新合法页面；不再使用覆盖全站路径的 SPA 回退。
- 发布干净生产版本后，只删除已确认包含教材的三个 WordSprout 历史部署（9c41eb04、7e6b2251、754da528）。更早的起步版本无该教材导入，保留；其他项目/Worker/数据库不受影响。
- 计划及执行结果见 `deployment-removal-plan.json` 和 `deployment-removal-results.json`；没有执行结果时不得声称历史链接已经撤下。
- 下线不能收回他人此前已下载的副本；本次处理站点能控制的公开入口、静态文件和历史部署。

参考原始资料：

- https://creativecommons.org/licenses/by-sa/3.0/
- https://creativecommons.org/publicdomain/zero/1.0/
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- https://huggingface.co/rhasspy/piper-voices
- https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/high/MODEL_CARD
- https://keithito.com/LJ-Speech-Dataset/
- https://www.gnu.org/licenses/gpl-faq.html#WhatCaseIsOutputGPL

2026-11-12 第二波发音优化：新增替换 39 个幼小衔接词的合成音频，幼小衔接现有 48/50 个词使用开放录音；`black`、`pink` 保留合成。`white`、`ten` 额外限制峰值，避免转码后的尖峰削波。音频来源仍逐项记录在清单中，署名页的许可数量从清单自动生成。
