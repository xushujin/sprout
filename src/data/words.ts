export interface Word {
  id: string;
  en: string;
  zh: string;
  emoji: string;
  phonetic: string;
  category: string;
  image?: string;
  audioId?: string;
}

// Independently assembled common-word exercises, not a textbook word list.
// Keep IDs stable so existing local progress survives content updates.
export const WORDS: Word[] = [
  { id: 'apple', en: 'apple', zh: '苹果', emoji: '🍎', phonetic: '/ˈæp.əl/', category: '水果朋友' },
  {
    id: 'banana',
    en: 'banana',
    zh: '香蕉',
    emoji: '🍌',
    phonetic: '/bəˈnæn.ə/',
    category: '水果朋友',
  },
  {
    id: 'orange',
    en: 'orange',
    zh: '橙子',
    emoji: '🍊',
    phonetic: '/ˈɔːr.ɪndʒ/',
    category: '水果朋友',
  },
  { id: 'grape', en: 'grape', zh: '葡萄', emoji: '🍇', phonetic: '/ɡreɪp/', category: '水果朋友' },
  { id: 'pear', en: 'pear', zh: '梨', emoji: '🍐', phonetic: '/per/', category: '水果朋友' },
  { id: 'cat', en: 'cat', zh: '猫', emoji: '🐱', phonetic: '/kæt/', category: '动物伙伴' },
  { id: 'dog', en: 'dog', zh: '狗', emoji: '🐶', phonetic: '/dɔːɡ/', category: '动物伙伴' },
  {
    id: 'rabbit',
    en: 'rabbit',
    zh: '兔子',
    emoji: '🐰',
    phonetic: '/ˈræb.ɪt/',
    category: '动物伙伴',
  },
  { id: 'bird', en: 'bird', zh: '鸟', emoji: '🐦', phonetic: '/bɜːrd/', category: '动物伙伴' },
  { id: 'fish', en: 'fish', zh: '鱼', emoji: '🐟', phonetic: '/fɪʃ/', category: '动物伙伴' },
  { id: 'sun', en: 'sun', zh: '太阳', emoji: '☀️', phonetic: '/sʌn/', category: '身边的世界' },
  { id: 'moon', en: 'moon', zh: '月亮', emoji: '🌙', phonetic: '/muːn/', category: '身边的世界' },
  { id: 'star', en: 'star', zh: '星星', emoji: '⭐', phonetic: '/stɑːr/', category: '身边的世界' },
  { id: 'tree', en: 'tree', zh: '树', emoji: '🌳', phonetic: '/triː/', category: '身边的世界' },
  {
    id: 'flower',
    en: 'flower',
    zh: '花',
    emoji: '🌼',
    phonetic: '/ˈflaʊ.ər/',
    category: '身边的世界',
  },
  { id: 'book', en: 'book', zh: '书', emoji: '📕', phonetic: '/bʊk/', category: '我的小书包' },
  {
    id: 'pencil',
    en: 'pencil',
    zh: '铅笔',
    emoji: '✏️',
    phonetic: '/ˈpen.səl/',
    category: '我的小书包',
  },
  { id: 'bag', en: 'bag', zh: '包；袋子', emoji: '👜', phonetic: '/bæɡ/', category: '身边的世界' },
  {
    id: 'ruler',
    en: 'ruler',
    zh: '尺子',
    emoji: '📐',
    phonetic: '/ˈruː.lər/',
    category: '我的小书包',
  },
  {
    id: 'clock',
    en: 'clock',
    zh: '时钟',
    emoji: '⏰',
    phonetic: '/klɑːk/',
    category: '我的小书包',
  },
];
