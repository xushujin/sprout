# WordSprout 生产发布记录

目标域名：`https://wordsprout.hatim.eu.org`，管理员入口 `/admin`。

2026-11-10 已完成 Cloudflare OAuth 授权并创建以下资源：

| 资源      | 名称 / ID                                                     |
| --------- | ------------------------------------------------------------- |
| Account   | `59d1142ec45805e0ed0a5e04c242cd84`                            |
| Zone      | `hatim.eu.org` / `7754256b2f96bdb1602672660e6dd305`           |
| Pages     | `wordsprout` / `wordsprout-5ud.pages.dev`                     |
| Worker    | `wordsprout-api`                                              |
| API Route | `wordsprout.hatim.eu.org/api/*`                               |
| D1        | `wordsprout` / `4482d261-410c-44b8-b752-8be5d2c234d0`         |
| KV        | `WORDSPROUT_LEADERBOARD` / `139a19c67a54451d8b93869547d0927c` |
| Cron      | `*/30 * * * *`                                                |

静态站点、Worker、D1 三张表、KV、Cron、生产密码密钥和初始管理员已发布。未开通 R2、未升级套餐。现有 `tools` Pages、`wish-worker`、`mail` D1 和 `WISHES` KV 未修改。

管理员用户名为 `admin`。随机初始密码只保存在本机 `.secrets.admin.json`，生产 pepper 保存在 `.secrets.production.json` 并上传 Worker Secret。两个文件均已 Git 忽略、权限为 0600；请通过本地文件查看并加密备份，不要提交到仓库。

2026-11-10 08:54（北京时间）生产验证结果：

- 用户已添加 CNAME：名称 `wordsprout`，目标 `wordsprout-5ud.pages.dev`，代理开启。
- Pages 自定义域名、DNS 验证和 HTTPS 证书状态均为 `active`，正式首页返回 200，安全响应头正常。
- 未登录访问 `/api/me` 返回 401 且 `Cache-Control: no-store`；榜单 API 返回合法 JSON。
- 实际手机尺寸 Chrome 验证通过：管理员登录、创建学生、学生安全 Cookie（HttpOnly / Secure / SameSite=Strict / 30 天）、刷新自动登录、完成 5 词后一次提交、D1 记录一轮 50 分、退出清 Cookie 与用户名。
- 测试学生和关联记录已清理。线上截图在本机 `test-results/production/garden.png`，不会上传或提交到 Git。
- Cloudflare GraphQL 指标在 08:55 返回 25 次请求、0 错误，CPU P50 为 2.279 ms、P99 为 8.460 ms（API 原始单位为微秒）。这是本次少量请求的观测结果，后续人数与数据增长仍需监测。
- `api/*` Worker Route 设置为 fail closed，workers.dev 与 preview URL 均关闭。
- Cron 在 09:00:38 执行成功（Worker Tail 结果 Ok），KV 自动生成 `leaderboard:2026-11-09`，线上榜单 API 返回 `generated_at=1794272438857`。尚未配置 Cloudflare Access；现有管理 API 始终校验管理员角色。

复验命令：`node scripts/cloudflare-deploy.mjs domain-status`、`runtime-status`、`verify-browser`。若本机 IPv6 链路异常，可将公开 DNS 返回的 Cloudflare IPv4 设置为 `WORDSPROUT_VERIFY_IPV4`；仅影响本机测试解析，仍正常验证目标域名的 TLS 证书。本次使用 `104.21.30.10` 验证。

2026-11-10 09:12（北京时间）手机发音修复已发布：

- Pages 部署 `5838da50`：20 个真人 MP3，共 134,599 字节，直接从 `/audio/` 播放，不依赖手机系统朗读，不经过 Worker 或 R2。
- 录音来自 Wikimedia Commons，已逐项保留作者、原始链接、许可和转码说明，应用底部可查看“发音来源”。
- 正式音频返回 200、`Content-Type: audio/mpeg`、7 天缓存，并支持 Range 请求。
- `verify-audio` 已在正式域名禁用 speechSynthesis 后，通过实际学习页播放及全部 20 个音频的解码验证。该验证仅模拟前端身份，不登录管理员，不写生产学习数据，不影响现有会话。
- 本地 3 条浏览器回归全部通过：无系统朗读时的播放 / 重播 / 失败重试、完整学习闭环、配额与错误页面下的同步保留。已修正测试脚本切换登录页面时的等待条件。
- 手机中已打开的旧页面需要刷新一次，即可加载新播放器。

`Free Website` 是域名套餐，不能用来证明 Workers 订阅类型。OAuth 没有账单查询权限，账户 subscriptions API 返回 403；可在 Workers Plans 控制台确认 Workers Free。代码不会升级套餐。账号配额为共享额度，既有服务的用量也计算在内。

后续更新：`npm run build` → `npm run deploy:web` → `npm run deploy:api`。不要重复运行生产密钥生成或覆盖 pepper。Pages 项目已存在，后续部署不需要 `--force`。

2026-11-10 词库分级更新：

- 首页增加“按年级 / 按难度 / 外研版”三个入口。通用 1–6 年级各 30 词，入门 / 基础 / 进阶各 60 词。
- 外研版为三年级起点传统版社区词表，提供三至六年级上下册共 8 册：134 / 154 / 144 / 130 / 150 / 144 / 83 / 105 项，包含短语。页面明确区别于 2024/2025 新版，提供原始词表、GPL v3 许可证和纠错记录。
- 全部去重 973 项：20 个保留的真人录音 + 954 个离线 Piper 合成 MP3（含 read 过去式读音）；音频总计 6,863,057 字节，当前构建共 1,002 个静态文件，均在 Pages 免费静态文件限制内。模型、Python 与 ffmpeg 仅用于本机预生成，不部署到 Cloudflare。
- 所选词库保存在账号隔离的本地进度内；旧版进度自动沿用默认词库，同词共享进度。每轮题目、补错和干扰选项均限于所选词库，不增加 D1/KV 读写。
- 构建、类型检查、全部词库 / MP3 完整性检查与 6 条手机浏览器回归通过。覆盖所有年级与难度选择、8 册加载、选择持久化、旧记录兼容、限定范围补错积分、失败加载恢复，以及原有发音与学习闭环。
- 最终 Pages 部署 `7e6b2251` 已发布；正式域名首页 200，8 册选择 / 刷新恢复及 67/974 个抽样音频的真实解码通过。新增测试使用前端模拟身份，没有改动生产账号、会话或学习记录。
- 逐册复核并修正原词表的中文录入错误（如“学”→“雪”、“没人”→“每人”）及 swan→swam；read 在五年级下册作为过去式时使用独立 `/red/` MP3。同一词的本地进度 ID 仍保持共享。

2026-11-10 平板、背景音乐与返回首页更新：

- Pages 生产部署 `754da528` 已发布。布局覆盖 iPad mini 768×1024、iPad Air 820×1180、iPad Pro 1024×1366、安卓平板 800×1280、分屏 600×960 及各自横屏（CSS 像素）。竖屏使用顶部导航，宽横屏使用 208px 紧凑侧栏；触控按钮至少 44×44、输入字号至少 16px，后台表格仅在自身容器内滚动。
- 开始一轮后使用本地 Web Audio 合成原创节奏音乐；最后 5 秒节奏加快。答对、答错 / 超时、整轮完成使用不同音效。音乐与音效开关独立保存在本地学习记录内，单词朗读期间降低音乐音量，无新增云端请求。
- 学习中和完成页增加“返回首页”。未完成轮次先确认；弹窗期间暂停声音和计时，取消后恢复，确认退出只丢弃未完成轮次。已完成的积分、词库选择与待同步队列保留，回首页 / 卸载 / 后台时停止或暂停声音。
- 验证：8 条手机端到端测试、5 组 Chromium 平板布局、5 组 WebKit 布局全部通过；额外验证 WebKit 的真实声音节点和返回弹窗通过。已发布 Pages 版本的同一组 5 个平板视口也全部通过，使用模拟 API，不访问生产账号或数据库。
- 自定义域名自动浏览器验收遇到 Cloudflare 安全验证，因此完整线上界面验收使用同一生产部署的 `754da528.wordsprout-5ud.pages.dev` 地址；未修改域名防护设置。浏览器引擎 / 视口模拟不等同于所有 iPad 实机系统与键盘场景。
- 本次仅更新 Pages 静态资源，Worker、数据库 schema、会话及既有学生账号未更改。刷新页面即可使用。

2026-11-11 内容合规清理后的生产状态（600 词扩充前）：

- Pages 当前生产部署为 `2e43c165-ecba-489a-836d-b254f55c3030`，预览地址 `https://2e43c165.wordsprout-5ud.pages.dev`；正式域名仍为 `https://wordsprout.hatim.eu.org`。
- 当前仅提供 WordSprout 独立整理的通用 1–6 年级（各 30 词）与入门 / 基础 / 进阶（各 60 词），共 180 个不重复常用词。年级和难度是实现中的自主练习建议，不代表出版社教材同步内容或官方课程标准。
- 无法核实第三方教材再分发授权的外研版 8 册、原始词表、导入脚本和不再需要的 794 个 MP3 已下线。构建会阻止这些文件重新进入 `dist`，已下线的词表路径返回 404。
- `/admin` 和 `/leaderboard` 改为独立的静态 HTML 入口，并兼容尾斜杠；直接访问和刷新不再经过会落到首页的 Pages 重写规则。没有恢复覆盖全站的通配 SPA 回退。
- 内容校验、类型检查和生产构建通过；手机端 8 条 Chromium 端到端测试通过，本地及线上 Chromium / WebKit 各 5 组平板视口均通过。正式域名关闭系统朗读后，180/180 个 MP3 均成功解码。
- 保留音频包括 18 个 CC BY-SA 3.0、1 个 CC0、1 个公有领域标记的真人录音，以及 160 个 Piper / `en_US-ljspeech-high` 本机合成音频。它们可按各自许可免费使用，但仍需履行适用条件，不能统称为“无版权”。
- 包含旧教材内容的三个部署 `9c41eb04`、`7e6b2251`、`754da528` 已删除，执行证据在 `docs/content-audit/deployment-removal-results.json`。更早且未导入教材的 `5838da50`、`31ca8d49` 保留；本次未修改 Worker、D1、KV、Cron、账号或会话。
- 词库准入标准、来源、许可和处理记录见 `docs/content-audit/README.md` 与 `docs/content-audit/verified-sources.json`。

2026-11-11 课标参考词库扩充：

- Pages 生产部署 `12b3847b` 已发布，预览地址为 `https://12b3847b.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`。
- 词库以教育部公开的《义务教育英语课程标准（2022年版）》附录 3 中 505 个二级词汇为范围参照，补充 95 个主题拓展词，共 600 个不重复常用词。1–6 年级各新增 100 词，累计 100 / 200 / 300 / 400 / 500 / 600 词；难度为累计词库：入门 200 词、基础累计 400 词、进阶累计 600 词。
- 年级、难度、词序、释义和题目由 WordSprout 自主编排。页面不宣称官方逐年级分配、国家教材同步或出版社教材同步。
- 配套音频为 20 个开放许可真人录音和 580 个本机 Piper / `en_US-ljspeech-high` 合成音频；全部随 Pages 静态托管，不启用 R2、不新增 Worker、D1 或 KV 请求。
- 验证通过：14 条 Worker 单元测试、8 条手机端 Chromium 端到端测试、Chromium 与 WebKit 各 5 组平板视口、内容与 600 个音频清单检查、TypeScript、生产构建和 Prettier。正式域名关闭系统朗读后，600/600 个 MP3 均成功解码。
- 本次仅更新 Pages 静态资源与内容说明；Worker、D1 schema、KV 快照逻辑、Cron、既有账号和会话未修改。

2026-11-11 难度词库改为累计口径：

- Pages 生产部署 `eee63980` 已发布，预览地址为 `https://eee63980.wordsprout-5ud.pages.dev`。
- 按难度不再平均拆成三组 200 词：入门 200 词，基础累计 400 词，进阶累计 600 词。基础包含入门内容，进阶覆盖全部词库；实际每轮仍从当前词库抽取 5 题。
- 页面同步说明累计关系，选择仍按账号保存在本地并可刷新恢复。类型检查、内容检查、格式检查、3 条词库端到端测试和生产构建通过。

2026-11-11 后台学生昵称编辑：

- Worker `wordsprout-api` 发布版本 `6778f951-164c-4dad-847a-011c7add20b1`，新增 `PATCH /api/admin/students/:id`。
- Pages 最终生产部署 `d5db09a5` 已发布，预览地址 `https://d5db09a5.wordsprout-5ud.pages.dev`；首次昵称功能部署为 `06355a8d`。后台学生列表现在可以逐行修改公开昵称，输入限制 1–20 个字符；仅管理员角色可以调用，服务端仍校验 UUID、JSON 与写操作限流。
- 修改后后台列表和学生刷新后的页面会显示新昵称。排行榜保持 KV 快照机制，下一次 30 分钟 Cron 刷新后显示新昵称，不做实时 D1 聚合。
- 15 条 Worker 单元测试、8 条手机端 Chromium 端到端测试、Chromium / WebKit 各 5 组平板视口、类型检查、内容检查、生产构建和格式检查通过。
- 正式域名临时账号验收通过“管理员建号 → 修改昵称 → 学生登录读取新昵称 → 整轮提交 → D1 记分 → 退出清理”；测试学生及关联学习记录已删除。

2026-11-11 幼小衔接模块发布：

- Pages 生产部署 `c0f65558` 已发布，预览地址为 `https://c0f65558.wordsprout-5ud.pages.dev`；正式域名仍为 `https://wordsprout.hatim.eu.org`。
- 首页新增“幼小衔接”入口，与按年级、按难度并列，提供 5 个自主主题：英语启蒙与问候、颜色与大小、数字与数量、课堂与书包、我的身边。每个主题 10 项，每轮仍为 5 题。
- 主题词全部复用现有 600 个已核验词条和对应 MP3，没有新增教材内容、第三方音频或版权不明素材。每个主题的学习进度、补错池和选择状态按主题保存在本机；通用年级 / 难度进度不被幼小衔接覆盖。
- 幼小衔接继续使用现有听音、15 秒答题、答错补错、每轮一次 `/api/scores` 和云端失败静默降级机制，不增加 Worker、D1、KV、Cron 或 R2 请求。
- 验证通过：15 条 Worker 单元测试、9 条手机端 Chromium 端到端测试（含幼小衔接完整轮次和主题音频范围）、Chromium 与 WebKit 各 5 组平板视口、生产构建、600 词 / MP3 内容检查、Prettier 和 TypeScript。正式域名 `verify-audio` 验证 600/600 个音频成功解码，并确认幼小衔接数字主题的 `one.mp3` 返回 200。
- 本次仅更新 Pages 静态前端、词库映射、学习本地进度和文档；Worker 版本 `6778f951-164c-4dad-847a-011c7add20b1`、D1 schema、KV 快照、Cron、生产账号和会话均未修改。

2026-11-12 `hello` 发音修复：

- Pages 最终部署 `79afc521` 已发布；前一版静态音频部署 `e0b5a145` 仅作为中间版本，不是当前生产版本。
- 原 `hello.mp3` 是 Piper 单词级合成音频，在部分设备上重音和停连听起来不自然。已替换为 Wikimedia Commons 的 `En-us-hello.ogg` 公有领域录音，并按现有 44.1 kHz / 64 kbps MP3 流程转码。
- 当前音频清单为 21 个开放许可录音 + 579 个本机合成音频；来源、作者、许可和转码说明已同步到 `public/audio/sources.json`、`public/audio-credits.html` 与 `docs/content-audit/verified-sources.json`。
- 本次只更新静态音频和来源记录，不改变词库、Worker、D1、KV、Cron、账号或会话。发布前重新通过 600 项音频完整性检查和来源许可审计。

2026-11-12 第二波发音优化：

- Pages 生产部署 `36e7c467` 已发布，预览地址 `https://36e7c467.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`；音频缓存版本提升到 `v=3`。
- 在此前修复 `hello` 的基础上，另外将 39 个幼小衔接高频词从 Piper 合成替换为 Wikimedia Commons 开放录音，覆盖问候、数字、颜色、课堂用语和家庭生活词。幼小衔接现有 48/50 个词使用开放录音，`black`、`pink` 暂保留合成；同一音频路径也供年级和难度词库使用。
- 全站音频仍为 600 项：60 个开放录音（54 项 CC BY-SA 3.0、1 项 CC0、5 项 Public domain）和 540 个本机合成音频。60 个开放录音的元数据均通过来源许可核对，署名页的许可数量改为从清单自动计算。
- 对开放录音检查了解码样本峰值和有效声音；`white`、`ten` 额外限制峰值，60 个文件均无满幅样本削波或静音文件。39 个替换文件的来源、许可、哈希和测量值记录于 `docs/content-audit/preschool-audio-refresh.json`。这些自动检查不替代逐词听感和语音学评估。
- 验证通过：9 条手机 Chromium 端到端测试、1 条手机 WebKit 音频专项测试、600 项内容检查、TypeScript、Prettier 和生产构建。正式域名禁用系统语音后，问候与数字录音播放正常，全部 600 个 MP3 解码通过且 SHA-256 与本地文件一致；验收未登录真实账号、未写生产学习数据。
- 离线更新脚本支持限制下载频率、429 退避、逐项保存和已有录音重新转码；来源审计按最多 50 个文件分批请求。所有处理都在本机进行，生产仍直接播放 Pages 静态 MP3，使用原有每轮一次记分同步。

2026-11-12 向日葵成长系统发布：

- Pages 生产部署 `99df52a1` 已发布，预览地址 `https://99df52a1.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`。本次上传 5 个变更文件，其余 606 个静态文件复用既有内容。
- 首页新增向日葵成长插画：种子 / 发芽 / 幼苗 / 花苞 / 开花 / 盛放 / 结籽七阶段，按本机累计积分 0 / 30 / 200 / 500 / 900 / 1400 / 2000 推导；英雄卡显示当前阶段、进度条和距下一阶段分数，结算页显示阶段变化。
- 答题反馈区新增“五题小芽”：答对一题长一片叶子，答错仍长高，五题全对开花；只反映本轮，不单独存储。
- 成长阶段由 `src/lib/growth.ts` 从已有 `progress.points` 推导，未新增存储字段、API、Worker 路由、D1 或 KV 请求。植物仍随本机进度保存，换设备或清缓存从种子重新开始。
- 本次只更新 Pages 静态前端；Worker 版本 `6778f951-164c-4dad-847a-011c7add20b1`、D1 schema、KV 快照、Cron、生产账号和会话均未修改。
- 验证通过：21 条单元 / 集成测试（含 6 条成长阶段测试）、5 组平板视口布局回归、TypeScript、Prettier 和生产构建。正式域名用实际浏览器加载确认向日葵与进度条显示正常，资源指纹 `main-DWpX3W1O.js` / `main-B9V_6BO0.css` 与本地构建一致；验收使用模拟身份，未登录真实账号、未写生产学习数据。

2026-11-12 星榜向日葵阶段与累计积分：

- D1 `users` 新增 `lifetime_points INTEGER NOT NULL DEFAULT 0`。迁移前已导出备份 `.wrangler/d1-backup-2026-11-12.sql`；`ALTER TABLE` 后按 `score_events` 回填，6 名用户全部与事件总和一致。
- 每轮记分改为同事务 batch：`INSERT ... ON CONFLICT DO NOTHING` + `UPDATE users SET lifetime_points = lifetime_points + ? WHERE id = ? AND changes() = 1`。`changes()` 保证重复提交不会重复累计；Worker 测试中的并发重复提交用例已验证。
- Worker `wordsprout-api` 已重新发布。`wrangler deploy` 更新 Cron 时遇到一次网络中断，随后通过 API 确认 `*/30 * * * *` 仍然存在（`created_on` 为 2026-11-10，未变更）。
- Pages 生产部署 `6ec0d749` 已发布，预览地址 `https://6ec0d749.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`。星榜每行改为该学生的向日葵阶段（`variant="badge"` 的 48px 裁切头像），不再按名次轮换 emoji。
- 手动重建本周 KV 快照 `leaderboard:2026-11-09`（TTL 8 天），包含 3 条记录及 `lifetime_points`；正式域名实际浏览器验证：果果 590 分显示花苞、hatim 385 分显示幼苗、童童 135 分显示发芽。
- 验证通过：21 条单元 / 集成测试、TypeScript、Prettier、生产构建；正式域名 `/api/leaderboard` 返回新字段，页面无布局异常。

2026-11-12 向日葵插画版发布：

- Pages 生产部署 `d68bedec` 已发布，预览地址 `https://d68bedec.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`。本次上传 19 个文件（14 张插画 + 新 JS/CSS/HTML），其余 606 个静态文件复用。
- 七阶段从手写 SVG 改为预渲染水彩插画：`public/sunflower/stage-0.webp` 至 `stage-6.webp`（1024×1024 透明 WebP），星榜与结算页使用对应的 `stage-*-badge.webp`（256×256）。全套约 1 MB，随 Pages 静态托管，不新增 Worker、D1 或 KV 请求。
- 插画由 WorkBuddy ImageGen 于 2026-11-12 生成，以“盛放”为统一风格与花盆参考；本机完成去底、花盆对齐、噪点清理、头像裁切和 WebP 压缩。生成与处理记录在 `docs/content-audit/sunflower-art.json`，内容核对说明已同步更新。
- `Sunflower.tsx` 只保留阶段到文件名的映射；答题反馈的“五题小芽”仍为内联 SVG，不依赖网络图片。首页 hero 使用 1024px 整图，星榜最多 100 个 48px 头像使用 256px 裁切并懒加载。
- 验证通过：21 条单元 / 集成测试、TypeScript、Prettier、生产构建与内容清单检查；正式域名实际浏览器确认 hero 图 1024px 加载成功，星榜三条记录的 `stage-3-badge` / `stage-2-badge` / `stage-1-badge` 均加载成功。
- 本次只更新 Pages 静态前端与插画资源；未重新部署 Worker，D1 schema、KV 快照、Cron、账号和会话均未修改。

2026-11-13 成长阶段阈值重标定：

- 结籽从 2000 分调整到 6000 分，按 600 个词各见一次的全词库旅程标定（约 110–120 轮、550–600 次答题）。新阈值：种子 0 / 发芽 30 / 幼苗 250 / 花苞 750 / 开花 1500 / 盛放 3000 / 结籽 6000。
- 只改前端 `src/lib/growth.ts` 与对应测试；Worker、D1、KV、Cron、账号和会话未修改。阶段仍由 `lifetime_points` 实时推导，不需要重建 KV 快照。
- Pages 生产部署 `cb74c135` 已发布，预览地址 `https://cb74c135.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`。
- 现有用户被一次性重新分级：1600 分由盛放变为开花；果果 590 与 hatim 385 变为幼苗，童童 135 仍为发芽。线上实际浏览器验证通过。
- 验证通过：22 条单元 / 集成测试（新增 6000 分边界用例）、TypeScript、Prettier、生产构建。

2026-11-16 后台统计修复与账号名修改：

- 后台学生列表改为累计统计（完成轮次、新学 / 复习、正确率、积分），本周轮次 / 积分作为副行。此前只聚合本周，周一早上所有人显示 0，容易被误认为查询故障。
- 新增 `PATCH /api/me/username`：登录用户用当前密码修改账号名。密码凭据由“用户名 + 密码”派生，服务端同时用新账号名派生并写入新的密码哈希，避免改名后无法登录；唯一冲突返回 409，密码错误返回 403。
- 前端侧栏新增“账号设置”入口与弹窗，修改成功后立即更新当前会话显示；下次登录使用新账号名。
- Worker 版本 `98f5b592-48d1-4b8f-8fd2-249794716e70` 已发布，Cron `*/30 * * * *` 保持。Pages 最终部署 `d790a10d`，预览地址 `https://d790a10d.wordsprout-5ud.pages.dev`。
- 验证通过：24 条单元 / 集成测试（新增“本周为空仍显示累计”和“改名后可用新账号登录”用例）、TypeScript、Prettier、生产构建。线上确认账号弹窗和资源指纹。
- 未改 D1 schema、KV、生产账号和会话；后台累计查询只在管理员打开页面时读取 D1，不增加 Cron 或 KV 请求。

2026-11-16 用户形象与装饰商店：

- 新增“我的形象”页（`/profile`，独立 Vite 入口）：2 性别、3 发型（按性别）、2 脸型、3 肤色、3 基础服饰；分层 SVG 渲染，无外部图片。
- 装饰商店 6 件：小草帽 120、圆眼镜 80、红围巾 100、小皇冠 300、星星背景 200、向日葵胸针 150。购买前弹窗明确提示“会扣积分，向日葵可能退回上一阶段，本周星榜排名也会下降”。
- 数据模型：`users` 新增 `avatar TEXT`、`owned_items TEXT NOT NULL DEFAULT '[]'`；新增 `spend_events` 表及索引。迁移前备份 `.wrangler/d1-backup-2026-11-16.sql`。
- 购买在单个 D1 batch 中执行条件 UPDATE + `changes()` 守卫的 `spend_events` INSERT；积分不足返回 402，重复购买返回 409，不会扣成负数。
- 周榜积分改为“本周学习获得 - 本周装饰消费（不为负）”；`lifetime_points` 在购买时同步扣减，向日葵阶段可能下降，符合产品选择。榜单仍展示向日葵阶段，形象只在家里、侧栏和“我的形象”页展示。
- 后台学生列表的“积分”改为当前可用积分，`earned_points` 保留累计获得；本周 +Y 仍为本周学习获得。
- Worker 版本 `b3eeda12-89f2-441e-9f2d-cd22e9684ed8`，Cron `*/30 * * * *` 保持。Pages 部署 `8bc4db01`，预览地址 `https://8bc4db01.wordsprout-5ud.pages.dev`。
- 验证通过：27 条单元 / 集成测试（新增形象校验、购买扣分 / 防重复 / 防负数、榜单净积分 3 条）、TypeScript、Prettier、生产构建；线上确认 `/api/me` 与 `/api/shop/purchase` 未登录返回 401，`/profile` 形象页加载 6 件商品。

2026-11-16 管理员改账号、形象第二版与双榜：

- 登录账号修改改为仅管理员：新增 `PATCH /admin/students/:id/username`，必须同时设置新密码（密码凭据绑定用户名），并在同一事务撤销该学生旧会话；移除学生自助 `/api/me/username` 和侧栏“账号设置”入口。后台每行新增“修改账号”表单。
- 用户形象第二版：男孩/女孩使用不同脸型、眼型、眉形、唇形和服饰轮廓；圆脸/鹅蛋脸改为 4 套头部路径，真正生效；女孩服饰改为衬衫 / 连衣裙 / 背带裙，男孩为短袖 / 连帽衫 / 背带裤；头发加高光、衣服加领口 / 缝线 / 口袋。
- 星榜新增“本周星榜 / 总排行榜”切换：本周榜为本学习周净积分，总榜为当前成长积分；Cron 额外写 `leaderboard:all`，读取仍只走 KV。手动重建了总榜快照（3 条）。
- Worker 版本 `cff66de1-bd63-4f50-b761-5d66cc0b864d`，Cron `*/30 * * * *` 保持。Pages 部署 `1b815f2e`。
- 验证通过：27 条单元 / 集成测试（管理员改账号、旧会话撤销、学生无权、重名 409；总榜用例）、TypeScript、Prettier、生产构建；线上确认总榜 3 条、首页无自助改账号入口、形象页与后台“修改账号”表单正常。

2026-11-16 手机端退出按钮修复：

- 修复 H5 / 手机端登录后看不到退出按钮：退出按钮此前被包在 `.profile-actions` 容器里，移动端 `.profile > div { display: none; }` 把整个容器隐藏了。
- 退出按钮改为 `.profile` 的直接子元素；手机端显示图标 + “退出”文字，桌面 / 平板仍为图标按钮。
- Pages 部署 `b9380ef9`，预览地址 `https://b9380ef9.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`；Worker 未改动。
- 验证通过：手机 390×844 实际浏览器确认“退出”可见，桌面仍为图标；TypeScript、Prettier、生产构建。

2026-11-16 我的形象整身 3D 版发布：

- 36 套整身形象按“2 性别 × 2 肤色 × 3 发型 × 3 服饰”一次性生成，每张包含头、发型、脖子、身体、服装和鞋，尺寸 512×683 透明 WebP，放在 `src/assets/full/`；不再运行时拼接头像与身体。
- `UserAvatar` 改为按 `AvatarConfig` 选择对应整身图：`/profile` 使用 `variant="full"` 显示完整全身，35px 侧栏按每张图实测的头部框裁成 bust；草帽、眼镜、皇冠、围巾、胸针仍分层并按头部框缩放对齐。`AvatarConfig`、商店 ID 和 API 未变。
- 肤色只保留浅色 / 小麦色，`SkinTone` 的 `deep` 已移除，`SKIN_OPTIONS` 不再出现深色皮肤。旧深色资源文件未删除，但类型与 UI 不再引用。
- Pages 生产部署 `78289632` 已发布，预览地址 `https://78289632.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`；本次上传 41 个文件，621 个既有文件复用。
- 正式域名 `/profile/` 返回 200，资源指纹为 `main-B56MNJx0.js` / `main-C0C2X5mJ.css`；未登录 `/api/me` 返回 401。线上浏览器用模拟身份确认整身形象、草帽与胸针显示正常。
- 验证通过：`npm run typecheck`、`npm test` 27/27、`npm run build`。本次仅更新 Pages 静态前端与形象资源；Worker、D1 schema、KV、Cron、生产账号和会话均未修改。

2026-11-16 形象比例统一、3D 道具与试戴发布：

- 36 张整身图统一标准化：头高 190px、头宽 190px、头框固定在 `(161, 20)`，可见身体宽 245px，脚底统一在 `y=660`；`FRAMES` 改为同一头框，解决 36 套之间头大/头小、身体宽窄不一的问题。
- 装饰道具不再使用手绘扁平 SVG：草帽、圆眼镜、红围巾、小皇冠、向日葵胸针改为预渲染的 3D 透明素材，按统一头部/身体锚点叠加；6 件道具只生成 6 张素材，不按 36 套形象 × 6 件展开，也不生成全部组合。
- 未购买道具增加“试戴 / 取消试戴”：试戴只改变页面预览，不扣积分、不保存；购买后清除对应试戴状态并写入形象。购买确认仍保留扣分和向日葵阶段提示。
- Pages 生产部署 `d555b11e` 已发布，预览地址 `https://d555b11e.wordsprout-5ud.pages.dev`，正式域名仍为 `https://wordsprout.hatim.eu.org`；`8870ba3d` 为锚点微调前的中间版本。
- 正式域名 `/profile/` 返回 200，资源指纹为 `main-BU6b3vQ4.js` / `main-BA0_3OlS.css`；未登录 `/api/me` 返回 401。线上浏览器用模拟身份确认试戴、取消试戴与 3D 道具显示正常。
- 验证通过：`npm run typecheck`、`npm test` 27/27、`npm run build`。本次仅更新 Pages 静态前端与形象/道具资源；Worker、D1 schema、KV、Cron、生产账号和会话均未修改。

2026-11-16 耳罩耳机替换圆眼镜：

- 商店 `face` 槽位道具由“圆眼镜”改为“小耳机”：新增正面双耳罩、头梁的 3D 透明素材 `src/assets/items/headphones.webp`，按头部锚点叠加；圆眼镜从商店隐藏，保留库存兼容字段，旧配置仍通过 `isAvatarConfig` 校验。
- 道具商店显示 6 件（草帽、小耳机、红围巾、小皇冠、星星背景、向日葵胸针）；旧 `glasses` 不再出现在新商店。
- Pages 生产部署 `30b12f6b`，预览地址 `https://30b12f6b.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org`；正式 `/profile/` 返回 200，新资源指纹 `main-mQDQfLhc.js` / `main-BA0_3OlS.css`，未登录 `/api/me` 返回 401。
- 验证通过：`npm run typecheck`、`npm test` 27/27、`npm run build`。本次仅更新 Pages 静态前端与道具资源；Worker、D1 schema、KV、Cron、生产账号和会话均未修改。

2026-11-17 用户形象分层重构：

- 形象改为分层叠放：同一 1024×1536 画布上的皮肤 / 下装 / 上衣 / 头发四层透明 WebP（转换后 640×960，共 19 个文件、472KB），不再预生成“性别 × 肤色 × 发型 × 服饰”组合图；侧栏 35px 头像从同一组图层裁切头部，`AVATAR_BUST` 控制裁切窗口。
- 肤色恢复并扩展为 3 种（自然色 / 小麦色 / 深肤色）；移除脸型与道具的编辑和渲染，`AvatarConfig` 精简为 `gender/hair/skin/outfit`，`items` 保留为可选兼容字段。装饰商店与购买入口从界面移除，`/api/shop/purchase`、`spend_events` 与已购装饰数据保留；`saveAvatar` 统一走 `normalizeAvatar`，旧的 `face` / `items` 配置不会报错。
- 新增 `assets-src/avatar/` 存放 1024×1536 PNG 母版（不参与构建）与重新生成 WebP 的命令；删除已无引用的 `src/assets/full|avatars|bodies|items` 及四个模块（约 3.8MB），`src/assets` 由 3.8MB 降至 476KB。
- Worker 版本 `2d19468b-1058-411b-9d63-40786b7e1886`；Pages 生产部署 `3eaef3c8`，正式域名 `https://wordsprout.hatim.eu.org`。先发布 API 再发布静态页，保证旧前端在过渡期仍可使用。
- 验证：TypeScript、28 项单元 / 集成测试、生产构建、5 个平板视口布局测试全部通过；线上 `/profile/` 以模拟身份确认三层形象资源均返回 200（640×960），未登录 `/api/me` 返回 401，周榜 API 正常。D1 schema、KV、Cron、生产账号与学习数据未修改。

2026-11-18 形象选项付费解锁：

- 默认形象改为：男孩 寸头 / 自然色 / 短袖，女孩 波波头 / 自然色 / 衬衫；其余发型 1000 分、肤色 500 分、服饰 1500 分，一次解锁永久可用。解锁同时扣当前成长积分与本周积分并写 `spend_events`，周榜净积分和向日葵阶段随之变化。
- 数据：`users` 新增 `owned_styles`（JSON 数组，如 `hair:curly`）；新增 `POST /api/wardrobe/unlock` `{ kind, option }`，沿用积分事务（条件 UPDATE + `changes()=1` 才写消费流水）；`PATCH /api/me/avatar` 校验免费或已解锁，`/api/me` 与登录返回 `unlocked_styles`。
- 迁移 `npm run db:styles -- --remote`：线上补列并把已有形象中正在使用的付费项回填为已解锁——hatim（卷发 / 深肤色 / 背带裤）、果果（丸子头 / 背带裙）、童童（马尾 / 连衣裙）；不扣积分、不写消费流水，其余账号保持 `[]`。
- Worker 版本 `c3cded17-04bd-48da-8074-d2021bf98c0c`；Pages 生产部署 `c4400acc`，正式域名 `https://wordsprout.hatim.eu.org`。发布顺序为数据迁移 → API → 静态页，保证旧形象在过渡期仍可保存。
- 验证：TypeScript、29 项单元 / 集成测试、生产构建、5 个平板视口布局测试全部通过；线上未登录 `/api/me` 返回 401、周榜 200；`/profile/` 以模拟身份确认付费项显示 1000 / 500 / 1500 价格、已解锁的马尾无价格标记、0 积分时确认按钮置灰且不发起请求。

2026-11-18 星榜形象展示：

- Cron 生成周榜 / 总榜快照时写入每人形象，仅保留 `gender / hair / skin / outfit` 四项，不含账号、用户 ID、已购装饰或积分流水；`GET /api/leaderboard` 仍只读 KV，不回源 D1。
- 星榜每行由向日葵改为形象缩略图（右下角保留向日葵阶段小徽章），整行可点开弹窗查看整身形象、名次、轮次、积分与阶段；旧快照或缺形象的条目回退为向日葵，弹窗提示“形象将在下次榜单更新后显示”。
- Worker 版本 `b496848e-dbd1-45a6-80a5-396b427a603e`；Pages 生产部署 `47434872`，正式域名 `https://wordsprout.hatim.eu.org`。
- 验证：TypeScript、29 项测试（Cron 快照包含 avatar，且序列化结果不含 student_id）、生产构建、5 个平板视口布局测试；线上 `/leaderboard` 以模拟快照确认 3 个形象缩略图、1 个旧快照回退、弹窗与关闭正常，无 JS 报错。KV 快照将在下一次 Cron（30 分钟周期）后带上真实形象。

2026-11-18 四套礼服与按选项定价：

- 新增男孩「紫色礼服」`royal`、「蓝色盛装」`ceremony`，女孩「紫罗兰礼服」`lavender`、「粉色礼服」`blush`，每套 3000 分；每个性别现有 5 套服饰。
- 四套素材为 1024×1536 PNG，归档到 `assets-src/avatar/{boy,girl}/top-*.png`，按统一比例转成 640×960 WebP；均为整套（含短裤 / 裙摆），不依赖下装层。
- 定价改为按选项覆盖：`stylePrice(kind, id)`，发型 1000、肤色 500、日常服饰 1500、礼服 3000；服务端扣费与前端价格徽章共用同一函数，避免显示与实扣不一致。
- Worker 版本 `3080fcbe-501e-41d4-8c51-84bc8fa896de`；Pages 生产部署 `483e73dc`，正式域名 `https://wordsprout.hatim.eu.org`。先发 API 再发前端，避免旧接口按 1500 收取新礼服。
- 验证：30 项测试（含礼服 3000 扣费与余额不足）、TypeScript、生产构建、5 个平板视口布局；线上 `/profile/` 五套服饰显示 1500 / 3000 价格，礼服弹窗 3000，解锁后整身图层返回 200，无 JS 报错。

2026-11-18 管理员赠送奖励积分（同时上线手机端形象编辑器与题目图像去重）：

- 后台每行新增「赠送积分」：1–10000 分、可附 40 字原因，写入新表 `gift_events`（含管理员 ID 与时间），客户端 UUID 幂等，重复提交不重复加分。
- 奖励积分独立于成长积分：新增 `users.gift_points`，赠送只增加该列，不计入 `lifetime_points`、总榜、本周星榜或学生本机向日葵。解锁形象时优先扣奖励积分，不足部分才扣成长积分并写 `spend_events`；接口返回 `spent_points` / `spent_gift`，前端只用成长积分部分回调本机扣减。
- 迁移 `npm run db:gifts -- --remote`：创建 `gift_events` 与索引、补 `users.gift_points`；线上 7 个账号成长积分不变、奖励余额均为 0。
- Worker 版本 `522c76e5-f5fa-4e45-9458-12e76d1b8761`；Pages 生产部署 `ad604b76`（首个 `f7d61dcf` 因解锁弹窗仍为旧文案，随即修正重发），正式域名 `https://wordsprout.hatim.eu.org`。
- 同批上线的前端改动：手机端形象页改为单屏编辑器（预览常驻、性别 / 发型 / 肤色 / 服饰分类切换、保存按钮移至顶部，390×844、375×667、360×640 均无滚动）；题目选项按图像去重，一年级与 5 个幼小衔接主题做到每词独立图像。
- 验证：38 项测试（奖励优先抵扣、全额奖励不写 `spend_events`、赠送不增加成长分、幂等与权限）、TypeScript、生产构建、5 个平板视口布局测试；线上以模拟身份确认 440 分（含奖励 120）显示“积分不够”置灰、1400 分（含奖励 1200）解锁 1000 分后余额 400 且成长积分仍为 200，无 JS 报错。

2026-11-18 形象解锁改为“先试穿、后确认”：

- 未解锁的发型 / 肤色 / 服饰改为点击即免费试穿：预览立即换上并显示“试穿预览 · 未解锁”，选项下方出现试穿条（价格、取消试穿、解锁并穿上）；点“解锁并穿上”才弹出扣分确认框。积分不足时按钮直接显示“积分不够”并禁用，不弹窗。
- 确认框不再遮挡预览：桌面固定为右下角卡片（与人物预览零重叠），手机为底部抽屉并隐藏非必要说明；手机试穿条为选项下方的一行，预览高度随试穿状态自动收缩，375×667 下五套服饰 + 试穿条仍可单屏显示，无滚动。
- 取消试穿恢复原形象；切换性别清除试穿状态；Esc 只关闭确认框、保留试穿。
- Pages 生产部署 `2d706606`，正式域名 `https://wordsprout.hatim.eu.org`；仅前端变更，Worker 仍为 `522c76e5-f5fa-4e45-9458-12e76d1b8761`，无数据迁移。
- 验证：38 项测试、TypeScript、生产构建、5 个平板视口布局；线上 `/profile/` 确认点选后无弹窗、试穿条文案正确、桌面卡片 `x=1036` 与人物 `x=346–580` 无重叠、375×667 无滚动且试穿条位于选项下方（552 < 558），无 JS 报错。

2026-11-18 试穿期间禁用保存：

- 修正试穿与保存的语义冲突：试穿未解锁选项时人物已换装，但“保存形象”仍可点（有未保存修改时），会保存成旧形象，容易误解。现在桌面与手机两个保存按钮在试穿期间都禁用。
- 桌面在保存按钮旁提示“试穿中，解锁或取消后才能保存”；手机顶部按钮禁用时改为浅灰绿（`#dfe7d2` / 灰字），与可点击状态明显区分；试穿条副文案改为“N 积分解锁后自动换上并保存”。
- Pages 生产部署 `e50915d8`，正式域名 `https://wordsprout.hatim.eu.org`；仅前端变更，Worker 未动，无数据迁移。
- 验证：线上 `/profile/` 确认改过选项后可保存、试穿卷发时按钮禁用并显示提示、取消试穿后恢复可保存；手机试穿马尾时按钮禁用且背景 `rgb(223,231,210)`；38 项测试与生产构建通过，无 JS 报错。

2026-11-18 主题包、四种题型与题库全量复核：

- 词库选择器新增「主题包」标签页：动物朋友、好吃的食物、校园一天、温暖的家、天气与四季、出门去看看、我的身体、动起来共 8 包，每包 20 词，全部按 ID 引用现有 600 词与同一批 MP3，不新增教材内容、录音或云端资源；主题包进度按包独立保存，不覆盖年级 / 难度进度。
- 每轮 5 题改为固定顺序混合四种题型：看图选中文 → 看中文选英文 → 听发音选英文 → 拼写填空 → 看图选中文。拼写题给单词字母 + 2 个干扰字母，点满自动判卷，支持“退一格”，仅 3–8 个纯字母词可出，含连字符或超长词自动降级为英文选择题；幼小衔接不考拼写，改为认图 / 听音交替。识别题 15 秒、拼写 30 秒。
- 四种题型共用一次对错判定，计分公式、服务端校验与每轮一次 `/api/scores` 写入未变；Worker、D1 schema、KV 快照、Cron 均未修改，仍为 Worker 版本 `522c76e5-f5fa-4e45-9458-12e76d1b8761`。
- 题库全量复核：600 词无重复 id / 英文 / 释义，600 个 MP3 与词条一一对应（60 条开放许可录音 + 540 条 Piper 合成），8 个主题包 160 条、5 个幼小衔接主题 50 条均在白名单内且无重复。修正 15 处会造成“两个选项都说得通”的释义冲突（如 OK、country、learn、nice、well、fear、choose / pick、start / begin、finish / complete、bright、programme、game / race、hard、bag / schoolbag、sister / brother）；`bag` 在幼小衔接和校园主题中改用 `schoolbag`。
- 补齐三年级缺失的 November / December：替换低优先级的 hill / cheese，使用同一 Piper 模型（`en_US-ljspeech-high` 1.8.0）生成音频并更新 `sources.json`，保持 600 词、每年级 100、600 个 MP3。
- Pages 生产部署 `d46cb97d`，预览地址 `https://d46cb97d.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org`。仅前端与静态音频变更，无数据迁移。
- 验证：50 项单元 / 集成测试、`npm run check:vocabulary`、内容版权审计、TypeScript、Prettier、生产构建全部通过；正式域名首页 200、`/api/me` 未登录 401、榜单 200，`november.mp3` / `december.mp3` 返回 200，已下线的 `hill.mp3` 返回 404；预览地址以模拟身份在 393×851 下完成“主题包 → 动物朋友”整轮，实际出现 picture / reverse / listen / spell / picture 五种题型且全部判定正确，无横向溢出、无 JS 报错，未写入生产账号或学习数据。

2026-11-19 周积分口径文案澄清（仅前端）：

- 问题：完成页显示“+50 成长积分”，星榜“本周积分”却是净积分（本周获得 − 本周形象 / 道具消费），且 KV 快照每 30 分钟才刷新，导致用户看到 50 与 20 不一致。核对生产流水确认计算无误，属于口径与文案问题。
- 前端文案：星榜周榜改称「本周净积分」，副标题写明“本周净积分 = 学习获得 − 形象消费 · 每 30 分钟更新”；榜单条目与详情弹窗同步改标签；完成页在积分下方加注“成长积分已到账；星榜本周净积分每 30 分钟更新一次”；后台学生列表改称“本周获得”（毛获得，不扣消费）并补充口径说明；形象页解锁提示同步改为“扣当前积分和本周净积分”。
- 算法、Worker、D1、KV、Cron 均未改动，排名规则与计分公式不变。
- Pages 生产部署 `c80f6cf3`，正式域名资源指纹 `main-8_iKmPMI.js` / `main-mGHN5xdZ.css`，与本机构建一致。
- 验证：TypeScript、Prettier、50 项单元测试、生产构建全部通过；线上 393×851 以模拟身份渲染周榜，副标题完整换行、标签显示“本周净积分”、横向溢出 0、无 JS 报错。

2026-11-19 主题包对话选词填空铺满八个主题包：

- 新增第五种题型「对话选词填空」：2–3 句微对话留一个空，三选一填词，30 秒；按题型顺序进入主题包第 2 题（看图 → 对话 → 听音 → 拼写 → 看图），年级 / 难度 / 幼小衔接不考对话。对话题进入时不播报答案音频，避免直接泄题；「中文提示」显示保留空位的中文整段，收起后回到原文。
- 语料从动物朋友 14 条扩到 8 包 145 条微对话（新增 131 条），覆盖全部 160 个主题词（每包 20/20）；每题答案与干扰项都来自同一个包，全篇恰好一个 `___`，`a/an` 与答案首字母一致，背景词只使用 `scripts/check-vocabulary.mjs` 的胶水词表。
- 排版修正：空位与其后的标点绑成一组，窄屏不再出现句号单独换行；英文选项含 7 个字母以上时（≤600px）改为整行排列，`bedroom` / `watermelon` 等词不再从中间断词。
- 计分公式、服务端校验、每轮一次 `/api/scores` 写入均未变；Worker 仍为 `522c76e5-f5fa-4e45-9458-12e76d1b8761`，无 D1 / KV / Cron 变更。
- Pages 生产部署 `d1472d70`，预览地址 `https://d1472d70.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org`，资源指纹 `main-BatXDdKL.js` / `main-CN-aJeaX.css`。
- 验证：55 项单元 / 集成测试、`npm run check:vocabulary`（145 条对话、160 个主题词全覆盖）、TypeScript、Prettier、生产构建全部通过；本地 320px 让 8 个主题包各跑完整一轮、393px 抽查 3 包，均出现对话题且无横向溢出、无 JS 报错；线上 360×780 以模拟身份完成「校园一天」两题，第 2 题 `data-quiz=dialogue`，无溢出、无业务报错（仅 Cloudflare Insights 被 CSP 拦截的既有告警）。

2026-11-25 双主题与语文 / 数学科目（本地实现）：

- 新增两套界面皮肤：男孩「森林探险队」蓝色、女孩「花园小队」玫红。登录后由 `avatar.gender` 自动应用，无手动开关；登录页与尚未选择性别的账号保留原绿色。实现方式是在 `html[data-theme='boy'|'girl']` 上覆盖一组 `--ws-*` CSS 变量，并让首页、语文 / 数学答题页、星榜、我的形象和暂停弹窗消费这些变量；布局、插画与形象图层未改。
- 新增语文 507 题（一年级 151 / 二年级 185 / 三年级 171）与数学 51 类随机题型（每年级 17 类）。两者沿用 5 题一轮、每题 30 秒与 `correct*10 + repaired*5` 计分，因此 `parseScore`、`score_events`、`lifetime_points`、KV 快照与 Cron 均无需改动，本次发布只需更新 Pages 静态资源。
- 科目与年级保存在账号隔离的本地进度（`progress.subject` / `progress.subjectBookId` / `progress.subjects`），刷新后保持；语文 / 数学的补错池按科目书单独存放，数学以题型 ID 为键，重做错题时数字重新生成。
- 新增 `npm run check:subjects` 并串入 `npm run build`：校验 6 个科目书、年级隔离、语文题量与题型分布、拼音与单选答案，以及 51 类数学题型各 250 组抽样的选项去重。
- 本地验证：64 项单元 / 集成测试、Prettier、`tsc -b`、生产构建全部通过；WebKit 在 320 / 393 / 1280 三种宽度、男 / 女两套皮肤下均无横向溢出与 JS 报错，语文与数学三个年级各完成整轮（5 题）并进入结果页；“我的形象”改性别保存后皮肤即时切换，刷新仍保持。
- 发布步骤与以往一致：`npm run build` → `npm run deploy:web`；本次无需 `deploy:api`、无数据迁移。上线后需在真实账号上复核一次性别切换与语文 / 数学各一轮。

2026-11-25 双主题与语文 / 数学科目（已发布）：

- Pages 生产部署 `e530b5f5`，预览地址 `https://e530b5f5.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org`（已确认引用新指纹）；资源指纹 `main-CJVZzHGJ.js` / `main-KMCt_VM0.css`，本次上传 6 个变更文件，其余 643 个复用。
- 仅发布 Pages 静态资源，Worker 未重新部署，无 D1 / KV / Cron 变更，无数据迁移。
- 线上验证（预览地址，API 使用模拟身份，不写生产数据）：393px 男 / 女各完成语文与数学整轮（5 题），两轮均只发一次 `/api/scores`，报文体仍为 `words_learned=5`、`total_count=5`、`points_earned` 由计数推导；皮肤 `dataset.theme` 与账号性别一致，320px 无横向溢出，控制台与页面均无报错（截图流程中出现的 CSP `style-src` 提示来自 Playwright 截图注入的隐藏光标样式，非应用问题）。
- 待真实账号复核：在“我的形象”改性别保存后皮肤切换，以及学生账号上语文 / 数学各一轮的积分到账与星榜刷新。

2026-11-25 语文 / 数学补齐四至六年级（已发布）：

- Pages 生产部署 `e38e62eb`，预览地址 `https://e38e62eb.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org` 已引用新指纹 `main-aeZmePA5.css` / `main-Bs82e9MH.js`。仅静态资源，Worker 未重新部署，无 D1 / KV / Cron 变更。
- 年级类型由 1–3 扩到 1–6，科目书从 6 本增到 12 本（语文 / 数学各 6 个年级）。语文 959 题（151 / 185 / 171 / 151 / 151 / 150），新增多音字、修辞手法、关联词、文学常识、字词理解，并把四到六年级的反义词改成词语级、干扰项单独给出；数学 102 类题型（每年级 17 类），补充大数、小数运算、因数倍数、方程、分数百分数、比与比例、圆 / 圆柱 / 圆锥、负数与比例尺。
- 修正了题库里“两个关联词都讲得通”的歧义项（尤其“只要……就……”与“只有……才……”同时出现），并替换了两句兼有比喻的夸张例句；`check:subjects` 增加 4–6 年级覆盖，分数题选项统一做字符串级去重。
- 年级选择在桌面排一行 6 格、≤820px 排 3×2；此前男孩主题的 hero 渐变末端偏绿、第 5 张预览卡也是绿色，本次一并改为蓝调。
- 验证：64 项测试、Prettier、`tsc -b`、`npm run build` 全过；`check:subjects` 的 25,500 次抽样之外另做 204 万次全题型抽样，无重复选项 / 缺答案 / `NaN`；线上男女账号各完成语文四年级与数学六年级整轮，每轮一次 `/api/scores`、`total_count=5`，320px 无溢出、无报错。
- 待真实账号复核：六年级数学的应用题文字较长，建议在平板上实际做一轮看换行与字号。

2026-11-25 题库年级归属校准（已发布）：

- 识字表改为按统编版册次分册，不再按“自然 / 颜色 / 动作”主题分组：一年级 50 字（一上、一下）、二年级 47 字（二上、二下）、三年级 44 字（三上）。原先落在三年级的家、门、窗、车、船、椅、帽、鞋等一上字已移除，三年级改用晨、绒、球、汉、艳、服、装、扮、静、停、粗、影、蜘、蛛、漂、洞、睡、富、饶等三上生字。
- 古诗按课文所在册重排：《江雪》归二上，《赠汪伦》《小池》归一下，《枫桥夜泊》归五上，《出塞》《凉州词》《鹿柴》归四上；同时补入《画》《江南》《梅花》《夜宿山寺》《敕勒歌》《所见》《赠刘景文》《夜书所见》《望天门山》《饮湖上初晴后雨》《望洞庭》《惠崇春江晚景》《三衢道中》《元日》《清明》《嫦娥》《观书有感》《稚子弄冰》《村晚》《从军行》《闻官军收河南河北》《游子吟》《寒食》《迢迢牵牛星》《卜算子·送鲍浩然之浙东》《浣溪沙》，删去不属统编教材的《牧童》《舟过安仁》《泊船瓜洲》《秋思》《别董大》。
- 成语按课文出现年级优先：二年级只保留守株待兔、亡羊补牢、狐假虎威、坐井观天、拔苗助长；自相矛盾、滥竽充数上调到五年级，画蛇添足、掩耳盗铃、刻舟求剑上调到三年级，叶公好龙、惊弓之鸟、对牛弹琴上调到四年级。三年级量词改为则 / 篇 / 串 / 阵 / 簇 / 弯 / 尊 / 块 / 道，词语搭配改为收集资料、制定计划等，偏旁部首换成三上生字。
- 数学按人教版单元顺序校正：两位数加 / 减一位数改为两位数加 / 减两位数（进位 / 退位，二上）；二年级“经过的时间”改为“认识几时几分”（二上）；有余数除法从三年级移到二下；三年级补“时、分、秒”（三上）；四年级补“角的计算”（四上）；植树问题从四年级移到五上（五上数学广角）。
- 结果：语文 1014 题（一年级 157、二年级 188、三年级 186、四年级 163、五年级 162、六年级 158），数学 104 类（17 / 18 / 17 / 17 / 18 / 17）。新增 `curriculum placement` 测试，题型放错年级会直接失败；67 项测试、`npm run check:subjects`（1014 题、104 类、26000 组抽样）、`tsc -b`、`npm run build` 全部通过。
- Pages 部署 `126f2ea0`，预览地址 `https://126f2ea0.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org` 已引用新指纹 `main-zzmdizdP.js`（CSS 未变，仍为 `main-aeZmePA5.css`）。仅静态资源，Worker、D1、KV、Cron 未动。
- 线上复核：一年级语文首题「rén → 人」、三年级语文首题「蛛」的偏旁、二年级数学首题时间单位，均符合该年级；整轮 5 题计分仍是一次 `/api/scores`、`total_count=5`，控制台无报错、无横向溢出。
- 说明：篇目归属以统编版语文、人教版数学为准；不同地区使用的教材版本可能略有差异，若某篇在你所用版本中换了册次，改 `src/data/chinese.ts` 里对应一行的 `grade` 即可重新生成。

2026-11-25 双主题插画与生图接口迁移（已发布）：

- Pages 生产部署 `5f1ffd30`，预览地址 `https://5f1ffd30.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org` 已引用新指纹 `main-BoNTDm0y.js` / `main-DYAjmfcC.css`。仅静态资源，Worker、D1、KV、Cron 未动，无 API 变更。
- 首次上线项目自带插画：`public/art/` 共 208 张透明底 WebP，含 8 张场景图（hero-boy / hero-girl 720×1080，三科静物 512²，提示卡与奖章 256²）与 200 张单词图（384²，一年级 100、二年级 100）。`/art/*` 单独设置 `Cache-Control: public, max-age=604800`。
- 生图接口从 lowseek 的 images 协议迁到 orbitix 的 chat 协议（`/v1/chat/completions`，模型 `gpt-image-2.5-flare`），图片以 base64 data URL 返回；客户端收敛到 `scripts/art-api.mjs`，密钥只放在本机 `.env.art`（0600，已 gitignore）。
- 本次用新接口重画 8 张场景图，并按下尺寸可读性调整 `eye` / `ear` / `foot` 三张词图。人物类提示词补充 "hand-drawn only (not 3D, not CGI, not a photograph)"，否则四宫格会混入照片级写实。
- 发布前校验：`check:art` 通过（8 场景 + 200 词图，一年级 100/100、二年级 100/100）、68 项测试、Prettier、`npm run build` 全过。
- 线上复核：首页 200 且指纹为新值；`/art/hero-boy.webp`、`/art/words/{eye,ear,foot}.webp` 均 200、`image/webp`、7 天缓存；393px 模拟男女账号，hero 自然尺寸 720×1080、渲染 351×375，主题 `dataset.theme` 分别为 boy / girl，横向溢出 0、JS 报错 0。
- 注意：Cloudflare 会注入 `static.cloudflareinsights.com/beacon.min.js`，被现有严格 CSP（`script-src 'self'`）拦截，控制台会出现一条 `csp` 失败请求，属预期行为，不影响功能。
- 本次 wrangler 的 OAuth 凭据已过期，非交互环境无法刷新，改用 `npx wrangler login --device` 设备码重新授权后发布。

2026-11-25 双主题画风上线（已发布）：

- Pages 生产部署 `e5770d34`，预览地址 `https://e5770d34.wordsprout-5ud.pages.dev`，正式域名已引用新指纹 `main-DU9Jd9-x.js` / `main-B7zQh1xL.css`。仅静态资源，Worker / D1 / KV / Cron 未动。
- 内容：男孩主题改为圆润玩具机甲（冷钢蓝 + 石墨 + 蜜橙），女孩改为萌趣 chibi 卡通（糖果粉 + 薄荷 + 奶油黄）；重画 `hero-boy` / `hero-girl` / `note-boy` / `note-girl` 四张。对应提交 `e4e93f1`。
- 发布时发现 `/art/*` 的 7 天缓存会用旧图：文件名固定，重画后 URL 不变，边缘 `cf-cache-status: HIT`、`age` 持续增长，回访浏览器同样会留旧图一周。修法是给插画 URL 加内容版本号——`scripts/art-manifest.mjs` 对 208 个文件算 md5 前 8 位写进 `src/data/word-images.ts` 的 `ART_REV`，`src/lib/art.ts` 与 `wordImage()` 统一拼成 `/art/xxx.webp?v=<rev>`；`check:art` 会比对实际文件与 `ART_REV`，过期即失败，手工替换图片后跑 `npm run art:manifest`。
- 首次部署 `519cb2fa` 已上传新图但被旧缓存遮住，加版本号后重新部署为 `e5770d34`。线上 `/art/hero-boy.webp?v=3c2ef554` 返回 174050B，与 `dist` 一致。
- 发布前校验：`check:art`（8 场景 + 200 词图，一年级 100/100、二年级 100/100）、68 项测试、Prettier、`npm run build` 全过。
- 线上复核：393px 模拟男女账号，hero 请求为 `/art/hero-*.webp?v=3c2ef554`、自然尺寸 720×1080、渲染 351×375，横向溢出 0、JS 报错 0；除已知的 Cloudflare Insights beacon 被 CSP 拦截外无失败请求。

2026-11-26 先开局再选科目 / 去掉顶栏 / 男孩暗黑金属（已发布）：

- 开局顺序改为“先点开始，再选条件”：首页只留「开始一轮学习」，科目、年级（或主题包）、难度收进 `RoundSetup` 弹层；确认后把 `{ subject, bookId }` 交给页面自动 `start()`，不用再点一次。学习页与语文 / 数学练习页都复用同一入口。
- 去掉顶部栏：删除 `<header class="topbar">`，我的花园 / 我的形象 / 成长星榜三个页签不再出现顶部头像与退出图标；退出登录固定到移动端页脚（`.mobile-logout`）与桌面侧栏底部（`.sidebar-logout`），文案统一为「退出登录」。
- 男孩主题改为暗黑金属：`--ws-bg #12161c`、`--ws-surface #1b212a`、`--ws-line #2d3742`，按钮改拉丝钢渐变（`#f4f8fc → #ccd6e1 → #9dabba`），以蜜橙作点缀；反馈、星榜选中态、hero 光晕、题目水印逐项做暗色适配。女孩主题保持糖果粉不变。
- 浏览器地址栏颜色跟随皮肤：`applyTheme()` 同步 `<meta name="theme-color">`，男孩 `#12161c`、女孩 `#fff6fa`，避免暗色页面顶一条浅色工具栏。
- 发布前校验：`check:art`（8 场景 + 200 词图）、68 项测试、Prettier、`npm run build` 全过。
- Pages 部署 `b1a5c397`（首轮 `3f977940` 因补主题色被覆盖），预览地址 `https://b1a5c397.wordsprout-5ud.pages.dev`，正式域名 `https://wordsprout.hatim.eu.org` 已引用新指纹 `main-Bg9ZXqiH.js` / `main-BhzFmXtb.css`。仅静态资源，Worker / D1 / KV / Cron 未动。
- 线上复核（393px，模拟男女账号）：`dataset.theme` 分别为 boy / girl，`theme-color` 分别为 `#12161c` / `#fff6fa`；三页均无 `.topbar`，横向溢出 0；首页 CTA → 弹层 → 自动进入首题（apple / 1-5）链路打通；底部“退出登录”与桌面侧栏按钮均可见；`/art/*?v=3c2ef554` 全部 200、`image/webp`；除既有的 Cloudflare Insights beacon 被 CSP 拦截外无 JS 报错。

2026-11-26 手机端顶部统一为页签栏、退出登录改为文字链（已发布）：

- 顶部统一：手机上不再出现品牌栏，任何页签（我的花园 / 我的形象 / 成长星榜）都只保留一行页签，切换时高度恒为 51px，不再出现“形象页没有、其他页有”的跳动。桌面与平板侧栏仍保留品牌。
- 页签改胶囊：手机端去掉 2px 底边高亮（原来在暗色下是一条刺眼白线），改为圆角 10px 的浅色胶囊，选中态用各主题的 `--ws-accent-soft` / `--ws-accent-strong`；平板仍用下划线页签。
- 退出登录改为低干扰文字链：手机端从整宽 14px 内边距大按钮（约 350×50）缩到 88×31 的文字链，居中放在页脚下方；桌面侧栏同样改为用户卡下方的 12px 文字链。触屏设备仍保留 44px 最小点击区（`min-height: 44px` 但背景透明），既不容易误触也不显眼。
- `profile-mode` 里重复的品牌隐藏 / 侧栏内边距规则已删除，避免手机端两套顶部实现再次分叉。
- 测试：`tests/layout/tablet.spec.ts` 仍按“首页直接显示词库选择器”的旧流程断言（该流程在上一版已改成弹层），本次一并改成“点开始一轮学习 → 弹层内选词库 → 开始这一轮”，并把已删除的 `.preview-card` 断言换成 `aria-pressed`。Chromium 5 组平板视口全部通过；68 项单元测试、Prettier、`npm run build` 通过。
- Pages 部署 `25878c6c`，预览地址 `https://25878c6c.wordsprout-5ud.pages.dev`，正式域名已引用新指纹 `main-D9tUHHlE.js` / `main-D7d_UOxq.css`。仅静态资源，Worker / D1 / KV / Cron 未动。
- 线上复核（393px，触屏模拟）：三个页签顶部均为 51px、无品牌栏、横向溢出 0、JS 报错 0；底部退出登录 88×44（视觉为 12px 文字 + 透明底），点击区达标但不再抢视线。
- 待办：`tests/e2e/` 下的 audio / catalog / game-sound / learning 四条用例仍按改版前的开局流程编写（点一次即开局、首页常驻词库选择器），尚未迁移到弹层流程，本次未运行。
