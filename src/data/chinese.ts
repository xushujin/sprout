import { GRADES, seededRandom, shuffle, type Grade, type SubjectQuestion } from './question.ts';

// Every question here is authored, not scraped. The atom tables below are the
// single source of truth: characters carry their reading, poems carry both
// lines, and the builder only assembles options. Keeping data and rendering
// apart is what makes `scripts/check-subjects.mjs` able to audit 500 questions.

interface CharRow {
  char: string;
  pinyin: string;
  grade: Grade;
}

const CHARS: CharRow[] = [
  // 一年级上册：识字 1—10 与课文里的常用字
  { char: '天', pinyin: 'tiān', grade: 1 },
  { char: '地', pinyin: 'dì', grade: 1 },
  { char: '人', pinyin: 'rén', grade: 1 },
  { char: '你', pinyin: 'nǐ', grade: 1 },
  { char: '我', pinyin: 'wǒ', grade: 1 },
  { char: '他', pinyin: 'tā', grade: 1 },
  { char: '大', pinyin: 'dà', grade: 1 },
  { char: '小', pinyin: 'xiǎo', grade: 1 },
  { char: '多', pinyin: 'duō', grade: 1 },
  { char: '少', pinyin: 'shǎo', grade: 1 },
  { char: '上', pinyin: 'shàng', grade: 1 },
  { char: '下', pinyin: 'xià', grade: 1 },
  { char: '口', pinyin: 'kǒu', grade: 1 },
  { char: '耳', pinyin: 'ěr', grade: 1 },
  { char: '目', pinyin: 'mù', grade: 1 },
  { char: '手', pinyin: 'shǒu', grade: 1 },
  { char: '足', pinyin: 'zú', grade: 1 },
  { char: '日', pinyin: 'rì', grade: 1 },
  { char: '月', pinyin: 'yuè', grade: 1 },
  { char: '水', pinyin: 'shuǐ', grade: 1 },
  { char: '火', pinyin: 'huǒ', grade: 1 },
  { char: '山', pinyin: 'shān', grade: 1 },
  { char: '石', pinyin: 'shí', grade: 1 },
  { char: '田', pinyin: 'tián', grade: 1 },
  { char: '禾', pinyin: 'hé', grade: 1 },
  { char: '云', pinyin: 'yún', grade: 1 },
  { char: '雨', pinyin: 'yǔ', grade: 1 },
  { char: '风', pinyin: 'fēng', grade: 1 },
  { char: '花', pinyin: 'huā', grade: 1 },
  { char: '鸟', pinyin: 'niǎo', grade: 1 },
  { char: '虫', pinyin: 'chóng', grade: 1 },
  { char: '马', pinyin: 'mǎ', grade: 1 },
  { char: '土', pinyin: 'tǔ', grade: 1 },
  { char: '画', pinyin: 'huà', grade: 1 },
  { char: '打', pinyin: 'dǎ', grade: 1 },
  { char: '鸡', pinyin: 'jī', grade: 1 },
  { char: '字', pinyin: 'zì', grade: 1 },
  { char: '词', pinyin: 'cí', grade: 1 },
  { char: '爸', pinyin: 'bà', grade: 1 },
  { char: '妈', pinyin: 'mā', grade: 1 },

  // 一年级下册
  { char: '春', pinyin: 'chūn', grade: 1 },
  { char: '冬', pinyin: 'dōng', grade: 1 },
  { char: '雪', pinyin: 'xuě', grade: 1 },
  { char: '草', pinyin: 'cǎo', grade: 1 },
  { char: '树', pinyin: 'shù', grade: 1 },
  { char: '叶', pinyin: 'yè', grade: 1 },
  { char: '果', pinyin: 'guǒ', grade: 1 },
  { char: '鱼', pinyin: 'yú', grade: 1 },
  { char: '牛', pinyin: 'niú', grade: 1 },
  { char: '羊', pinyin: 'yáng', grade: 1 },

  // 二年级上册
  { char: '宜', pinyin: 'yí', grade: 2 },
  { char: '实', pinyin: 'shí', grade: 2 },
  { char: '色', pinyin: 'sè', grade: 2 },
  { char: '金', pinyin: 'jīn', grade: 2 },
  { char: '尽', pinyin: 'jìn', grade: 2 },
  { char: '丰', pinyin: 'fēng', grade: 2 },
  { char: '壮', pinyin: 'zhuàng', grade: 2 },
  { char: '劳', pinyin: 'láo', grade: 2 },
  { char: '洁', pinyin: 'jié', grade: 2 },
  { char: '勤', pinyin: 'qín', grade: 2 },
  { char: '保', pinyin: 'bǎo', grade: 2 },
  { char: '护', pinyin: 'hù', grade: 2 },
  { char: '朋', pinyin: 'péng', grade: 2 },
  { char: '奇', pinyin: 'qí', grade: 2 },
  { char: '怪', pinyin: 'guài', grade: 2 },
  { char: '故', pinyin: 'gù', grade: 2 },
  { char: '事', pinyin: 'shì', grade: 2 },
  { char: '母', pinyin: 'mǔ', grade: 2 },
  { char: '亲', pinyin: 'qīn', grade: 2 },
  { char: '旁', pinyin: 'páng', grade: 2 },
  { char: '观', pinyin: 'guān', grade: 2 },
  { char: '野', pinyin: 'yě', grade: 2 },
  { char: '菊', pinyin: 'jú', grade: 2 },
  { char: '橙', pinyin: 'chéng', grade: 2 },
  { char: '送', pinyin: 'sòng', grade: 2 },
  { char: '挑', pinyin: 'tiāo', grade: 2 },
  { char: '旅', pinyin: 'lǚ', grade: 2 },
  { char: '晒', pinyin: 'shài', grade: 2 },
  { char: '极', pinyin: 'jí', grade: 2 },
  { char: '傍', pinyin: 'bàng', grade: 2 },
  { char: '越', pinyin: 'yuè', grade: 2 },
  { char: '滴', pinyin: 'dī', grade: 2 },
  { char: '溪', pinyin: 'xī', grade: 2 },
  { char: '奔', pinyin: 'bēn', grade: 2 },
  { char: '洋', pinyin: 'yáng', grade: 2 },
  { char: '波', pinyin: 'bō', grade: 2 },
  { char: '涛', pinyin: 'tāo', grade: 2 },
  { char: '灾', pinyin: 'zāi', grade: 2 },
  { char: '屋', pinyin: 'wū', grade: 2 },
  { char: '瓦', pinyin: 'wǎ', grade: 2 },
  { char: '含', pinyin: 'hán', grade: 2 },
  { char: '岭', pinyin: 'lǐng', grade: 2 },
  { char: '危', pinyin: 'wēi', grade: 2 },
  { char: '辰', pinyin: 'chén', grade: 2 },
  { char: '恐', pinyin: 'kǒng', grade: 2 },
  { char: '炉', pinyin: 'lú', grade: 2 },
  { char: '霞', pinyin: 'xiá', grade: 2 },

  // 三年级上册
  { char: '晨', pinyin: 'chén', grade: 3 },
  { char: '绒', pinyin: 'róng', grade: 3 },
  { char: '球', pinyin: 'qiú', grade: 3 },
  { char: '汉', pinyin: 'hàn', grade: 3 },
  { char: '艳', pinyin: 'yàn', grade: 3 },
  { char: '服', pinyin: 'fú', grade: 3 },
  { char: '装', pinyin: 'zhuāng', grade: 3 },
  { char: '扮', pinyin: 'bàn', grade: 3 },
  { char: '静', pinyin: 'jìng', grade: 3 },
  { char: '停', pinyin: 'tíng', grade: 3 },
  { char: '粗', pinyin: 'cū', grade: 3 },
  { char: '影', pinyin: 'yǐng', grade: 3 },
  { char: '假', pinyin: 'jiǎ', grade: 3 },
  { char: '落', pinyin: 'luò', grade: 3 },
  { char: '荒', pinyin: 'huāng', grade: 3 },
  { char: '笛', pinyin: 'dí', grade: 3 },
  { char: '舞', pinyin: 'wǔ', grade: 3 },
  { char: '狂', pinyin: 'kuáng', grade: 3 },
  { char: '罚', pinyin: 'fá', grade: 3 },
  { char: '排', pinyin: 'pái', grade: 3 },
  { char: '列', pinyin: 'liè', grade: 3 },
  { char: '规', pinyin: 'guī', grade: 3 },
  { char: '则', pinyin: 'zé', grade: 3 },
  { char: '乱', pinyin: 'luàn', grade: 3 },
  { char: '棕', pinyin: 'zōng', grade: 3 },
  { char: '蜘', pinyin: 'zhī', grade: 3 },
  { char: '蛛', pinyin: 'zhū', grade: 3 },
  { char: '漂', pinyin: 'piāo', grade: 3 },
  { char: '洞', pinyin: 'dòng', grade: 3 },
  { char: '准', pinyin: 'zhǔn', grade: 3 },
  { char: '备', pinyin: 'bèi', grade: 3 },
  { char: '暴', pinyin: 'bào', grade: 3 },
  { char: '睡', pinyin: 'shuì', grade: 3 },
  { char: '壁', pinyin: 'bì', grade: 3 },
  { char: '富', pinyin: 'fù', grade: 3 },
  { char: '饶', pinyin: 'ráo', grade: 3 },
  { char: '优', pinyin: 'yōu', grade: 3 },
  { char: '浅', pinyin: 'qiǎn', grade: 3 },
  { char: '岩', pinyin: 'yán', grade: 3 },
  { char: '虎', pinyin: 'hǔ', grade: 3 },
  { char: '挺', pinyin: 'tǐng', grade: 3 },
  { char: '鼓', pinyin: 'gǔ', grade: 3 },
  { char: '宝', pinyin: 'bǎo', grade: 3 },
  { char: '贵', pinyin: 'guì', grade: 3 },
];

interface PoemRow {
  title: string;
  first: string;
  second: string;
  grade: Grade;
}

const POEMS: PoemRow[] = [
  // 一年级上册：语文园地与识字课的短诗
  { title: '咏鹅', first: '鹅，鹅，鹅', second: '曲项向天歌', grade: 1 },
  { title: '咏鹅', first: '白毛浮绿水', second: '红掌拨清波', grade: 1 },
  { title: '画', first: '远看山有色', second: '近听水无声', grade: 1 },
  { title: '画', first: '春去花还在', second: '人来鸟不惊', grade: 1 },
  { title: '悯农', first: '锄禾日当午', second: '汗滴禾下土', grade: 1 },
  { title: '悯农', first: '谁知盘中餐', second: '粒粒皆辛苦', grade: 1 },
  { title: '江南', first: '江南可采莲', second: '莲叶何田田', grade: 1 },
  { title: '江南', first: '鱼戏莲叶东', second: '鱼戏莲叶西', grade: 1 },

  // 一年级下册
  { title: '静夜思', first: '床前明月光', second: '疑是地上霜', grade: 1 },
  { title: '静夜思', first: '举头望明月', second: '低头思故乡', grade: 1 },
  { title: '春晓', first: '春眠不觉晓', second: '处处闻啼鸟', grade: 1 },
  { title: '春晓', first: '夜来风雨声', second: '花落知多少', grade: 1 },
  { title: '池上', first: '小娃撑小艇', second: '偷采白莲回', grade: 1 },
  { title: '池上', first: '不解藏踪迹', second: '浮萍一道开', grade: 1 },
  { title: '小池', first: '泉眼无声惜细流', second: '树阴照水爱晴柔', grade: 1 },
  { title: '小池', first: '小荷才露尖尖角', second: '早有蜻蜓立上头', grade: 1 },
  { title: '赠汪伦', first: '李白乘舟将欲行', second: '忽闻岸上踏歌声', grade: 1 },
  { title: '赠汪伦', first: '桃花潭水深千尺', second: '不及汪伦送我情', grade: 1 },

  // 二年级上册
  { title: '梅花', first: '墙角数枝梅', second: '凌寒独自开', grade: 2 },
  { title: '梅花', first: '遥知不是雪', second: '为有暗香来', grade: 2 },
  { title: '登鹳雀楼', first: '白日依山尽', second: '黄河入海流', grade: 2 },
  { title: '登鹳雀楼', first: '欲穷千里目', second: '更上一层楼', grade: 2 },
  { title: '望庐山瀑布', first: '日照香炉生紫烟', second: '遥看瀑布挂前川', grade: 2 },
  { title: '望庐山瀑布', first: '飞流直下三千尺', second: '疑是银河落九天', grade: 2 },
  { title: '江雪', first: '千山鸟飞绝', second: '万径人踪灭', grade: 2 },
  { title: '江雪', first: '孤舟蓑笠翁', second: '独钓寒江雪', grade: 2 },
  { title: '夜宿山寺', first: '危楼高百尺', second: '手可摘星辰', grade: 2 },
  { title: '夜宿山寺', first: '不敢高声语', second: '恐惊天上人', grade: 2 },
  { title: '敕勒歌', first: '敕勒川，阴山下', second: '天似穹庐，笼盖四野', grade: 2 },
  { title: '敕勒歌', first: '天苍苍，野茫茫', second: '风吹草低见牛羊', grade: 2 },

  // 二年级下册
  { title: '村居', first: '草长莺飞二月天', second: '拂堤杨柳醉春烟', grade: 2 },
  { title: '村居', first: '儿童散学归来早', second: '忙趁东风放纸鸢', grade: 2 },
  { title: '咏柳', first: '碧玉妆成一树高', second: '万条垂下绿丝绦', grade: 2 },
  { title: '咏柳', first: '不知细叶谁裁出', second: '二月春风似剪刀', grade: 2 },
  { title: '绝句', first: '两个黄鹂鸣翠柳', second: '一行白鹭上青天', grade: 2 },
  { title: '绝句', first: '窗含西岭千秋雪', second: '门泊东吴万里船', grade: 2 },
  {
    title: '晓出净慈寺送林子方',
    first: '毕竟西湖六月中',
    second: '风光不与四时同',
    grade: 2,
  },
  {
    title: '晓出净慈寺送林子方',
    first: '接天莲叶无穷碧',
    second: '映日荷花别样红',
    grade: 2,
  },

  // 三年级上册
  { title: '所见', first: '牧童骑黄牛', second: '歌声振林樾', grade: 3 },
  { title: '所见', first: '意欲捕鸣蝉', second: '忽然闭口立', grade: 3 },
  { title: '山行', first: '远上寒山石径斜', second: '白云生处有人家', grade: 3 },
  { title: '山行', first: '停车坐爱枫林晚', second: '霜叶红于二月花', grade: 3 },
  { title: '赠刘景文', first: '荷尽已无擎雨盖', second: '菊残犹有傲霜枝', grade: 3 },
  { title: '赠刘景文', first: '一年好景君须记', second: '最是橙黄橘绿时', grade: 3 },
  { title: '夜书所见', first: '萧萧梧叶送寒声', second: '江上秋风动客情', grade: 3 },
  { title: '夜书所见', first: '知有儿童挑促织', second: '夜深篱落一灯明', grade: 3 },
  { title: '望天门山', first: '天门中断楚江开', second: '碧水东流至此回', grade: 3 },
  { title: '望天门山', first: '两岸青山相对出', second: '孤帆一片日边来', grade: 3 },
  { title: '饮湖上初晴后雨', first: '水光潋滟晴方好', second: '山色空蒙雨亦奇', grade: 3 },
  { title: '饮湖上初晴后雨', first: '欲把西湖比西子', second: '淡妆浓抹总相宜', grade: 3 },
  { title: '望洞庭', first: '湖光秋月两相和', second: '潭面无风镜未磨', grade: 3 },
  { title: '望洞庭', first: '遥望洞庭山水翠', second: '白银盘里一青螺', grade: 3 },
  { title: '早发白帝城', first: '朝辞白帝彩云间', second: '千里江陵一日还', grade: 3 },
  { title: '早发白帝城', first: '两岸猿声啼不住', second: '轻舟已过万重山', grade: 3 },

  // 三年级下册
  { title: '绝句', first: '迟日江山丽', second: '春风花草香', grade: 3 },
  { title: '绝句', first: '泥融飞燕子', second: '沙暖睡鸳鸯', grade: 3 },
  { title: '惠崇春江晚景', first: '竹外桃花三两枝', second: '春江水暖鸭先知', grade: 3 },
  { title: '惠崇春江晚景', first: '蒌蒿满地芦芽短', second: '正是河豚欲上时', grade: 3 },
  { title: '三衢道中', first: '梅子黄时日日晴', second: '小溪泛尽却山行', grade: 3 },
  { title: '三衢道中', first: '绿阴不减来时路', second: '添得黄鹂四五声', grade: 3 },
  { title: '元日', first: '爆竹声中一岁除', second: '春风送暖入屠苏', grade: 3 },
  { title: '元日', first: '千门万户曈曈日', second: '总把新桃换旧符', grade: 3 },
  { title: '清明', first: '清明时节雨纷纷', second: '路上行人欲断魂', grade: 3 },
  { title: '清明', first: '借问酒家何处有', second: '牧童遥指杏花村', grade: 3 },
  {
    title: '九月九日忆山东兄弟',
    first: '独在异乡为异客',
    second: '每逢佳节倍思亲',
    grade: 3,
  },
  {
    title: '九月九日忆山东兄弟',
    first: '遥知兄弟登高处',
    second: '遍插茱萸少一人',
    grade: 3,
  },

  // 四年级上册
  { title: '暮江吟', first: '一道残阳铺水中', second: '半江瑟瑟半江红', grade: 4 },
  { title: '暮江吟', first: '可怜九月初三夜', second: '露似真珠月似弓', grade: 4 },
  { title: '题西林壁', first: '横看成岭侧成峰', second: '远近高低各不同', grade: 4 },
  { title: '题西林壁', first: '不识庐山真面目', second: '只缘身在此山中', grade: 4 },
  { title: '雪梅', first: '梅雪争春未肯降', second: '骚人阁笔费评章', grade: 4 },
  { title: '雪梅', first: '梅须逊雪三分白', second: '雪却输梅一段香', grade: 4 },
  { title: '出塞', first: '秦时明月汉时关', second: '万里长征人未还', grade: 4 },
  { title: '出塞', first: '但使龙城飞将在', second: '不教胡马度阴山', grade: 4 },
  { title: '凉州词', first: '黄河远上白云间', second: '一片孤城万仞山', grade: 4 },
  { title: '凉州词', first: '羌笛何须怨杨柳', second: '春风不度玉门关', grade: 4 },
  { title: '夏日绝句', first: '生当作人杰', second: '死亦为鬼雄', grade: 4 },
  { title: '夏日绝句', first: '至今思项羽', second: '不肯过江东', grade: 4 },
  { title: '鹿柴', first: '空山不见人', second: '但闻人语响', grade: 4 },
  { title: '鹿柴', first: '返景入深林', second: '复照青苔上', grade: 4 },
  { title: '嫦娥', first: '云母屏风烛影深', second: '长河渐落晓星沉', grade: 4 },
  { title: '嫦娥', first: '嫦娥应悔偷灵药', second: '碧海青天夜夜心', grade: 4 },

  // 四年级下册
  { title: '宿新市徐公店', first: '篱落疏疏一径深', second: '树头新绿未成阴', grade: 4 },
  { title: '宿新市徐公店', first: '儿童急走追黄蝶', second: '飞入菜花无处寻', grade: 4 },
  {
    title: '四时田园杂兴',
    first: '梅子金黄杏子肥',
    second: '麦花雪白菜花稀',
    grade: 4,
  },
  {
    title: '四时田园杂兴',
    first: '日长篱落无人过',
    second: '惟有蜻蜓蛱蝶飞',
    grade: 4,
  },
  { title: '清平乐·村居', first: '茅檐低小', second: '溪上青青草', grade: 4 },
  { title: '清平乐·村居', first: '醉里吴音相媚好', second: '白发谁家翁媪', grade: 4 },
  {
    title: '芙蓉楼送辛渐',
    first: '寒雨连江夜入吴',
    second: '平明送客楚山孤',
    grade: 4,
  },
  {
    title: '芙蓉楼送辛渐',
    first: '洛阳亲友如相问',
    second: '一片冰心在玉壶',
    grade: 4,
  },
  { title: '塞下曲', first: '月黑雁飞高', second: '单于夜遁逃', grade: 4 },
  { title: '塞下曲', first: '欲将轻骑逐', second: '大雪满弓刀', grade: 4 },
  { title: '墨梅', first: '我家洗砚池头树', second: '朵朵花开淡墨痕', grade: 4 },
  { title: '墨梅', first: '不要人夸好颜色', second: '只留清气满乾坤', grade: 4 },
  { title: '蜂', first: '不论平地与山尖', second: '无限风光尽被占', grade: 4 },
  { title: '蜂', first: '采得百花成蜜后', second: '为谁辛苦为谁甜', grade: 4 },

  // 五年级上册
  { title: '示儿', first: '死去元知万事空', second: '但悲不见九州同', grade: 5 },
  { title: '示儿', first: '王师北定中原日', second: '家祭无忘告乃翁', grade: 5 },
  { title: '题临安邸', first: '山外青山楼外楼', second: '西湖歌舞几时休', grade: 5 },
  { title: '题临安邸', first: '暖风熏得游人醉', second: '直把杭州作汴州', grade: 5 },
  { title: '己亥杂诗', first: '九州生气恃风雷', second: '万马齐喑究可哀', grade: 5 },
  { title: '己亥杂诗', first: '我劝天公重抖擞', second: '不拘一格降人才', grade: 5 },
  { title: '山居秋暝', first: '空山新雨后', second: '天气晚来秋', grade: 5 },
  { title: '山居秋暝', first: '明月松间照', second: '清泉石上流', grade: 5 },
  { title: '枫桥夜泊', first: '月落乌啼霜满天', second: '江枫渔火对愁眠', grade: 5 },
  { title: '枫桥夜泊', first: '姑苏城外寒山寺', second: '夜半钟声到客船', grade: 5 },
  { title: '长相思', first: '山一程，水一程', second: '身向榆关那畔行', grade: 5 },
  { title: '长相思', first: '风一更，雪一更', second: '聒碎乡心梦不成', grade: 5 },
  { title: '渔歌子', first: '西塞山前白鹭飞', second: '桃花流水鳜鱼肥', grade: 5 },
  { title: '渔歌子', first: '青箬笠，绿蓑衣', second: '斜风细雨不须归', grade: 5 },
  { title: '观书有感', first: '半亩方塘一鉴开', second: '天光云影共徘徊', grade: 5 },
  { title: '观书有感', first: '问渠那得清如许', second: '为有源头活水来', grade: 5 },

  // 五年级下册
  {
    title: '四时田园杂兴',
    first: '昼出耘田夜绩麻',
    second: '村庄儿女各当家',
    grade: 5,
  },
  {
    title: '四时田园杂兴',
    first: '童孙未解供耕织',
    second: '也傍桑阴学种瓜',
    grade: 5,
  },
  { title: '稚子弄冰', first: '稚子金盆脱晓冰', second: '彩丝穿取当银铮', grade: 5 },
  { title: '稚子弄冰', first: '敲成玉磬穿林响', second: '忽作玻璃碎地声', grade: 5 },
  { title: '村晚', first: '草满池塘水满陂', second: '山衔落日浸寒漪', grade: 5 },
  { title: '村晚', first: '牧童归去横牛背', second: '短笛无腔信口吹', grade: 5 },
  { title: '从军行', first: '青海长云暗雪山', second: '孤城遥望玉门关', grade: 5 },
  { title: '从军行', first: '黄沙百战穿金甲', second: '不破楼兰终不还', grade: 5 },
  {
    title: '秋夜将晓出篱门迎凉有感',
    first: '三万里河东入海',
    second: '五千仞岳上摩天',
    grade: 5,
  },
  {
    title: '秋夜将晓出篱门迎凉有感',
    first: '遗民泪尽胡尘里',
    second: '南望王师又一年',
    grade: 5,
  },
  {
    title: '闻官军收河南河北',
    first: '剑外忽传收蓟北',
    second: '初闻涕泪满衣裳',
    grade: 5,
  },
  {
    title: '闻官军收河南河北',
    first: '即从巴峡穿巫峡',
    second: '便下襄阳向洛阳',
    grade: 5,
  },
  { title: '游子吟', first: '慈母手中线', second: '游子身上衣', grade: 5 },
  { title: '游子吟', first: '临行密密缝', second: '意恐迟迟归', grade: 5 },

  // 六年级上册
  { title: '宿建德江', first: '移舟泊烟渚', second: '日暮客愁新', grade: 6 },
  { title: '宿建德江', first: '野旷天低树', second: '江清月近人', grade: 6 },
  {
    title: '六月二十七日望湖楼醉书',
    first: '黑云翻墨未遮山',
    second: '白雨跳珠乱入船',
    grade: 6,
  },
  {
    title: '六月二十七日望湖楼醉书',
    first: '卷地风来忽吹散',
    second: '望湖楼下水如天',
    grade: 6,
  },
  {
    title: '西江月·夜行黄沙道中',
    first: '明月别枝惊鹊',
    second: '清风半夜鸣蝉',
    grade: 6,
  },
  {
    title: '西江月·夜行黄沙道中',
    first: '稻花香里说丰年',
    second: '听取蛙声一片',
    grade: 6,
  },
  { title: '浪淘沙', first: '九曲黄河万里沙', second: '浪淘风簸自天涯', grade: 6 },
  { title: '浪淘沙', first: '如今直上银河去', second: '同到牵牛织女家', grade: 6 },
  { title: '江南春', first: '千里莺啼绿映红', second: '水村山郭酒旗风', grade: 6 },
  { title: '江南春', first: '南朝四百八十寺', second: '多少楼台烟雨中', grade: 6 },
  { title: '书湖阴先生壁', first: '茅檐长扫净无苔', second: '花木成畦手自栽', grade: 6 },
  { title: '书湖阴先生壁', first: '一水护田将绿绕', second: '两山排闼送青来', grade: 6 },

  // 六年级下册
  { title: '寒食', first: '春城无处不飞花', second: '寒食东风御柳斜', grade: 6 },
  { title: '寒食', first: '日暮汉宫传蜡烛', second: '轻烟散入五侯家', grade: 6 },
  { title: '迢迢牵牛星', first: '迢迢牵牛星', second: '皎皎河汉女', grade: 6 },
  { title: '迢迢牵牛星', first: '盈盈一水间', second: '脉脉不得语', grade: 6 },
  { title: '十五夜望月', first: '中庭地白树栖鸦', second: '冷露无声湿桂花', grade: 6 },
  { title: '十五夜望月', first: '今夜月明人尽望', second: '不知秋思落谁家', grade: 6 },
  { title: '马诗', first: '大漠沙如雪', second: '燕山月似钩', grade: 6 },
  { title: '马诗', first: '何当金络脑', second: '快走踏清秋', grade: 6 },
  { title: '石灰吟', first: '千锤万凿出深山', second: '烈火焚烧若等闲', grade: 6 },
  { title: '石灰吟', first: '粉骨碎身浑不怕', second: '要留清白在人间', grade: 6 },
  { title: '竹石', first: '咬定青山不放松', second: '立根原在破岩中', grade: 6 },
  { title: '竹石', first: '千磨万击还坚劲', second: '任尔东西南北风', grade: 6 },
  { title: '游园不值', first: '应怜屐齿印苍苔', second: '小扣柴扉久不开', grade: 6 },
  { title: '游园不值', first: '春色满园关不住', second: '一枝红杏出墙来', grade: 6 },
  {
    title: '卜算子·送鲍浩然之浙东',
    first: '水是眼波横',
    second: '山是眉峰聚',
    grade: 6,
  },
  {
    title: '卜算子·送鲍浩然之浙东',
    first: '欲问行人去那边',
    second: '眉眼盈盈处',
    grade: 6,
  },
  { title: '浣溪沙', first: '山下兰芽短浸溪', second: '松间沙路净无泥', grade: 6 },
  { title: '浣溪沙', first: '谁道人生无再少', second: '门前流水尚能西', grade: 6 },
];

interface IdiomRow {
  idiom: string;
  index: number;
  wrong: [string, string];
  grade: Grade;
}

const IDIOMS: IdiomRow[] = [
  { idiom: '画蛇添足', index: 3, wrong: ['手', '尾'], grade: 3 },
  { idiom: '守株待兔', index: 3, wrong: ['虎', '羊'], grade: 2 },
  { idiom: '亡羊补牢', index: 3, wrong: ['门', '圈'], grade: 2 },
  { idiom: '掩耳盗铃', index: 3, wrong: ['钟', '鼓'], grade: 3 },
  { idiom: '刻舟求剑', index: 3, wrong: ['鱼', '宝'], grade: 3 },
  { idiom: '狐假虎威', index: 2, wrong: ['狼', '熊'], grade: 2 },
  { idiom: '对牛弹琴', index: 3, wrong: ['歌', '曲'], grade: 4 },
  { idiom: '坐井观天', index: 3, wrong: ['地', '海'], grade: 2 },
  { idiom: '拔苗助长', index: 3, wrong: ['高', '大'], grade: 2 },
  { idiom: '叶公好龙', index: 3, wrong: ['花', '画'], grade: 4 },
  { idiom: '惊弓之鸟', index: 3, wrong: ['兔', '兽'], grade: 4 },
  { idiom: '滥竽充数', index: 3, wrong: ['量', '人'], grade: 5 },
  { idiom: '自相矛盾', index: 3, wrong: ['刀', '戈'], grade: 5 },
  { idiom: '杯弓蛇影', index: 3, wrong: ['形', '身'], grade: 3 },
  { idiom: '望梅止渴', index: 3, wrong: ['饿', '步'], grade: 3 },
  { idiom: '守口如瓶', index: 3, wrong: ['钟', '山'], grade: 3 },
  { idiom: '一箭双雕', index: 3, wrong: ['鸟', '燕'], grade: 3 },
  { idiom: '画龙点睛', index: 3, wrong: ['眼', '笔'], grade: 3 },
  { idiom: '井底之蛙', index: 3, wrong: ['鱼', '虫'], grade: 3 },
  { idiom: '胸有成竹', index: 3, wrong: ['木', '林'], grade: 3 },
  { idiom: '滴水穿石', index: 3, wrong: ['岩', '洞'], grade: 3 },
  { idiom: '铁杵成针', index: 3, wrong: ['线', '钉'], grade: 3 },
  { idiom: '程门立雪', index: 3, wrong: ['雨', '风'], grade: 3 },
  { idiom: '卧薪尝胆', index: 3, wrong: ['苦', '药'], grade: 3 },
  { idiom: '闻鸡起舞', index: 3, wrong: ['早', '床'], grade: 3 },
  { idiom: '画饼充饥', index: 3, wrong: ['饿', '饭'], grade: 3 },
  { idiom: '望洋兴叹', index: 3, wrong: ['笑', '哭'], grade: 3 },
  { idiom: '塞翁失马', index: 3, wrong: ['牛', '羊'], grade: 3 },

  // 四年级：学习态度与神态
  { idiom: '一丝不苟', index: 3, wrong: ['苦', '若'], grade: 4 },
  { idiom: '全神贯注', index: 2, wrong: ['惯', '灌'], grade: 4 },
  { idiom: '废寝忘食', index: 1, wrong: ['食', '寐'], grade: 4 },
  { idiom: '持之以恒', index: 2, wrong: ['已', '一'], grade: 4 },
  { idiom: '坚持不懈', index: 3, wrong: ['解', '谢'], grade: 4 },
  { idiom: '锲而不舍', index: 3, wrong: ['拾', '社'], grade: 4 },
  { idiom: '专心致志', index: 2, wrong: ['至', '制'], grade: 4 },
  { idiom: '聚精会神', index: 3, wrong: ['伸', '申'], grade: 4 },
  { idiom: '目不转睛', index: 3, wrong: ['晴', '精'], grade: 4 },
  { idiom: '兴高采烈', index: 2, wrong: ['彩', '菜'], grade: 4 },
  { idiom: '眉飞色舞', index: 3, wrong: ['午', '武'], grade: 4 },
  { idiom: '无精打采', index: 3, wrong: ['彩', '睬'], grade: 4 },
  { idiom: '神气十足', index: 3, wrong: ['走', '卒'], grade: 4 },
  { idiom: '若无其事', index: 2, wrong: ['奇', '期'], grade: 4 },
  { idiom: '不动声色', index: 3, wrong: ['涩', '召'], grade: 4 },
  { idiom: '迫不得已', index: 3, wrong: ['己', '以'], grade: 4 },
  { idiom: '无可奈何', index: 3, wrong: ['河', '和'], grade: 4 },
  { idiom: '束手无策', index: 3, wrong: ['册', '测'], grade: 4 },
  { idiom: '目瞪口呆', index: 3, wrong: ['待', '代'], grade: 4 },
  { idiom: '面红耳赤', index: 3, wrong: ['斥', '翅'], grade: 4 },
  { idiom: '七嘴八舌', index: 3, wrong: ['蛇', '舍'], grade: 4 },
  { idiom: '争先恐后', index: 3, wrong: ['候', '厚'], grade: 4 },

  // 五年级：人物、场景与情态
  { idiom: '理直气壮', index: 3, wrong: ['状', '装'], grade: 5 },
  { idiom: '完璧归赵', index: 2, wrong: ['规', '贵'], grade: 5 },
  { idiom: '攻无不克', index: 3, wrong: ['刻', '客'], grade: 5 },
  { idiom: '战无不胜', index: 3, wrong: ['圣', '盛'], grade: 5 },
  { idiom: '负荆请罪', index: 2, wrong: ['情', '清'], grade: 5 },
  { idiom: '同心协力', index: 3, wrong: ['历', '立'], grade: 5 },
  { idiom: '神机妙算', index: 3, wrong: ['蒜', '篡'], grade: 5 },
  { idiom: '踉踉跄跄', index: 3, wrong: ['仓', '抢'], grade: 5 },
  { idiom: '抓耳挠腮', index: 3, wrong: ['思', '鳃'], grade: 5 },
  { idiom: '喜不自胜', index: 3, wrong: ['盛', '圣'], grade: 5 },
  { idiom: '目不暇接', index: 3, wrong: ['结', '节'], grade: 5 },
  { idiom: '应接不暇', index: 3, wrong: ['假', '霞'], grade: 5 },
  { idiom: '花团锦簇', index: 3, wrong: ['族', '促'], grade: 5 },
  { idiom: '姹紫嫣红', index: 3, wrong: ['虹', '洪'], grade: 5 },
  { idiom: '翩翩起舞', index: 3, wrong: ['武', '午'], grade: 5 },
  { idiom: '含情脉脉', index: 3, wrong: ['麦', '卖'], grade: 5 },
  { idiom: '迫不及待', index: 3, wrong: ['侍', '代'], grade: 5 },
  { idiom: '兴致勃勃', index: 3, wrong: ['脖', '渤'], grade: 5 },
  { idiom: '无忧无虑', index: 3, wrong: ['虚', '虎'], grade: 5 },
  { idiom: '生气勃勃', index: 3, wrong: ['脖', '渤'], grade: 5 },
  { idiom: '左顾右盼', index: 3, wrong: ['判', '叛'], grade: 5 },
  { idiom: '局促不安', index: 3, wrong: ['按', '案'], grade: 5 },

  // 六年级：读写积累与艺术描写
  { idiom: '张冠李戴', index: 3, wrong: ['带', '代'], grade: 6 },
  { idiom: '囫囵吞枣', index: 3, wrong: ['早', '澡'], grade: 6 },
  { idiom: '恍然大悟', index: 3, wrong: ['误', '物'], grade: 6 },
  { idiom: '饱经风霜', index: 3, wrong: ['双', '爽'], grade: 6 },
  { idiom: '独具匠心', index: 3, wrong: ['新', '辛'], grade: 6 },
  { idiom: '引人入胜', index: 3, wrong: ['圣', '盛'], grade: 6 },
  { idiom: '古色古香', index: 3, wrong: ['乡', '相'], grade: 6 },
  { idiom: '余音绕梁', index: 3, wrong: ['粮', '良'], grade: 6 },
  { idiom: '不落窠臼', index: 3, wrong: ['旧', '白'], grade: 6 },
  { idiom: '雅俗共赏', index: 3, wrong: ['常', '尝'], grade: 6 },
  { idiom: '可见一斑', index: 3, wrong: ['班', '般'], grade: 6 },
  { idiom: '独出心裁', index: 3, wrong: ['载', '栽'], grade: 6 },
  { idiom: '响遏行云', index: 3, wrong: ['芸', '运'], grade: 6 },
  { idiom: '惊心动魄', index: 3, wrong: ['破', '泊'], grade: 6 },
  { idiom: '养尊处优', index: 3, wrong: ['忧', '由'], grade: 6 },
  { idiom: '百折不挠', index: 3, wrong: ['绕', '饶'], grade: 6 },
  { idiom: '意味深长', index: 3, wrong: ['常', '场'], grade: 6 },
  { idiom: '别具一格', index: 3, wrong: ['各', '阁'], grade: 6 },
  { idiom: '津津有味', index: 3, wrong: ['位', '卫'], grade: 6 },
  { idiom: '如饥似渴', index: 3, wrong: ['喝', '可'], grade: 6 },
  { idiom: '心安理得', index: 3, wrong: ['德', '的'], grade: 6 },
  { idiom: '大显身手', index: 3, wrong: ['首', '守'], grade: 6 },
];

interface AntonymRow {
  a: string;
  b: string;
  grade: Grade;
}

const ANTONYMS: AntonymRow[] = [
  { a: '大', b: '小', grade: 1 },
  { a: '多', b: '少', grade: 1 },
  { a: '上', b: '下', grade: 1 },
  { a: '前', b: '后', grade: 1 },
  { a: '里', b: '外', grade: 1 },
  { a: '来', b: '去', grade: 1 },
  { a: '开', b: '关', grade: 1 },
  { a: '早', b: '晚', grade: 1 },
  { a: '左', b: '右', grade: 1 },
  { a: '东', b: '西', grade: 1 },
  { a: '南', b: '北', grade: 1 },
  { a: '男', b: '女', grade: 1 },
  { a: '黑', b: '白', grade: 2 },
  { a: '冷', b: '热', grade: 2 },
  { a: '快', b: '慢', grade: 2 },
  { a: '新', b: '旧', grade: 2 },
  { a: '高', b: '矮', grade: 2 },
  { a: '长', b: '短', grade: 2 },
  { a: '哭', b: '笑', grade: 2 },
  { a: '进', b: '出', grade: 2 },
  { a: '真', b: '假', grade: 2 },
  { a: '好', b: '坏', grade: 2 },
  { a: '轻', b: '重', grade: 3 },
  { a: '粗', b: '细', grade: 3 },
  { a: '深', b: '浅', grade: 3 },
  { a: '厚', b: '薄', grade: 3 },
  { a: '宽', b: '窄', grade: 3 },
  { a: '远', b: '近', grade: 3 },
  { a: '明', b: '暗', grade: 3 },
  { a: '甜', b: '苦', grade: 3 },
  { a: '美', b: '丑', grade: 3 },
  { a: '对', b: '错', grade: 3 },
  { a: '忙', b: '闲', grade: 3 },
  { a: '静', b: '闹', grade: 3 },
];

interface WordAntonymRow {
  a: string;
  b: string;
  wrong: [string, string];
  grade: Grade;
}

// 四年级起改为词语对，干扰项单独给出，避免出现第二个说得通的反义词。
const WORD_ANTONYMS: WordAntonymRow[] = [
  { a: '勤劳', b: '懒惰', wrong: ['勇敢', '诚实'], grade: 4 },
  { a: '谦虚', b: '骄傲', wrong: ['热情', '细心'], grade: 4 },
  { a: '湿润', b: '干燥', wrong: ['温暖', '柔软'], grade: 4 },
  { a: '热闹', b: '冷清', wrong: ['整齐', '明亮'], grade: 4 },
  { a: '坚强', b: '软弱', wrong: ['聪明', '大方'], grade: 4 },
  { a: '诚实', b: '虚伪', wrong: ['勤劳', '勇敢'], grade: 4 },
  { a: '节约', b: '浪费', wrong: ['认真', '整洁'], grade: 4 },
  { a: '保护', b: '破坏', wrong: ['观察', '讨论'], grade: 4 },
  { a: '熟悉', b: '陌生', wrong: ['亲切', '热情'], grade: 4 },
  { a: '复杂', b: '简单', wrong: ['详细', '清楚'], grade: 4 },
  { a: '弯曲', b: '笔直', wrong: ['宽阔', '平坦'], grade: 4 },
  { a: '慌张', b: '镇定', wrong: ['兴奋', '愉快'], grade: 4 },
  { a: '沉重', b: '轻松', wrong: ['结实', '稳固'], grade: 4 },
  { a: '慷慨', b: '吝啬', wrong: ['温和', '果断'], grade: 4 },
  { a: '明亮', b: '昏暗', wrong: ['干净', '整齐'], grade: 4 },
  { a: '陡峭', b: '平坦', wrong: ['遥远', '宽阔'], grade: 4 },
  { a: '茂盛', b: '枯萎', wrong: ['翠绿', '高大'], grade: 4 },
  { a: '敏捷', b: '迟钝', wrong: ['强壮', '温柔'], grade: 4 },

  { a: '崎岖', b: '平坦', wrong: ['遥远', '狭窄'], grade: 5 },
  { a: '庄重', b: '轻浮', wrong: ['安静', '朴素'], grade: 5 },
  { a: '慈祥', b: '凶狠', wrong: ['年轻', '高大'], grade: 5 },
  { a: '富裕', b: '贫穷', wrong: ['勤劳', '节俭'], grade: 5 },
  { a: '崭新', b: '破旧', wrong: ['干净', '明亮'], grade: 5 },
  { a: '宽敞', b: '狭窄', wrong: ['高大', '整齐'], grade: 5 },
  { a: '聚集', b: '分散', wrong: ['排列', '拥挤'], grade: 5 },
  { a: '迅速', b: '缓慢', wrong: ['平稳', '安静'], grade: 5 },
  { a: '危险', b: '安全', wrong: ['困难', '艰苦'], grade: 5 },
  { a: '悲哀', b: '欢乐', wrong: ['平静', '安详'], grade: 5 },
  { a: '清晰', b: '模糊', wrong: ['正确', '完整'], grade: 5 },
  { a: '坚硬', b: '柔软', wrong: ['沉重', '光滑'], grade: 5 },
  { a: '热情', b: '冷淡', wrong: ['谦虚', '诚实'], grade: 5 },
  { a: '遵守', b: '违反', wrong: ['执行', '宣传'], grade: 5 },
  { a: '接受', b: '拒绝', wrong: ['讨论', '传递'], grade: 5 },
  { a: '整齐', b: '杂乱', wrong: ['宽阔', '明亮'], grade: 5 },
  { a: '珍惜', b: '糟蹋', wrong: ['保存', '收藏'], grade: 5 },
  { a: '喜悦', b: '忧愁', wrong: ['激动', '平静'], grade: 5 },

  { a: '渺小', b: '伟大', wrong: ['平凡', '普通'], grade: 6 },
  { a: '精致', b: '粗糙', wrong: ['昂贵', '华丽'], grade: 6 },
  { a: '隐蔽', b: '暴露', wrong: ['安全', '牢固'], grade: 6 },
  { a: '团结', b: '分裂', wrong: ['努力', '奋斗'], grade: 6 },
  { a: '兴旺', b: '衰败', wrong: ['热闹', '富足'], grade: 6 },
  { a: '勇敢', b: '怯懦', wrong: ['强壮', '机灵'], grade: 6 },
  { a: '果断', b: '犹豫', wrong: ['认真', '冷静'], grade: 6 },
  { a: '朴素', b: '华丽', wrong: ['整洁', '便宜'], grade: 6 },
  { a: '减轻', b: '加重', wrong: ['提高', '改变'], grade: 6 },
  { a: '紧张', b: '放松', wrong: ['忙碌', '兴奋'], grade: 6 },
  { a: '辽阔', b: '狭窄', wrong: ['遥远', '平坦'], grade: 6 },
  { a: '茂密', b: '稀疏', wrong: ['翠绿', '高大'], grade: 6 },
  { a: '幸福', b: '痛苦', wrong: ['平静', '富足'], grade: 6 },
  { a: '严厉', b: '温和', wrong: ['忙碌', '朴素'], grade: 6 },
  { a: '自满', b: '虚心', wrong: ['勤奋', '诚恳'], grade: 6 },
  { a: '前进', b: '后退', wrong: ['转弯', '停止'], grade: 6 },
  { a: '光明', b: '黑暗', wrong: ['温暖', '宽阔'], grade: 6 },
  { a: '喧闹', b: '寂静', wrong: ['整齐', '宽敞'], grade: 6 },
];

// Nouns only: none of them is an antonym of the pair, so the two decoys can
// never be argued into a second correct answer.
const FILLER_CHARS =
  '山水花草鸟云雨书笔车门手心田灯船桥树头口耳目木火土米菜鱼马牛羊狗猫兔鸡鸭猪风雪雷星月日春夏秋冬'.split(
    '',
  );

interface SynonymRow {
  a: string;
  b: string;
  wrong: [string, string];
  grade: Grade;
}

const SYNONYMS: SynonymRow[] = [
  { a: '美丽', b: '漂亮', wrong: ['寒冷', '安静'], grade: 2 },
  { a: '高兴', b: '快乐', wrong: ['高大', '洁白'], grade: 2 },
  { a: '立刻', b: '马上', wrong: ['美丽', '辽阔'], grade: 2 },
  { a: '著名', b: '有名', wrong: ['安静', '寒冷'], grade: 2 },
  { a: '仔细', b: '认真', wrong: ['高兴', '漂亮'], grade: 2 },
  { a: '温暖', b: '暖和', wrong: ['立刻', '巨大'], grade: 2 },
  { a: '安静', b: '宁静', wrong: ['快乐', '漂亮'], grade: 2 },
  { a: '勇敢', b: '大胆', wrong: ['洁白', '寒冷'], grade: 2 },
  { a: '寒冷', b: '严寒', wrong: ['美丽', '高兴'], grade: 2 },
  { a: '连忙', b: '赶快', wrong: ['安静', '巨大'], grade: 2 },
  { a: '突然', b: '忽然', wrong: ['漂亮', '洁白'], grade: 2 },
  { a: '常常', b: '经常', wrong: ['高大', '辽阔'], grade: 2 },
  { a: '明白', b: '清楚', wrong: ['安静', '快乐'], grade: 2 },
  { a: '喜欢', b: '喜爱', wrong: ['寒冷', '巨大'], grade: 2 },
  { a: '帮助', b: '帮忙', wrong: ['美丽', '高大'], grade: 2 },
  { a: '巨大', b: '庞大', wrong: ['安静', '洁白'], grade: 3 },
  { a: '洁白', b: '雪白', wrong: ['高兴', '辽阔'], grade: 3 },
  { a: '辽阔', b: '宽广', wrong: ['漂亮', '寒冷'], grade: 3 },
  { a: '开心', b: '快乐', wrong: ['高大', '安静'], grade: 3 },
  { a: '漂亮', b: '好看', wrong: ['寒冷', '巨大'], grade: 3 },

  // 四年级
  { a: '观察', b: '察看', wrong: ['喧闹', '寒冷'], grade: 4 },
  { a: '宽阔', b: '宽广', wrong: ['锋利', '艳丽'], grade: 4 },
  { a: '平静', b: '宁静', wrong: ['陡峭', '陈旧'], grade: 4 },
  { a: '茂盛', b: '繁茂', wrong: ['整齐', '明亮'], grade: 4 },
  { a: '展现', b: '展示', wrong: ['珍惜', '埋怨'], grade: 4 },
  { a: '鼓励', b: '激励', wrong: ['责备', '阻挡'], grade: 4 },
  { a: '珍惜', b: '爱惜', wrong: ['浪费', '丢弃'], grade: 4 },
  { a: '奇怪', b: '古怪', wrong: ['平常', '简单'], grade: 4 },
  { a: '经常', b: '时常', wrong: ['迅速', '安静'], grade: 4 },
  { a: '详细', b: '详尽', wrong: ['简单', '模糊'], grade: 4 },
  { a: '坚定', b: '坚决', wrong: ['轻盈', '鲜艳'], grade: 4 },
  { a: '崇高', b: '高尚', wrong: ['平凡', '渺小'], grade: 4 },
  { a: '恬静', b: '幽静', wrong: ['热闹', '喧哗'], grade: 4 },
  { a: '敏捷', b: '灵敏', wrong: ['迟钝', '笨重'], grade: 4 },
  { a: '注视', b: '凝望', wrong: ['呼唤', '奔跑'], grade: 4 },
  { a: '照料', b: '照顾', wrong: ['打扰', '拒绝'], grade: 4 },
  { a: '疲倦', b: '疲劳', wrong: ['兴奋', '轻松'], grade: 4 },
  { a: '惊奇', b: '惊讶', wrong: ['平淡', '寻常'], grade: 4 },

  // 五年级
  { a: '渴望', b: '盼望', wrong: ['厌倦', '遗忘'], grade: 5 },
  { a: '沉思', b: '深思', wrong: ['嬉戏', '呼喊'], grade: 5 },
  { a: '珍贵', b: '宝贵', wrong: ['普通', '廉价'], grade: 5 },
  { a: '吩咐', b: '嘱咐', wrong: ['询问', '责备'], grade: 5 },
  { a: '崎岖', b: '坎坷', wrong: ['平坦', '宽阔'], grade: 5 },
  { a: '庄严', b: '庄重', wrong: ['轻松', '活泼'], grade: 5 },
  { a: '陈列', b: '摆放', wrong: ['收藏', '丢弃'], grade: 5 },
  { a: '端详', b: '打量', wrong: ['眺望', '窥视'], grade: 5 },
  { a: '沮丧', b: '颓丧', wrong: ['兴奋', '得意'], grade: 5 },
  { a: '埋怨', b: '抱怨', wrong: ['感谢', '赞美'], grade: 5 },
  { a: '熟悉', b: '熟识', wrong: ['陌生', '疏远'], grade: 5 },
  { a: '羞愧', b: '惭愧', wrong: ['骄傲', '得意'], grade: 5 },
  { a: '慈祥', b: '慈爱', wrong: ['严厉', '冷漠'], grade: 5 },
  { a: '颤抖', b: '发抖', wrong: ['摇晃', '跳动'], grade: 5 },
  { a: '期待', b: '期盼', wrong: ['失望', '放弃'], grade: 5 },
  { a: '迅速', b: '快速', wrong: ['缓慢', '悠闲'], grade: 5 },
  { a: '剧烈', b: '猛烈', wrong: ['轻微', '柔和'], grade: 5 },
  { a: '探索', b: '探寻', wrong: ['停留', '等待'], grade: 5 },

  // 六年级
  { a: '遒劲', b: '刚劲', wrong: ['柔弱', '纤细'], grade: 6 },
  { a: '伶俐', b: '机灵', wrong: ['笨拙', '迟钝'], grade: 6 },
  { a: '抵御', b: '抵挡', wrong: ['进攻', '撤退'], grade: 6 },
  { a: '顾惜', b: '爱惜', wrong: ['浪费', '糟蹋'], grade: 6 },
  { a: '宁愿', b: '宁可', wrong: ['勉强', '被迫'], grade: 6 },
  { a: '哀伤', b: '悲伤', wrong: ['欢喜', '愤怒'], grade: 6 },
  { a: '眷恋', b: '留恋', wrong: ['厌弃', '遗忘'], grade: 6 },
  { a: '渺小', b: '微小', wrong: ['巨大', '辽阔'], grade: 6 },
  { a: '慷慨', b: '大方', wrong: ['吝啬', '小气'], grade: 6 },
  { a: '隐蔽', b: '隐藏', wrong: ['暴露', '显露'], grade: 6 },
  { a: '恐吓', b: '吓唬', wrong: ['安慰', '鼓励'], grade: 6 },
  { a: '困难', b: '艰难', wrong: ['容易', '轻松'], grade: 6 },
  { a: '精致', b: '精美', wrong: ['粗糙', '简陋'], grade: 6 },
  { a: '徘徊', b: '踌躇', wrong: ['奔跑', '决断'], grade: 6 },
  { a: '嘹亮', b: '响亮', wrong: ['低沉', '沙哑'], grade: 6 },
  { a: '严峻', b: '严酷', wrong: ['温和', '轻松'], grade: 6 },
  { a: '憧憬', b: '向往', wrong: ['回忆', '厌倦'], grade: 6 },
  { a: '蕴含', b: '包含', wrong: ['显露', '排斥'], grade: 6 },
];

interface MeasureRow {
  noun: string;
  measure: string;
  wrong: [string, string];
  grade: Grade;
}

const MEASURES: MeasureRow[] = [
  { noun: '铅笔', measure: '支', wrong: ['只', '条'], grade: 1 },
  { noun: '牛', measure: '头', wrong: ['只', '匹'], grade: 1 },
  { noun: '马', measure: '匹', wrong: ['头', '条'], grade: 1 },
  { noun: '鱼', measure: '条', wrong: ['只', '头'], grade: 1 },
  { noun: '花', measure: '朵', wrong: ['棵', '片'], grade: 1 },
  { noun: '书', measure: '本', wrong: ['张', '件'], grade: 1 },
  { noun: '纸', measure: '张', wrong: ['本', '把'], grade: 1 },
  { noun: '衣服', measure: '件', wrong: ['双', '顶'], grade: 1 },
  { noun: '鞋', measure: '双', wrong: ['件', '把'], grade: 1 },
  { noun: '帽子', measure: '顶', wrong: ['双', '件'], grade: 1 },
  { noun: '伞', measure: '把', wrong: ['顶', '条'], grade: 1 },
  { noun: '椅子', measure: '把', wrong: ['头', '匹'], grade: 1 },
  { noun: '桥', measure: '座', wrong: ['条', '棵'], grade: 1 },
  { noun: '山', measure: '座', wrong: ['条', '把'], grade: 1 },
  { noun: '树', measure: '棵', wrong: ['朵', '座'], grade: 1 },
  { noun: '星星', measure: '颗', wrong: ['棵', '朵'], grade: 1 },
  { noun: '糖', measure: '颗', wrong: ['棵', '朵'], grade: 1 },
  { noun: '车', measure: '辆', wrong: ['架', '艘'], grade: 2 },
  { noun: '飞机', measure: '架', wrong: ['辆', '艘'], grade: 2 },
  { noun: '船', measure: '艘', wrong: ['辆', '架'], grade: 2 },
  { noun: '画', measure: '幅', wrong: ['棵', '朵'], grade: 2 },
  { noun: '歌', measure: '首', wrong: ['张', '本'], grade: 2 },
  { noun: '信', measure: '封', wrong: ['本', '张'], grade: 2 },
  { noun: '话', measure: '句', wrong: ['本', '件'], grade: 2 },
  { noun: '路', measure: '条', wrong: ['座', '把'], grade: 2 },
  { noun: '井', measure: '口', wrong: ['条', '座'], grade: 2 },
  { noun: '牙', measure: '颗', wrong: ['棵', '朵'], grade: 2 },
  { noun: '云', measure: '朵', wrong: ['颗', '棵'], grade: 2 },
  { noun: '雨', measure: '场', wrong: ['朵', '条'], grade: 2 },
  { noun: '雪', measure: '场', wrong: ['朵', '条'], grade: 2 },
  { noun: '风', measure: '阵', wrong: ['朵', '颗'], grade: 2 },
  { noun: '灯', measure: '盏', wrong: ['把', '张'], grade: 2 },
  { noun: '窗户', measure: '扇', wrong: ['把', '条'], grade: 2 },
  { noun: '门', measure: '扇', wrong: ['把', '朵'], grade: 2 },
  { noun: '床', measure: '张', wrong: ['把', '条'], grade: 2 },
  { noun: '寓言', measure: '则', wrong: ['篇', '条'], grade: 3 },
  { noun: '文章', measure: '篇', wrong: ['则', '幅'], grade: 3 },
  { noun: '珍珠', measure: '串', wrong: ['条', '张'], grade: 3 },
  { noun: '掌声', measure: '阵', wrong: ['条', '本'], grade: 3 },
  { noun: '鲜花', measure: '簇', wrong: ['条', '本'], grade: 3 },
  { noun: '新月', measure: '弯', wrong: ['条', '把'], grade: 3 },
  { noun: '雕像', measure: '尊', wrong: ['条', '张'], grade: 3 },
  { noun: '石碑', measure: '块', wrong: ['条', '朵'], grade: 3 },
  { noun: '瀑布', measure: '道', wrong: ['朵', '本'], grade: 3 },
];

interface CollocationRow {
  verb: string;
  noun: string;
  wrong: [string, string];
  grade: Grade;
}

const COLLOCATIONS: CollocationRow[] = [
  { verb: '写', noun: '作业', wrong: ['吃', '飞'], grade: 1 },
  { verb: '踢', noun: '足球', wrong: ['吃', '睡'], grade: 1 },
  { verb: '弹', noun: '钢琴', wrong: ['拉', '吹'], grade: 1 },
  { verb: '唱', noun: '歌', wrong: ['画', '跑'], grade: 1 },
  { verb: '画', noun: '图画', wrong: ['唱', '跑'], grade: 1 },
  { verb: '读', noun: '书', wrong: ['吃', '飞'], grade: 1 },
  { verb: '吃', noun: '饭', wrong: ['写', '跑'], grade: 1 },
  { verb: '喝', noun: '水', wrong: ['穿', '读'], grade: 1 },
  { verb: '走', noun: '路', wrong: ['吃', '唱'], grade: 1 },
  { verb: '种', noun: '花', wrong: ['吃', '睡'], grade: 1 },
  { verb: '穿', noun: '衣服', wrong: ['吃', '读'], grade: 2 },
  { verb: '戴', noun: '帽子', wrong: ['吃', '跑'], grade: 2 },
  { verb: '戴', noun: '眼镜', wrong: ['喝', '写'], grade: 2 },
  { verb: '洗', noun: '手', wrong: ['吃', '飞'], grade: 2 },
  { verb: '刷', noun: '牙', wrong: ['吃', '跑'], grade: 2 },
  { verb: '扫', noun: '地', wrong: ['吃', '读'], grade: 2 },
  { verb: '擦', noun: '桌子', wrong: ['吃', '睡'], grade: 2 },
  { verb: '关', noun: '窗户', wrong: ['吃', '唱'], grade: 2 },
  { verb: '开', noun: '灯', wrong: ['吃', '写'], grade: 2 },
  { verb: '看', noun: '电视', wrong: ['吃', '写'], grade: 2 },
  { verb: '听', noun: '广播', wrong: ['吃', '跑'], grade: 2 },
  { verb: '讲', noun: '故事', wrong: ['吃', '穿'], grade: 2 },
  { verb: '回答', noun: '问题', wrong: ['吃', '飞'], grade: 2 },
  { verb: '参加', noun: '比赛', wrong: ['吃', '睡'], grade: 2 },
  { verb: '收集', noun: '资料', wrong: ['喝掉', '跳过'], grade: 3 },
  { verb: '制定', noun: '计划', wrong: ['吃掉', '穿上'], grade: 3 },
  { verb: '观察', noun: '星空', wrong: ['喝下', '踢开'], grade: 3 },
  { verb: '整理', noun: '书架', wrong: ['飞过', '唱起'], grade: 3 },
  { verb: '保护', noun: '眼睛', wrong: ['吃掉', '跑过'], grade: 3 },
  { verb: '完成', noun: '作业', wrong: ['喝下', '跳起'], grade: 3 },
];

interface RadicalRow {
  char: string;
  radical: string;
  wrong: [string, string];
  grade: Grade;
}

const RADICALS: RadicalRow[] = [
  { char: '江', radical: '氵', wrong: ['木', '亻'], grade: 2 },
  { char: '河', radical: '氵', wrong: ['木', '口'], grade: 2 },
  { char: '海', radical: '氵', wrong: ['女', '火'], grade: 2 },
  { char: '清', radical: '氵', wrong: ['目', '足'], grade: 2 },
  { char: '树', radical: '木', wrong: ['氵', '讠'], grade: 2 },
  { char: '林', radical: '木', wrong: ['女', '口'], grade: 2 },
  { char: '桥', radical: '木', wrong: ['氵', '火'], grade: 2 },
  { char: '校', radical: '木', wrong: ['讠', '足'], grade: 2 },
  { char: '你', radical: '亻', wrong: ['木', '女'], grade: 2 },
  { char: '他', radical: '亻', wrong: ['氵', '口'], grade: 2 },
  { char: '说', radical: '讠', wrong: ['木', '女'], grade: 2 },
  { char: '语', radical: '讠', wrong: ['氵', '火'], grade: 2 },
  { char: '晨', radical: '日', wrong: ['目', '旦'], grade: 3 },
  { char: '绒', radical: '纟', wrong: ['木', '氵'], grade: 3 },
  { char: '球', radical: '王', wrong: ['扌', '纟'], grade: 3 },
  { char: '汉', radical: '氵', wrong: ['讠', '又'], grade: 3 },
  { char: '艳', radical: '色', wrong: ['丰', '巴'], grade: 3 },
  { char: '服', radical: '月', wrong: ['扌', '卩'], grade: 3 },
  { char: '装', radical: '衣', wrong: ['士', '羊'], grade: 3 },
  { char: '扮', radical: '扌', wrong: ['分', '刀'], grade: 3 },
  { char: '静', radical: '青', wrong: ['争', '月'], grade: 3 },
  { char: '停', radical: '亻', wrong: ['亭', '丁'], grade: 3 },
  { char: '粗', radical: '米', wrong: ['且', '目'], grade: 3 },
  { char: '影', radical: '彡', wrong: ['日', '京'], grade: 3 },
  { char: '落', radical: '艹', wrong: ['氵', '各'], grade: 3 },
  { char: '笛', radical: '竹', wrong: ['由', '田'], grade: 3 },
  { char: '狂', radical: '犭', wrong: ['王', '氵'], grade: 3 },
  { char: '棕', radical: '木', wrong: ['宗', '宀'], grade: 3 },
  { char: '蜘', radical: '虫', wrong: ['知', '矢'], grade: 3 },
  { char: '蛛', radical: '虫', wrong: ['朱', '未'], grade: 3 },
  { char: '睡', radical: '目', wrong: ['垂', '口'], grade: 3 },
  { char: '富', radical: '宀', wrong: ['畐', '口'], grade: 3 },
];

// 四年级起的新题型 -------------------------------------------------------------

interface PolyphoneRow {
  char: string;
  word: string;
  right: string;
  wrong: [string, string];
  grade: Grade;
}

// One row = one word, so the same character can be asked again in a different
// word without the prompt colliding.
const POLYPHONES: PolyphoneRow[] = [
  { char: '长', word: '长江', right: 'cháng', wrong: ['zhǎng', 'chàng'], grade: 4 },
  { char: '行', word: '行走', right: 'xíng', wrong: ['háng', 'héng'], grade: 4 },
  { char: '重', word: '重要', right: 'zhòng', wrong: ['chóng', 'zhǒng'], grade: 4 },
  { char: '乐', word: '快乐', right: 'lè', wrong: ['yuè', 'yào'], grade: 4 },
  { char: '觉', word: '觉得', right: 'jué', wrong: ['jiào', 'jiǎo'], grade: 4 },
  { char: '得', word: '得到', right: 'dé', wrong: ['děi', 'de'], grade: 4 },
  { char: '着', word: '看着', right: 'zhe', wrong: ['zháo', 'zhuó'], grade: 4 },
  { char: '种', word: '种子', right: 'zhǒng', wrong: ['zhòng', 'chóng'], grade: 4 },
  { char: '数', word: '数学', right: 'shù', wrong: ['shǔ', 'shuò'], grade: 4 },
  { char: '为', word: '成为', right: 'wéi', wrong: ['wèi', 'wěi'], grade: 4 },
  { char: '兴', word: '高兴', right: 'xìng', wrong: ['xīng', 'xíng'], grade: 4 },
  { char: '发', word: '发现', right: 'fā', wrong: ['fà', 'fǎ'], grade: 4 },
  { char: '好', word: '好人', right: 'hǎo', wrong: ['hào', 'hāo'], grade: 4 },
  { char: '空', word: '天空', right: 'kōng', wrong: ['kòng', 'kǒng'], grade: 4 },
  { char: '干', word: '干活', right: 'gàn', wrong: ['gān', 'gǎn'], grade: 4 },
  { char: '应', word: '应该', right: 'yīng', wrong: ['yìng', 'yíng'], grade: 4 },
  { char: '相', word: '相同', right: 'xiāng', wrong: ['xiàng', 'xiǎng'], grade: 4 },
  { char: '处', word: '到处', right: 'chù', wrong: ['chǔ', 'chū'], grade: 4 },
  { char: '转', word: '转身', right: 'zhuǎn', wrong: ['zhuàn', 'zhuān'], grade: 4 },
  { char: '差', word: '差不多', right: 'chà', wrong: ['chā', 'chāi'], grade: 4 },

  { char: '便', word: '方便', right: 'biàn', wrong: ['pián', 'biǎn'], grade: 5 },
  { char: '参', word: '参加', right: 'cān', wrong: ['shēn', 'cēn'], grade: 5 },
  { char: '藏', word: '躲藏', right: 'cáng', wrong: ['zàng', 'cháng'], grade: 5 },
  { char: '曾', word: '曾经', right: 'céng', wrong: ['zēng', 'zèng'], grade: 5 },
  { char: '冲', word: '冲浪', right: 'chōng', wrong: ['chòng', 'chǒng'], grade: 5 },
  { char: '担', word: '担心', right: 'dān', wrong: ['dàn', 'dǎn'], grade: 5 },
  { char: '弹', word: '弹琴', right: 'tán', wrong: ['dàn', 'tǎn'], grade: 5 },
  { char: '调', word: '调整', right: 'tiáo', wrong: ['diào', 'tiāo'], grade: 5 },
  { char: '都', word: '都是', right: 'dōu', wrong: ['dū', 'dòu'], grade: 5 },
  { char: '恶', word: '凶恶', right: 'è', wrong: ['ě', 'wù'], grade: 5 },
  { char: '分', word: '分开', right: 'fēn', wrong: ['fèn', 'fěn'], grade: 5 },
  { char: '缝', word: '缝补', right: 'féng', wrong: ['fèng', 'fěng'], grade: 5 },
  { char: '更', word: '更加', right: 'gèng', wrong: ['gēng', 'gěng'], grade: 5 },
  { char: '供', word: '供应', right: 'gōng', wrong: ['gòng', 'gǒng'], grade: 5 },
  { char: '冠', word: '花冠', right: 'guān', wrong: ['guàn', 'guǎn'], grade: 5 },
  { char: '号', word: '号码', right: 'hào', wrong: ['háo', 'hǎo'], grade: 5 },
  { char: '还', word: '还有', right: 'hái', wrong: ['huán', 'huàn'], grade: 5 },
  { char: '几', word: '几个', right: 'jǐ', wrong: ['jī', 'jí'], grade: 5 },
  { char: '假', word: '假如', right: 'jiǎ', wrong: ['jià', 'jiā'], grade: 5 },
  { char: '间', word: '中间', right: 'jiān', wrong: ['jiàn', 'jiǎn'], grade: 5 },

  { char: '结', word: '结果', right: 'jié', wrong: ['jiē', 'jiě'], grade: 6 },
  { char: '禁', word: '禁止', right: 'jìn', wrong: ['jīn', 'jǐn'], grade: 6 },
  { char: '卷', word: '卷起', right: 'juǎn', wrong: ['juàn', 'juān'], grade: 6 },
  { char: '看', word: '看见', right: 'kàn', wrong: ['kān', 'kǎn'], grade: 6 },
  { char: '累', word: '劳累', right: 'lèi', wrong: ['lěi', 'léi'], grade: 6 },
  { char: '落', word: '落叶', right: 'luò', wrong: ['là', 'lào'], grade: 6 },
  { char: '蒙', word: '蒙住', right: 'méng', wrong: ['mēng', 'měng'], grade: 6 },
  { char: '难', word: '困难', right: 'nán', wrong: ['nàn', 'nǎn'], grade: 6 },
  { char: '宁', word: '安宁', right: 'níng', wrong: ['nìng', 'nǐng'], grade: 6 },
  { char: '铺', word: '铺开', right: 'pū', wrong: ['pù', 'pǔ'], grade: 6 },
  { char: '曲', word: '弯曲', right: 'qū', wrong: ['qǔ', 'qù'], grade: 6 },
  { char: '圈', word: '圆圈', right: 'quān', wrong: ['juàn', 'quán'], grade: 6 },
  { char: '散', word: '散步', right: 'sàn', wrong: ['sǎn', 'sān'], grade: 6 },
  { char: '舍', word: '舍得', right: 'shě', wrong: ['shè', 'shé'], grade: 6 },
  { char: '省', word: '节省', right: 'shěng', wrong: ['xǐng', 'xíng'], grade: 6 },
  { char: '似', word: '似乎', right: 'sì', wrong: ['shì', 'sī'], grade: 6 },
  { char: '宿', word: '宿舍', right: 'sù', wrong: ['xiǔ', 'xiù'], grade: 6 },
  { char: '系', word: '关系', right: 'xì', wrong: ['jì', 'xī'], grade: 6 },
];

interface RhetoricRow {
  sentence: string;
  kind: string;
  wrong: [string, string];
  grade: Grade;
}

const RHETORIC: RhetoricRow[] = [
  { sentence: '月亮像一只小船，挂在夜空中。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 4 },
  { sentence: '小草从地里探出头来，好奇地张望。', kind: '拟人', wrong: ['比喻', '排比'], grade: 4 },
  { sentence: '他跑得比风还快。', kind: '夸张', wrong: ['比喻', '拟人'], grade: 4 },
  { sentence: '天上的云朵像棉花糖一样柔软。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 4 },
  { sentence: '风儿轻轻地唱着歌。', kind: '拟人', wrong: ['比喻', '夸张'], grade: 4 },
  {
    sentence: '教室里静得连一根针掉在地上都能听见。',
    kind: '夸张',
    wrong: ['比喻', '拟人'],
    grade: 4,
  },
  {
    sentence: '春天来了，小草绿了，桃花红了，燕子回来了。',
    kind: '排比',
    wrong: ['比喻', '拟人'],
    grade: 4,
  },
  { sentence: '难道我们不应该珍惜时间吗？', kind: '反问', wrong: ['设问', '比喻'], grade: 4 },
  {
    sentence: '什么是幸福？幸福就是为别人着想。',
    kind: '设问',
    wrong: ['反问', '比喻'],
    grade: 4,
  },
  { sentence: '太阳公公露出了笑脸。', kind: '拟人', wrong: ['比喻', '夸张'], grade: 4 },
  { sentence: '书是人类进步的阶梯。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 4 },
  { sentence: '这棵树高得快要碰到天了。', kind: '夸张', wrong: ['比喻', '排比'], grade: 4 },
  { sentence: '小溪唱着欢快的歌，奔向远方。', kind: '拟人', wrong: ['比喻', '夸张'], grade: 4 },
  { sentence: '他的脸红得像一个熟透的苹果。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 4 },
  { sentence: '我饿得能吃下一头牛。', kind: '夸张', wrong: ['比喻', '拟人'], grade: 4 },
  { sentence: '是谁在唱歌？是林中的小鸟。', kind: '设问', wrong: ['反问', '拟人'], grade: 4 },

  {
    sentence: '地球，这位人类的母亲，这个生命的摇篮。',
    kind: '比喻',
    wrong: ['拟人', '夸张'],
    grade: 5,
  },
  { sentence: '小鸟在枝头快乐地歌唱。', kind: '拟人', wrong: ['比喻', '夸张'], grade: 5 },
  { sentence: '他饿得前胸贴后背。', kind: '夸张', wrong: ['比喻', '拟人'], grade: 5 },
  { sentence: '一本你喜爱的书就是一位朋友。', kind: '比喻', wrong: ['拟人', '排比'], grade: 5 },
  { sentence: '花儿在风中点头微笑。', kind: '拟人', wrong: ['比喻', '夸张'], grade: 5 },
  {
    sentence: '他说话的声音大得能把屋顶掀翻。',
    kind: '夸张',
    wrong: ['比喻', '拟人'],
    grade: 5,
  },
  {
    sentence: '下课了，同学们有的跳绳，有的踢毽子，有的丢沙包。',
    kind: '排比',
    wrong: ['比喻', '拟人'],
    grade: 5,
  },
  { sentence: '你怎么能这样对待朋友呢？', kind: '反问', wrong: ['设问', '夸张'], grade: 5 },
  {
    sentence: '谁最早迎来春天？是枝头的迎春花。',
    kind: '设问',
    wrong: ['反问', '拟人'],
    grade: 5,
  },
  { sentence: '荷叶像一个个碧绿的大圆盘。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 5 },
  { sentence: '蟋蟀在平台上弹琴。', kind: '拟人', wrong: ['比喻', '排比'], grade: 5 },
  { sentence: '教室里安静得能听见心跳声。', kind: '夸张', wrong: ['比喻', '拟人'], grade: 5 },
  {
    sentence: '燕子归来了，杨柳发芽了，桃花盛开了。',
    kind: '排比',
    wrong: ['比喻', '夸张'],
    grade: 5,
  },
  { sentence: '难道你不知道今天要上学吗？', kind: '反问', wrong: ['设问', '比喻'], grade: 5 },
  {
    sentence: '什么是真正的勇敢？真正的勇敢是明知困难仍然向前。',
    kind: '设问',
    wrong: ['反问', '夸张'],
    grade: 5,
  },
  { sentence: '大树像一把绿色的巨伞。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 5 },

  { sentence: '过去的日子如轻烟，被微风吹散了。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 6 },
  { sentence: '太阳他有脚啊，轻轻悄悄地挪移了。', kind: '拟人', wrong: ['比喻', '夸张'], grade: 6 },
  { sentence: '他高兴得一蹦三尺高。', kind: '夸张', wrong: ['比喻', '拟人'], grade: 6 },
  {
    sentence: '读书是一种乐趣，读书是一种享受，读书是一种成长。',
    kind: '排比',
    wrong: ['比喻', '拟人'],
    grade: 6,
  },
  { sentence: '难道这不是伟大的奇观吗？', kind: '反问', wrong: ['设问', '比喻'], grade: 6 },
  { sentence: '谁是最了解我的人？是我的妈妈。', kind: '设问', wrong: ['反问', '拟人'], grade: 6 },
  { sentence: '那双手像鹰爪一样有力。', kind: '比喻', wrong: ['拟人', '夸张'], grade: 6 },
  { sentence: '小溪一路欢歌，奔向大海。', kind: '拟人', wrong: ['比喻', '排比'], grade: 6 },
  {
    sentence: '教室里静得连呼吸声都听得见。',
    kind: '夸张',
    wrong: ['比喻', '拟人'],
    grade: 6,
  },
  {
    sentence: '他像一只忙碌的小蜜蜂，在花丛中穿梭。',
    kind: '比喻',
    wrong: ['拟人', '夸张'],
    grade: 6,
  },
  {
    sentence: '桃花笑红了脸，柳树摇着绿色的长辫子。',
    kind: '拟人',
    wrong: ['比喻', '排比'],
    grade: 6,
  },
  { sentence: '这间屋子小得转不过身来。', kind: '夸张', wrong: ['比喻', '拟人'], grade: 6 },
  {
    sentence: '春天是播种的季节，夏天是生长的季节，秋天是收获的季节。',
    kind: '排比',
    wrong: ['比喻', '拟人'],
    grade: 6,
  },
  { sentence: '你难道不觉得这很美吗？', kind: '反问', wrong: ['设问', '夸张'], grade: 6 },
  {
    sentence: '为什么要读书？因为书能带我们看见更大的世界。',
    kind: '设问',
    wrong: ['反问', '比喻'],
    grade: 6,
  },
  {
    sentence: '书籍像一艘艘小船，载着我们驶向知识的海洋。',
    kind: '比喻',
    wrong: ['拟人', '夸张'],
    grade: 6,
  },
];

interface ConjunctionRow {
  sentence: string;
  answer: string;
  wrong: [string, string];
  grade: Grade;
}

// Both blanks live in one prompt, so the pair has to fit the whole sentence.
const CONJUNCTIONS: ConjunctionRow[] = [
  {
    sentence: '（ ）今天下雨，（ ）运动会照常举行。',
    answer: '虽然……但是……',
    wrong: ['因为……所以……', '不但……而且……'],
    grade: 4,
  },
  {
    sentence: '（ ）你努力学习，（ ）会取得好成绩。',
    answer: '只要……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 4,
  },
  {
    sentence: '他（ ）会弹琴，（ ）会画画。',
    answer: '不但……而且……',
    wrong: ['因为……所以……', '如果……就……'],
    grade: 4,
  },
  {
    sentence: '（ ）明天下雨，我们（ ）不去公园了。',
    answer: '如果……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 4,
  },
  {
    sentence: '（ ）天气多冷，他（ ）坚持晨跑。',
    answer: '无论……都……',
    wrong: ['因为……所以……', '如果……就……'],
    grade: 4,
  },
  {
    sentence: '（ ）在家看电视，（ ）出去走走。',
    answer: '与其……不如……',
    wrong: ['虽然……但是……', '因为……所以……'],
    grade: 4,
  },
  {
    sentence: '他（ ）唱歌，（ ）跳舞。',
    answer: '一边……一边……',
    wrong: ['因为……所以……', '虽然……但是……'],
    grade: 4,
  },
  {
    sentence: '这件事（ ）他做的，（ ）我做的。',
    answer: '不是……而是……',
    wrong: ['不但……而且……', '因为……所以……'],
    grade: 4,
  },
  {
    sentence: '（ ）下雨，我们（ ）要出发。',
    answer: '即使……也……',
    wrong: ['因为……所以……', '不但……而且……'],
    grade: 4,
  },
  {
    sentence: '我（ ）多走几步，（ ）不愿意踩坏花草。',
    answer: '宁可……也不……',
    wrong: ['因为……所以……', '不但……而且……'],
    grade: 4,
  },
  {
    sentence: '（ ）你已经答应了，（ ）应该做到。',
    answer: '既然……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 4,
  },
  {
    sentence: '（ ）今天堵车，（ ）他迟到了。',
    answer: '因为……所以……',
    wrong: ['虽然……但是……', '只要……就……'],
    grade: 4,
  },

  {
    sentence: '（ ）这道题很难，（ ）他还是做出来了。',
    answer: '虽然……但是……',
    wrong: ['因为……所以……', '只要……就……'],
    grade: 5,
  },
  {
    sentence: '（ ）你坚持练习，（ ）会有进步。',
    answer: '只要……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 5,
  },
  {
    sentence: '他（ ）成绩好，（ ）乐于助人。',
    answer: '不但……而且……',
    wrong: ['因为……所以……', '虽然……但是……'],
    grade: 5,
  },
  {
    sentence: '（ ）明天天气好，我们（ ）去爬山。',
    answer: '如果……就……',
    wrong: ['虽然……但是……', '无论……都……'],
    grade: 5,
  },
  {
    sentence: '（ ）走到哪里，他（ ）记得家乡的味道。',
    answer: '无论……都……',
    wrong: ['因为……所以……', '只有……才……'],
    grade: 5,
  },
  {
    sentence: '（ ）多读几遍，（ ）能读懂这段话。',
    answer: '只有……才……',
    wrong: ['不但……而且……', '虽然……但是……'],
    grade: 5,
  },
  {
    sentence: '妈妈（ ）做饭，（ ）听广播。',
    answer: '一边……一边……',
    wrong: ['不但……而且……', '因为……所以……'],
    grade: 5,
  },
  {
    sentence: '这支笔（ ）他的，（ ）我的。',
    answer: '不是……而是……',
    wrong: ['不但……而且……', '虽然……但是……'],
    grade: 5,
  },
  {
    sentence: '（ ）雨再大，比赛（ ）照常进行。',
    answer: '即使……也……',
    wrong: ['因为……所以……', '如果……就……'],
    grade: 5,
  },
  {
    sentence: '我（ ）多走几步，（ ）不愿意打扰别人。',
    answer: '宁可……也不……',
    wrong: ['因为……所以……', '只要……就……'],
    grade: 5,
  },
  {
    sentence: '（ ）你已经知道错了，（ ）应该改正。',
    answer: '既然……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 5,
  },
  {
    sentence: '（ ）他平时练习认真，（ ）比赛时发挥得很稳定。',
    answer: '因为……所以……',
    wrong: ['虽然……但是……', '只有……才……'],
    grade: 5,
  },

  {
    sentence: '（ ）困难再多，我们（ ）要完成任务。',
    answer: '即使……也……',
    wrong: ['因为……所以……', '只要……就……'],
    grade: 6,
  },
  {
    sentence: '（ ）你付出努力，（ ）会收获成长。',
    answer: '只要……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 6,
  },
  {
    sentence: '这本书（ ）内容丰富，（ ）插图精美。',
    answer: '不但……而且……',
    wrong: ['因为……所以……', '不是……而是……'],
    grade: 6,
  },
  {
    sentence: '（ ）明天下雨，活动（ ）改在室内。',
    answer: '如果……就……',
    wrong: ['虽然……但是……', '不但……而且……'],
    grade: 6,
  },
  {
    sentence: '（ ）谁遇到困难，他（ ）会伸手帮忙。',
    answer: '无论……都……',
    wrong: ['因为……所以……', '只有……才……'],
    grade: 6,
  },
  {
    sentence: '（ ）亲自试一试，（ ）知道其中的难处。',
    answer: '只有……才……',
    wrong: ['不但……而且……', '虽然……但是……'],
    grade: 6,
  },
  {
    sentence: '他（ ）写作业，（ ）听轻音乐。',
    answer: '一边……一边……',
    wrong: ['不但……而且……', '因为……所以……'],
    grade: 6,
  },
  {
    sentence: '负责这件事的（ ）他的同桌，（ ）他。',
    answer: '不是……而是……',
    wrong: ['不但……而且……', '虽然……但是……'],
    grade: 6,
  },
  {
    sentence: '（ ）时间很紧，我们（ ）要保证质量。',
    answer: '虽然……但是……',
    wrong: ['因为……所以……', '只要……就……'],
    grade: 6,
  },
  {
    sentence: '我（ ）多花时间，（ ）不愿意敷衍了事。',
    answer: '宁可……也不……',
    wrong: ['因为……所以……', '不但……而且……'],
    grade: 6,
  },
  {
    sentence: '（ ）你已经决定了，（ ）认真去做。',
    answer: '既然……就……',
    wrong: ['虽然……但是……', '即使……也……'],
    grade: 6,
  },
  {
    sentence: '（ ）他长期坚持阅读，（ ）作文越写越好。',
    answer: '因为……所以……',
    wrong: ['虽然……但是……', '只有……才……'],
    grade: 6,
  },
];

interface LiteraryRow {
  prompt: string;
  answer: string;
  wrong: [string, string];
  grade: Grade;
  explain?: string;
}

const LITERARY: LiteraryRow[] = [
  {
    prompt: '《题西林壁》的作者是谁？',
    answer: '苏轼',
    wrong: ['李白', '杜甫'],
    grade: 4,
  },
  {
    prompt: '《暮江吟》的作者是谁？',
    answer: '白居易',
    wrong: ['王维', '孟浩然'],
    grade: 4,
  },
  {
    prompt: '《夏日绝句》的作者是谁？',
    answer: '李清照',
    wrong: ['李白', '杜甫'],
    grade: 4,
  },
  {
    prompt: '《别董大》的作者是谁？',
    answer: '高适',
    wrong: ['王维', '孟浩然'],
    grade: 4,
  },
  {
    prompt: '《西游记》的作者是谁？',
    answer: '吴承恩',
    wrong: ['罗贯中', '施耐庵'],
    grade: 4,
  },
  {
    prompt: '《三国演义》的作者是谁？',
    answer: '罗贯中',
    wrong: ['吴承恩', '曹雪芹'],
    grade: 4,
  },
  {
    prompt: '《水浒传》的作者是谁？',
    answer: '施耐庵',
    wrong: ['罗贯中', '吴承恩'],
    grade: 4,
  },
  {
    prompt: '《红楼梦》的作者是谁？',
    answer: '曹雪芹',
    wrong: ['施耐庵', '蒲松龄'],
    grade: 4,
  },
  { prompt: '李白被后人称为（ ）。', answer: '诗仙', wrong: ['诗圣', '诗鬼'], grade: 4 },
  { prompt: '杜甫被后人称为（ ）。', answer: '诗圣', wrong: ['诗仙', '诗佛'], grade: 4 },
  {
    prompt: '《草船借箭》的故事出自哪部名著？',
    answer: '《三国演义》',
    wrong: ['《西游记》', '《水浒传》'],
    grade: 4,
  },
  {
    prompt: '《将相和》的故事出自哪部史书？',
    answer: '《史记》',
    wrong: ['《汉书》', '《左传》'],
    grade: 4,
  },
  {
    prompt: '安徒生是哪个国家的童话作家？',
    answer: '丹麦',
    wrong: ['英国', '法国'],
    grade: 4,
  },
  {
    prompt: '《卖火柴的小女孩》的作者是谁？',
    answer: '安徒生',
    wrong: ['格林兄弟', '普希金'],
    grade: 4,
  },
  {
    prompt: '《昆虫记》的作者是谁？',
    answer: '法布尔',
    wrong: ['达尔文', '凡尔纳'],
    grade: 4,
  },
  {
    prompt: '《嫦娥奔月》是一个（ ）故事。',
    answer: '神话',
    wrong: ['寓言', '童话'],
    grade: 4,
  },

  { prompt: '《示儿》的作者是谁？', answer: '陆游', wrong: ['辛弃疾', '苏轼'], grade: 5 },
  { prompt: '《题临安邸》的作者是谁？', answer: '林升', wrong: ['陆游', '杨万里'], grade: 5 },
  { prompt: '《泊船瓜洲》的作者是谁？', answer: '王安石', wrong: ['苏轼', '欧阳修'], grade: 5 },
  { prompt: '《山居秋暝》的作者是谁？', answer: '王维', wrong: ['李白', '孟浩然'], grade: 5 },
  {
    prompt: '《长相思》的作者是谁？',
    answer: '纳兰性德',
    wrong: ['李清照', '辛弃疾'],
    grade: 5,
  },
  { prompt: '《渔歌子》的作者是谁？', answer: '张志和', wrong: ['柳宗元', '白居易'], grade: 5 },
  {
    prompt: '《晓出净慈寺送林子方》的作者是谁？',
    answer: '杨万里',
    wrong: ['苏轼', '王安石'],
    grade: 5,
  },
  {
    prompt: '《论语》记录的是谁的言行？',
    answer: '孔子',
    wrong: ['孟子', '老子'],
    grade: 5,
  },
  { prompt: '《史记》的作者是谁？', answer: '司马迁', wrong: ['班固', '司马光'], grade: 5 },
  {
    prompt: '《资治通鉴》的作者是谁？',
    answer: '司马光',
    wrong: ['司马迁', '班固'],
    grade: 5,
  },
  {
    prompt: '《草船借箭》中成功借到箭的是（ ）。',
    answer: '诸葛亮',
    wrong: ['曹操', '周瑜'],
    grade: 5,
  },
  {
    prompt: '《景阳冈》中赤手空拳打虎的是（ ）。',
    answer: '武松',
    wrong: ['李逵', '林冲'],
    grade: 5,
  },
  {
    prompt: '《西游记》中唐僧的大徒弟是（ ）。',
    answer: '孙悟空',
    wrong: ['猪八戒', '沙僧'],
    grade: 5,
  },
  {
    prompt: '《水浒传》中绰号“及时雨”的是（ ）。',
    answer: '宋江',
    wrong: ['武松', '林冲'],
    grade: 5,
  },
  {
    prompt: '《西游记》中“三打白骨精”的是（ ）。',
    answer: '孙悟空',
    wrong: ['猪八戒', '沙僧'],
    grade: 5,
  },
  {
    prompt: '《伊索寓言》是哪里的寓言集？',
    answer: '古希腊',
    wrong: ['古罗马', '古埃及'],
    grade: 5,
  },

  { prompt: '《竹石》的作者是谁？', answer: '郑燮', wrong: ['于谦', '王冕'], grade: 6 },
  { prompt: '《石灰吟》的作者是谁？', answer: '于谦', wrong: ['郑燮', '王安石'], grade: 6 },
  { prompt: '《马诗》的作者是谁？', answer: '李贺', wrong: ['李白', '杜牧'], grade: 6 },
  { prompt: '《游园不值》的作者是谁？', answer: '叶绍翁', wrong: ['杨万里', '苏轼'], grade: 6 },
  { prompt: '《十五夜望月》的作者是谁？', answer: '王建', wrong: ['杜牧', '李商隐'], grade: 6 },
  { prompt: '《浪淘沙》的作者是谁？', answer: '刘禹锡', wrong: ['白居易', '柳宗元'], grade: 6 },
  {
    prompt: '《西江月·夜行黄沙道中》的作者是谁？',
    answer: '辛弃疾',
    wrong: ['苏轼', '李清照'],
    grade: 6,
  },
  {
    prompt: '《六月二十七日望湖楼醉书》的作者是谁？',
    answer: '苏轼',
    wrong: ['王安石', '陆游'],
    grade: 6,
  },
  {
    prompt: '《鲁滨逊漂流记》的作者是谁？',
    answer: '笛福',
    wrong: ['斯威夫特', '马克·吐温'],
    grade: 6,
  },
  {
    prompt: '《童年》的作者是谁？',
    answer: '高尔基',
    wrong: ['托尔斯泰', '契诃夫'],
    grade: 6,
  },
  { prompt: '鲁迅的原名是什么？', answer: '周树人', wrong: ['周作人', '沈雁冰'], grade: 6 },
  { prompt: '《北京的春节》的作者是谁？', answer: '老舍', wrong: ['朱自清', '巴金'], grade: 6 },
  { prompt: '《匆匆》的作者是谁？', answer: '朱自清', wrong: ['老舍', '冰心'], grade: 6 },
  {
    prompt: '《穷人》的作者是谁？',
    answer: '列夫·托尔斯泰',
    wrong: ['高尔基', '契诃夫'],
    grade: 6,
  },
  {
    prompt: '《汤姆·索亚历险记》的作者是谁？',
    answer: '马克·吐温',
    wrong: ['笛福', '斯威夫特'],
    grade: 6,
  },
  {
    prompt: '《骑鹅旅行记》的作者是谁？',
    answer: '塞尔玛·拉格洛夫',
    wrong: ['安徒生', '格林兄弟'],
    grade: 6,
  },
];

interface GlossRow {
  idiom: string;
  char: string;
  meaning: string;
  wrong: [string, string];
  grade: Grade;
}

const GLOSSES: GlossRow[] = [
  {
    idiom: '走马观花',
    char: '走',
    meaning: '跑',
    wrong: ['行走', '离开'],
    grade: 4,
  },
  {
    idiom: '举一反三',
    char: '举',
    meaning: '提出',
    wrong: ['举起', '推举'],
    grade: 4,
  },
  {
    idiom: '赴汤蹈火',
    char: '汤',
    meaning: '热水',
    wrong: ['汤药', '汤水'],
    grade: 4,
  },
  { idiom: '眼疾手快', char: '疾', meaning: '快', wrong: ['疾病', '痛恨'], grade: 4 },
  {
    idiom: '无缘无故',
    char: '缘',
    meaning: '原因',
    wrong: ['缘分', '边缘'],
    grade: 4,
  },
  { idiom: '顾名思义', char: '顾', meaning: '看', wrong: ['照顾', '顾及'], grade: 4 },
  { idiom: '爱不释手', char: '释', meaning: '放下', wrong: ['解释', '释放'], grade: 4 },
  { idiom: '一饮而尽', char: '尽', meaning: '完', wrong: ['尽力', '尽头'], grade: 4 },

  {
    idiom: '举世闻名',
    char: '举',
    meaning: '全',
    wrong: ['举起', '推举'],
    grade: 5,
  },
  {
    idiom: '不期而遇',
    char: '期',
    meaning: '约定',
    wrong: ['日期', '期待'],
    grade: 5,
  },
  {
    idiom: '莫名其妙',
    char: '名',
    meaning: '说出',
    wrong: ['名字', '名声'],
    grade: 5,
  },
  {
    idiom: '三顾茅庐',
    char: '顾',
    meaning: '拜访',
    wrong: ['看', '照顾'],
    grade: 5,
  },
  { idiom: '守株待兔', char: '待', meaning: '等待', wrong: ['对待', '招待'], grade: 5 },
  {
    idiom: '不计其数',
    char: '计',
    meaning: '计算',
    wrong: ['计谋', '计划'],
    grade: 5,
  },
  { idiom: '无边无际', char: '际', meaning: '边缘', wrong: ['国际', '交际'], grade: 5 },
  { idiom: '一丝不苟', char: '苟', meaning: '马虎', wrong: ['苟且', '如果'], grade: 5 },

  { idiom: '张冠李戴', char: '冠', meaning: '帽子', wrong: ['冠军', '树冠'], grade: 6 },
  {
    idiom: '囫囵吞枣',
    char: '囫囵',
    meaning: '整个',
    wrong: ['糊涂', '圆圈'],
    grade: 6,
  },
  { idiom: '饱经风霜', char: '饱', meaning: '充分', wrong: ['吃饱', '饱满'], grade: 6 },
  { idiom: '百折不挠', char: '挠', meaning: '弯曲', wrong: ['抓挠', '阻挠'], grade: 6 },
  {
    idiom: '养尊处优',
    char: '处',
    meaning: '处于',
    wrong: ['处理', '相处'],
    grade: 6,
  },
  { idiom: '惊心动魄', char: '魄', meaning: '魂魄', wrong: ['气魄', '体魄'], grade: 6 },
  {
    idiom: '大显身手',
    char: '身手',
    meaning: '本领',
    wrong: ['身体', '手指'],
    grade: 6,
  },
  { idiom: '心安理得', char: '得', meaning: '合适', wrong: ['得到', '得意'], grade: 6 },
];

function twoDistinct<T>(items: T[], random: () => number, label: (item: T) => string): T[] {
  const seen = new Set<string>();
  const picked: T[] = [];
  for (const item of shuffle(items, random)) {
    if (picked.length === 2) break;
    const key = label(item);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(item);
  }
  return picked;
}

function charQuestions(): SubjectQuestion[] {
  const out: SubjectQuestion[] = [];
  for (const row of CHARS) {
    const peers = CHARS.filter((item) => item.grade === row.grade && item.char !== row.char);
    const readRandom = seededRandom(`read:${row.char}`);
    const readPeers = twoDistinct(
      peers.filter((item) => item.pinyin !== row.pinyin),
      readRandom,
      (item) => item.pinyin,
    );
    if (readPeers.length < 2) throw new Error(`Not enough char peers for ${row.char}`);
    out.push({
      key: `zh:char:read:${row.char}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '拼音认字',
      prompt: row.pinyin,
      note: '读一读拼音，选出对应的汉字',
      choices: shuffle([row.char, ...readPeers.map((item) => item.char)], readRandom),
      answer: row.char,
      explain: `${row.pinyin} 是「${row.char}」的读音。`,
      display: 'pinyin',
    });

    const soundRandom = seededRandom(`sound:${row.char}`);
    const soundPeers = twoDistinct(
      peers.filter((item) => item.pinyin !== row.pinyin),
      soundRandom,
      (item) => item.pinyin,
    );
    if (soundPeers.length < 2) throw new Error(`Not enough pinyin peers for ${row.char}`);
    out.push({
      key: `zh:char:sound:${row.char}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '看字选音',
      prompt: row.char,
      note: '选出正确的读音',
      choices: shuffle([row.pinyin, ...soundPeers.map((item) => item.pinyin)], soundRandom),
      answer: row.pinyin,
      explain: `「${row.char}」读作 ${row.pinyin}。`,
      display: 'char',
    });
  }
  return out;
}

function poemQuestions(): SubjectQuestion[] {
  return POEMS.map((poem, index) => {
    const random = seededRandom(`poem:${index}`);
    const others = POEMS.filter((item) => item.title !== poem.title && item.second !== poem.second);
    const distractors = twoDistinct(others, random, (item) => item.second).map(
      (item) => item.second,
    );
    return {
      key: `zh:poem:${index}`,
      subject: 'chinese',
      grade: poem.grade,
      topic: '古诗接句',
      prompt: `《${poem.title}》\n${poem.first}，______。`,
      note: '补全诗句',
      choices: shuffle([poem.second, ...distractors], random),
      answer: poem.second,
      explain: `《${poem.title}》：${poem.first}，${poem.second}。`,
    };
  });
}

function idiomQuestions(): SubjectQuestion[] {
  return IDIOMS.map((row, index) => {
    const random = seededRandom(`idiom:${index}`);
    const missing = row.idiom[row.index];
    const blanked = `${row.idiom.slice(0, row.index)}（ ）${row.idiom.slice(row.index + 1)}`;
    return {
      key: `zh:idiom:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '成语填空',
      prompt: blanked,
      note: '补全成语',
      choices: shuffle([missing, ...row.wrong], random),
      answer: missing,
      explain: `成语是「${row.idiom}」。`,
    };
  });
}

function antonymQuestions(): SubjectQuestion[] {
  return ANTONYMS.map((row, index) => {
    const random = seededRandom(`antonym:${index}`);
    const pool = FILLER_CHARS.filter((char) => char !== row.a && char !== row.b);
    const distractors = twoDistinct(pool, random, (char) => char);
    return {
      key: `zh:antonym:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '反义词',
      prompt: `「${row.a}」的反义词是哪个字？`,
      note: '选出意思相反的字',
      choices: shuffle([row.b, ...distractors], random),
      answer: row.b,
      explain: `「${row.a}」和「${row.b}」是一对反义词。`,
    };
  });
}

function synonymQuestions(): SubjectQuestion[] {
  return SYNONYMS.map((row, index) => {
    const random = seededRandom(`synonym:${index}`);
    return {
      key: `zh:synonym:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '近义词',
      prompt: `「${row.a}」的近义词是？`,
      note: '选出意思相近的词',
      choices: shuffle([row.b, ...row.wrong], random),
      answer: row.b,
      explain: `「${row.a}」和「${row.b}」意思相近。`,
    };
  });
}

function measureQuestions(): SubjectQuestion[] {
  return MEASURES.map((row, index) => {
    const random = seededRandom(`measure:${index}`);
    return {
      key: `zh:measure:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '量词搭配',
      prompt: `一（ ）${row.noun}`,
      note: '选出合适的量词',
      choices: shuffle([row.measure, ...row.wrong], random),
      answer: row.measure,
      explain: `可以说「一${row.measure}${row.noun}」。`,
    };
  });
}

function collocationQuestions(): SubjectQuestion[] {
  return COLLOCATIONS.map((row, index) => {
    const random = seededRandom(`collocation:${index}`);
    return {
      key: `zh:collocation:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '词语搭配',
      prompt: `（ ）${row.noun}`,
      note: '选出搭配正确的词语',
      choices: shuffle([row.verb, ...row.wrong], random),
      answer: row.verb,
      explain: `正确搭配是「${row.verb}${row.noun}」。`,
    };
  });
}

function radicalQuestions(): SubjectQuestion[] {
  return RADICALS.map((row, index) => {
    const random = seededRandom(`radical:${index}`);
    return {
      key: `zh:radical:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '偏旁部首',
      prompt: `「${row.char}」的偏旁是什么？`,
      note: '选出这个字的偏旁',
      choices: shuffle([row.radical, ...row.wrong], random),
      answer: row.radical,
      explain: `「${row.char}」的偏旁是「${row.radical}」。`,
    };
  });
}

function polyphoneQuestions(): SubjectQuestion[] {
  return POLYPHONES.map((row, index) => {
    const random = seededRandom(`poly:${index}`);
    return {
      key: `zh:poly:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '多音字',
      prompt: `「${row.char}」在「${row.word}」中读什么？`,
      note: '选出这个字在词语中的读音',
      choices: shuffle([row.right, ...row.wrong], random),
      answer: row.right,
      explain: `「${row.word}」中的「${row.char}」读 ${row.right}。`,
    };
  });
}

function wordAntonymQuestions(): SubjectQuestion[] {
  return WORD_ANTONYMS.map((row, index) => {
    const random = seededRandom(`antonymw:${index}`);
    return {
      key: `zh:antonymw:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '反义词',
      prompt: `「${row.a}」的反义词是？`,
      note: '选出意思相反的词语',
      choices: shuffle([row.b, ...row.wrong], random),
      answer: row.b,
      explain: `「${row.a}」和「${row.b}」意思相反。`,
    };
  });
}

function rhetoricQuestions(): SubjectQuestion[] {
  return RHETORIC.map((row, index) => {
    const random = seededRandom(`rhetoric:${index}`);
    return {
      key: `zh:rhetoric:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '修辞手法',
      prompt: `「${row.sentence}」\n用了什么修辞手法？`,
      note: '选出句子使用的修辞手法',
      choices: shuffle([row.kind, ...row.wrong], random),
      answer: row.kind,
      explain: `这句话用了${row.kind}的修辞手法。`,
    };
  });
}

function conjunctionQuestions(): SubjectQuestion[] {
  return CONJUNCTIONS.map((row, index) => {
    const random = seededRandom(`conj:${index}`);
    return {
      key: `zh:conj:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '关联词',
      prompt: row.sentence,
      note: '选出合适的关联词',
      choices: shuffle([row.answer, ...row.wrong], random),
      answer: row.answer,
      explain: `填上「${row.answer}」，句子才通顺。`,
    };
  });
}

function literaryQuestions(): SubjectQuestion[] {
  return LITERARY.map((row, index) => {
    const random = seededRandom(`literary:${index}`);
    return {
      key: `zh:literary:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '文学常识',
      prompt: row.prompt,
      note: '选出正确的答案',
      choices: shuffle([row.answer, ...row.wrong], random),
      answer: row.answer,
      explain: row.explain ?? `正确答案是${row.answer}。`,
    };
  });
}

function glossQuestions(): SubjectQuestion[] {
  return GLOSSES.map((row, index) => {
    const random = seededRandom(`gloss:${index}`);
    return {
      key: `zh:gloss:${index}`,
      subject: 'chinese',
      grade: row.grade,
      topic: '字词理解',
      prompt: `「${row.idiom}」中的「${row.char}」是什么意思？`,
      note: '选出加点字的意思',
      choices: shuffle([row.meaning, ...row.wrong], random),
      answer: row.meaning,
      explain: `「${row.idiom}」中的「${row.char}」是“${row.meaning}”的意思。`,
    };
  });
}

const ALL_QUESTIONS: SubjectQuestion[] = [
  ...charQuestions(),
  ...poemQuestions(),
  ...idiomQuestions(),
  ...antonymQuestions(),
  ...synonymQuestions(),
  ...measureQuestions(),
  ...collocationQuestions(),
  ...radicalQuestions(),
  ...polyphoneQuestions(),
  ...wordAntonymQuestions(),
  ...rhetoricQuestions(),
  ...conjunctionQuestions(),
  ...literaryQuestions(),
  ...glossQuestions(),
];

const BY_GRADE = new Map<Grade, SubjectQuestion[]>(
  GRADES.map((grade) => [grade, ALL_QUESTIONS.filter((item) => item.grade === grade)]),
);

export const CHINESE_QUESTIONS = ALL_QUESTIONS;
export const CHINESE_TOTAL = ALL_QUESTIONS.length;

export function chineseQuestions(grade: Grade): SubjectQuestion[] {
  return BY_GRADE.get(grade) ?? [];
}

export const CHINESE_TOPICS = [...new Set(ALL_QUESTIONS.map((item) => item.topic))];
