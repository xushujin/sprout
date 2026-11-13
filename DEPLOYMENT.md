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
