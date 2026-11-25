import { GENERAL_WORDS } from './curriculum-words.ts';
import type { Word } from './words.ts';

export interface DialogueLine {
  speaker: 'A' | 'B';
  text: string;
}

export interface DialogueEntry {
  id: string;
  pack: string;
  lines: readonly DialogueLine[];
  /** Word IDs that fit the blank in this conversation. */
  answers: readonly string[];
  /** Curated wrong options: same pack, grammatically possible in the slot. */
  distractors: readonly string[];
  /** Chinese support. Keeps the blank so the hint never hands over the answer. */
  translation: string;
}

// Project-authored micro-dialogues for topic packs. Every answer is an approved
// vocabulary item from the same pack; surrounding lines use a small set of
// glue words (is / does / the / your ...) that are read as context, not tested.
// Keep lines short: at 393px a bubble holds roughly 28–32 characters per line.
export const DIALOGUES: readonly DialogueEntry[] = [
  {
    id: 'animals-cat',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: "What's this?" },
      { speaker: 'B', text: "It's a ___. It says meow." },
    ],
    answers: ['cat'],
    distractors: ['dog', 'duck'],
    translation: '这是什么？是一只___，它喵喵叫。',
  },
  {
    id: 'animals-dog',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'Is this your ___?' },
      { speaker: 'B', text: 'Yes! It says woof and wags its tail.' },
    ],
    answers: ['dog'],
    distractors: ['cat', 'pig'],
    translation: '这是你的___吗？是呀！它汪汪叫，还摇尾巴。',
  },
  {
    id: 'animals-rabbit',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'Look at the ___.' },
      { speaker: 'B', text: 'It has long ears and likes carrots.' },
    ],
    answers: ['rabbit'],
    distractors: ['cat', 'duck'],
    translation: '看那只___。它有长耳朵，还爱吃胡萝卜。',
  },
  {
    id: 'animals-wings',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'Can the ___ fly?' },
      { speaker: 'B', text: 'Yes! It has two wings.' },
    ],
    answers: ['bird', 'butterfly'],
    distractors: ['fish', 'frog', 'pig'],
    translation: '这只___会飞吗？会呀！它有一对翅膀。',
  },
  {
    id: 'animals-water',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'Where does the ___ live?' },
      { speaker: 'B', text: 'In the water. It can swim.' },
    ],
    answers: ['fish', 'duck'],
    distractors: ['cat', 'bird', 'rabbit'],
    translation: '这只___住在哪里？在水里，它会游泳。',
  },
  {
    id: 'animals-black-white',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'Look! The ___ is black and white.' },
      { speaker: 'B', text: "It's so cute!" },
    ],
    answers: ['panda', 'penguin'],
    distractors: ['tiger', 'pig', 'duck'],
    translation: '看！这只___是黑白相间的。好可爱呀！',
  },
  {
    id: 'animals-elephant',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'The ___ has a long nose.' },
      { speaker: 'B', text: 'And it is very big!' },
    ],
    answers: ['elephant'],
    distractors: ['rabbit', 'cat'],
    translation: '这只___有长长的鼻子。而且它好大呀！',
  },
  {
    id: 'animals-strong',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'The ___ is big and strong.' },
      { speaker: 'B', text: 'Wow! It can run very fast.' },
    ],
    answers: ['tiger', 'lion', 'bear', 'horse'],
    distractors: ['cat', 'duck', 'fish'],
    translation: '这只___又大又壮。哇！它跑得可快了。',
  },
  {
    id: 'animals-pig',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'What does the ___ say?' },
      { speaker: 'B', text: 'Oink, oink! And it is pink.' },
    ],
    answers: ['pig'],
    distractors: ['cow', 'sheep'],
    translation: '这只___怎么叫？哼哼！它是粉色的。',
  },
  {
    id: 'animals-cow',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'What does the ___ give us?' },
      { speaker: 'B', text: 'Milk! We drink it every day.' },
    ],
    answers: ['cow'],
    distractors: ['pig', 'duck'],
    translation: '这只___给我们什么？牛奶！我们每天都喝。',
  },
  {
    id: 'animals-monkey',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'The ___ likes bananas.' },
      { speaker: 'B', text: 'It can climb the tree, too.' },
    ],
    answers: ['monkey'],
    distractors: ['tiger', 'panda'],
    translation: '这只___喜欢香蕉。它还会爬树。',
  },
  {
    id: 'animals-sheep',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'The ___ is white and soft.' },
      { speaker: 'B', text: 'It looks like a cloud!' },
    ],
    answers: ['sheep'],
    distractors: ['pig', 'cow'],
    translation: '这只___又白又软。它看起来像一朵云！',
  },
  {
    id: 'animals-frog',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'The ___ is green and can jump.' },
      { speaker: 'B', text: 'It lives near the water.' },
    ],
    answers: ['frog'],
    distractors: ['fish', 'bird'],
    translation: '这只___是绿色的，还会跳。它住在水边。',
  },
  {
    id: 'animals-bee',
    pack: 'animals',
    lines: [
      { speaker: 'A', text: 'The ___ is small and yellow.' },
      { speaker: 'B', text: 'It makes honey for us.' },
    ],
    answers: ['bee'],
    distractors: ['butterfly', 'bird'],
    translation: '这只___又小又黄。它为我们酿蜂蜜。',
  },
  // Food
  {
    id: 'food-fruit-bag',
    pack: 'food',
    lines: [
      { speaker: 'A', text: "What's in your bag?" },
      { speaker: 'B', text: 'An ___ and a pear.' },
    ],
    answers: ['apple', 'orange'],
    distractors: ['banana', 'grape'],
    translation: '你的包里有什么？一个___，还有一个梨。',
  },
  {
    id: 'food-banana',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is long and yellow.' },
      { speaker: 'B', text: 'A monkey likes it!' },
    ],
    answers: ['banana'],
    distractors: ['apple', 'orange'],
    translation: '这根___又长又黄。猴子喜欢它！',
  },
  {
    id: 'food-grape',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is small and purple.' },
      { speaker: 'B', text: "It's sweet, too." },
    ],
    answers: ['grape'],
    distractors: ['pear', 'strawberry'],
    translation: '这颗___又小又紫。它也很甜。',
  },
  {
    id: 'food-watermelon',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is big and green.' },
      { speaker: 'B', text: "It's red inside!" },
    ],
    answers: ['watermelon'],
    distractors: ['apple', 'pear'],
    translation: '这个___又大又绿。它里面是红色的！',
  },
  {
    id: 'food-strawberry',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is small and red.' },
      { speaker: 'B', text: "It's sweet and juicy." },
    ],
    answers: ['strawberry'],
    distractors: ['potato', 'carrot'],
    translation: '这颗___又小又红。它又甜又多汁。',
  },
  {
    id: 'food-tomato',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is red and round.' },
      { speaker: 'B', text: 'We put it in soup.' },
    ],
    answers: ['tomato'],
    distractors: ['potato', 'carrot'],
    translation: '这个___又红又圆。我们把它放进汤里。',
  },
  {
    id: 'food-potato',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ grows under the ground.' },
      { speaker: 'B', text: 'We can cook it.' },
    ],
    answers: ['potato', 'carrot'],
    distractors: ['tomato', 'apple'],
    translation: '这个___长在地下。我们还可以把它煮着吃。',
  },
  {
    id: 'food-pear',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is green and sweet.' },
      { speaker: 'B', text: 'Can I have one?' },
    ],
    answers: ['pear'],
    distractors: ['grape', 'banana'],
    translation: '这个___又绿又甜。我可以要一个吗？',
  },
  {
    id: 'food-breakfast',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'What is the first meal of the day?' },
      { speaker: 'B', text: 'It is ___! I have bread and milk.' },
    ],
    answers: ['breakfast'],
    distractors: ['cake', 'candy'],
    translation: '一天里的第一顿饭是什么？是___！我吃面包、喝牛奶。',
  },
  {
    id: 'food-milk',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is white.' },
      { speaker: 'B', text: 'We drink it every day.' },
    ],
    answers: ['milk'],
    distractors: ['juice', 'soup'],
    translation: '这个___是白色的。我们每天都喝。',
  },
  {
    id: 'food-juice',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'I drink ___ in the morning.' },
      { speaker: 'B', text: "It's from an orange." },
    ],
    answers: ['juice'],
    distractors: ['milk', 'soup'],
    translation: '我早上喝___。它是橙子做的。',
  },
  {
    id: 'food-rice',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'We eat ___ and some meat.' },
      { speaker: 'B', text: "It's white and soft." },
    ],
    answers: ['rice'],
    distractors: ['milk', 'juice'],
    translation: '我们吃___，还有一些肉。它又白又软。',
  },
  {
    id: 'food-noodles',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ are long and white.' },
      { speaker: 'B', text: 'I can eat a lot!' },
    ],
    answers: ['noodles'],
    distractors: ['rice', 'bread'],
    translation: '这些___又长又白。我能吃很多！',
  },
  {
    id: 'food-soup',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is hot.' },
      { speaker: 'B', text: 'Eat it with a spoon.' },
    ],
    answers: ['soup'],
    distractors: ['juice', 'milk'],
    translation: '这个___很烫。用勺子吃吧。',
  },
  {
    id: 'food-egg',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'I have an ___ for breakfast.' },
      { speaker: 'B', text: "It's white and round." },
    ],
    answers: ['egg'],
    distractors: ['cake', 'bread'],
    translation: '我早餐吃一个___。它又白又圆。',
  },
  {
    id: 'food-cake',
    pack: 'food',
    lines: [
      { speaker: 'A', text: "It's your birthday!" },
      { speaker: 'B', text: "Let's have some ___." },
    ],
    answers: ['cake'],
    distractors: ['bread', 'egg'],
    translation: '今天是你的生日！我们吃点___吧。',
  },
  {
    id: 'food-candy',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'Too much ___ is bad for your teeth.' },
      { speaker: 'B', text: 'Yes, I know.' },
    ],
    answers: ['candy'],
    distractors: ['apple', 'milk'],
    translation: '太多___对牙齿不好。是的，我知道。',
  },
  {
    id: 'food-bread',
    pack: 'food',
    lines: [
      { speaker: 'A', text: 'The ___ is soft.' },
      { speaker: 'B', text: 'We eat it with milk.' },
    ],
    answers: ['bread'],
    distractors: ['egg', 'apple'],
    translation: '这个___很软。我们配牛奶吃。',
  },
  // School
  {
    id: 'school-book',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Open your ___.' },
      { speaker: 'B', text: "Let's read page one." },
    ],
    answers: ['book'],
    distractors: ['pen', 'eraser'],
    translation: '打开你的___。我们读第一页吧。',
  },
  {
    id: 'school-pen',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'I write with a ___.' },
      { speaker: 'B', text: 'My father has one, too.' },
    ],
    answers: ['pencil', 'pen'],
    distractors: ['book', 'eraser'],
    translation: '我用___写字。我爸爸也有一支。',
  },
  {
    id: 'school-schoolbag',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'My ___ is heavy.' },
      { speaker: 'B', text: 'It has books and a pencil box.' },
    ],
    answers: ['schoolbag'],
    distractors: ['desk', 'chair'],
    translation: '我的___很重。里面有书和一个铅笔盒。',
  },
  {
    id: 'school-ruler',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Can I use your ___?' },
      { speaker: 'B', text: "Sure. It's long and straight." },
    ],
    answers: ['ruler'],
    distractors: ['eraser', 'crayon'],
    translation: '我能用一下你的___吗？当然。它又长又直。',
  },
  {
    id: 'school-eraser',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'My ___ is small and pink.' },
      { speaker: 'B', text: 'It can clean the page.' },
    ],
    answers: ['eraser'],
    distractors: ['ruler', 'pencil'],
    translation: '我的___又小又粉。它能把页面擦干净。',
  },
  {
    id: 'school-desk',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Put your book on the ___.' },
      { speaker: 'B', text: 'OK. Then we can start.' },
    ],
    answers: ['desk'],
    distractors: ['chair', 'schoolbag'],
    translation: '把书放在___上。好，那我们就可以开始了。',
  },
  {
    id: 'school-chair',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Please sit on the ___.' },
      { speaker: 'B', text: 'It is small and brown.' },
    ],
    answers: ['chair'],
    distractors: ['desk', 'book'],
    translation: '请坐在___上。它又小又棕。',
  },
  {
    id: 'school-school',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Our ___ has a big playground.' },
      { speaker: 'B', text: 'We play there every day.' },
    ],
    answers: ['school'],
    distractors: ['classroom', 'library'],
    translation: '我们的___有一个大操场。我们每天在那儿玩。',
  },
  {
    id: 'school-classroom',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'There is a desk and a chair in our ___.' },
      { speaker: 'B', text: 'We have lessons here.' },
    ],
    answers: ['classroom'],
    distractors: ['library', 'school'],
    translation: '我们的___里有一张书桌和一把椅子。我们在这里上课。',
  },
  {
    id: 'school-teacher',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Our ___ is kind.' },
      { speaker: 'B', text: 'She helps us learn.' },
    ],
    answers: ['teacher'],
    distractors: ['student', 'friend'],
    translation: '我们的___很和善。她帮助我们学习。',
  },
  {
    id: 'school-friend',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'This is my ___.' },
      { speaker: 'B', text: 'We play together every day.' },
    ],
    answers: ['friend', 'classmate'],
    distractors: ['teacher', 'desk'],
    translation: '这是我的___。我们每天一起玩。',
  },
  {
    id: 'school-student',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Every ___ in my class has a book.' },
      { speaker: 'B', text: 'We read it at home.' },
    ],
    answers: ['student'],
    distractors: ['teacher', 'friend'],
    translation: '我班上的每个___都有一本书。我们在家读它。',
  },
  {
    id: 'school-crayon',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'I draw with a ___.' },
      { speaker: 'B', text: 'It is red and new.' },
    ],
    answers: ['crayon'],
    distractors: ['ruler', 'eraser'],
    translation: '我用___画画。它是红色的，还是新的。',
  },
  {
    id: 'school-library',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'The ___ has many books.' },
      { speaker: 'B', text: 'We borrow books there.' },
    ],
    answers: ['library'],
    distractors: ['classroom', 'desk'],
    translation: '___里有很多书。我们放学后在那里看书。',
  },
  {
    id: 'school-lesson',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'Our first ___ is English.' },
      { speaker: 'B', text: 'I like it very much.' },
    ],
    answers: ['lesson'],
    distractors: ['homework', 'word'],
    translation: '我们的第一节___是英语。我很喜欢。',
  },
  {
    id: 'school-homework',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'I do my ___ after school.' },
      { speaker: 'B', text: 'Then I can play.' },
    ],
    answers: ['homework'],
    distractors: ['lesson', 'book'],
    translation: '我放学后做___。然后我就可以玩了。',
  },
  {
    id: 'school-dictionary',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'I look up a word in my ___.' },
      { speaker: 'B', text: 'It has many words.' },
    ],
    answers: ['dictionary'],
    distractors: ['book', 'word'],
    translation: '我在___里查一个单词。它有很多单词。',
  },
  {
    id: 'school-word',
    pack: 'school',
    lines: [
      { speaker: 'A', text: 'How do you spell this ___?' },
      { speaker: 'B', text: 'I can spell it now.' },
    ],
    answers: ['word'],
    distractors: ['book', 'lesson'],
    translation: '这个___怎么拼？我现在会拼了。',
  },
  // Home
  {
    id: 'home-house',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'Our ___ has a red door.' },
      { speaker: 'B', text: 'It is small but warm.' },
    ],
    answers: ['house', 'home'],
    distractors: ['room', 'bedroom'],
    translation: '我们的___有一扇红色的门。它很小，但很温暖。',
  },
  {
    id: 'home-bed',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'I sleep in my ___.' },
      { speaker: 'B', text: 'It is warm and soft.' },
    ],
    answers: ['bed'],
    distractors: ['sofa', 'table'],
    translation: '我睡在我的___上。它又暖又软。',
  },
  {
    id: 'home-room',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'This is my ___.' },
      { speaker: 'B', text: 'It has a bed and a desk.' },
    ],
    answers: ['room', 'bedroom'],
    distractors: ['kitchen', 'bathroom'],
    translation: '这是我的___。里面有一张床和一张书桌。',
  },
  {
    id: 'home-bathroom',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'I wash my face in the ___.' },
      { speaker: 'B', text: 'The water is warm.' },
    ],
    answers: ['bathroom'],
    distractors: ['kitchen', 'bedroom'],
    translation: '我在___洗脸。水是温的。',
  },
  {
    id: 'home-kitchen',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'My mother cooks in the ___.' },
      { speaker: 'B', text: 'It smells good!' },
    ],
    answers: ['kitchen'],
    distractors: ['bathroom', 'bedroom'],
    translation: '我妈妈在___做饭。闻起来真香！',
  },
  {
    id: 'home-table',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'We eat at the ___.' },
      { speaker: 'B', text: 'It is round and big.' },
    ],
    answers: ['table'],
    distractors: ['bed', 'sofa'],
    translation: '我们在___吃饭。它又圆又大。',
  },
  {
    id: 'home-sofa',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'The ___ is soft.' },
      { speaker: 'B', text: 'We sit on it in the evening.' },
    ],
    answers: ['sofa'],
    distractors: ['table', 'bed'],
    translation: '这个___很软。我们晚上坐在上面。',
  },
  {
    id: 'home-light',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'Turn on the ___.' },
      { speaker: 'B', text: 'It is dark in here.' },
    ],
    answers: ['light'],
    distractors: ['door', 'window'],
    translation: '打开___。这里很黑。',
  },
  {
    id: 'home-door',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'Please open the ___.' },
      { speaker: 'B', text: 'It is hot in here.' },
    ],
    answers: ['door'],
    distractors: ['light', 'table'],
    translation: '请打开___。这里很热。',
  },
  {
    id: 'home-window',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'Look out of the ___.' },
      { speaker: 'B', text: 'The garden is beautiful.' },
    ],
    answers: ['window'],
    distractors: ['door', 'light'],
    translation: '从___往外看。花园很美。',
  },
  {
    id: 'home-family',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'My ___ is big.' },
      { speaker: 'B', text: 'Mother, father and two children.' },
    ],
    answers: ['family'],
    distractors: ['house', 'room'],
    translation: '我的___很大。妈妈、爸爸和两个孩子。',
  },
  {
    id: 'home-mother',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'My ___ makes breakfast for us.' },
      { speaker: 'B', text: 'She is kind.' },
    ],
    answers: ['mother', 'grandma'],
    distractors: ['father', 'brother'],
    translation: '我的___为我们做早餐。她很和善。',
  },
  {
    id: 'home-father',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'My ___ plays football with me.' },
      { speaker: 'B', text: 'He is fast!' },
    ],
    answers: ['father', 'grandpa'],
    distractors: ['mother', 'baby'],
    translation: '我的___和我一起踢足球。他跑得很快！',
  },
  {
    id: 'home-sister',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'My ___ is five years old.' },
      { speaker: 'B', text: 'We play together.' },
    ],
    answers: ['sister', 'brother'],
    distractors: ['baby', 'mother'],
    translation: '我的___五岁了。我们一起玩。',
  },
  {
    id: 'home-baby',
    pack: 'home',
    lines: [
      { speaker: 'A', text: 'The ___ is asleep.' },
      { speaker: 'B', text: 'Please be quiet.' },
    ],
    answers: ['baby'],
    distractors: ['grandma', 'sister'],
    translation: '这个___睡着了。请安静。',
  },
  // Weather
  {
    id: 'weather-sun',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'The ___ is bright today.' },
      { speaker: 'B', text: "Let's go out and play." },
    ],
    answers: ['sun'],
    distractors: ['moon', 'star'],
    translation: '今天___很明亮。我们出去玩吧。',
  },
  {
    id: 'weather-moon',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'The ___ is bright at night.' },
      { speaker: 'B', text: 'It looks like a plate.' },
    ],
    answers: ['moon'],
    distractors: ['sun', 'star'],
    translation: '晚上___很明亮。它看起来像一个盘子。',
  },
  {
    id: 'weather-star',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'The ___ is small and bright.' },
      { speaker: 'B', text: 'It is high in the sky.' },
    ],
    answers: ['star'],
    distractors: ['sun', 'moon'],
    translation: '这颗___又小又亮。它高高挂在天上。',
  },
  {
    id: 'weather-sunny',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ today.' },
      { speaker: 'B', text: 'The sun is bright.' },
    ],
    answers: ['sunny'],
    distractors: ['rainy', 'cloudy'],
    translation: '今天天气___。太阳很明亮。',
  },
  {
    id: 'weather-cloudy',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ today.' },
      { speaker: 'B', text: "I can't see the sun." },
    ],
    answers: ['cloudy'],
    distractors: ['sunny', 'windy'],
    translation: '今天天气___。我看不见太阳。',
  },
  {
    id: 'weather-windy',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ today.' },
      { speaker: 'B', text: 'My hat is flying away!' },
    ],
    answers: ['windy'],
    distractors: ['sunny', 'cloudy'],
    translation: '今天___。我的帽子要飞走了！',
  },
  {
    id: 'weather-rainy',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ today.' },
      { speaker: 'B', text: 'Take your umbrella.' },
    ],
    answers: ['rainy'],
    distractors: ['sunny', 'windy'],
    translation: '今天___。带上你的雨伞。',
  },
  {
    id: 'weather-spring',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'In ___, the tree turns green.' },
      { speaker: 'B', text: 'The flowers open, too.' },
    ],
    answers: ['spring'],
    distractors: ['winter', 'autumn'],
    translation: '在___，树变绿了。花也开了。',
  },
  {
    id: 'weather-summer',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'In ___, we swim in the lake.' },
      { speaker: 'B', text: 'It is hot and fun.' },
    ],
    answers: ['summer'],
    distractors: ['winter', 'autumn'],
    translation: '在___，我们在湖里游泳。又热又好玩。',
  },
  {
    id: 'weather-autumn',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'In ___, we pick apples.' },
      { speaker: 'B', text: 'The leaves turn brown.' },
    ],
    answers: ['autumn'],
    distractors: ['spring', 'summer'],
    translation: '在___，我们摘苹果。叶子变黄了。',
  },
  {
    id: 'weather-winter',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'In ___, it is cold and it snows.' },
      { speaker: 'B', text: 'I like the white snow.' },
    ],
    answers: ['winter'],
    distractors: ['summer', 'spring'],
    translation: '在___，天很冷，还会下雪。我喜欢白雪。',
  },
  {
    id: 'weather-warm',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ in spring.' },
      { speaker: 'B', text: 'The sun feels nice.' },
    ],
    answers: ['warm'],
    distractors: ['cold', 'hot'],
    translation: '春天天气很___。阳光照在身上很舒服。',
  },
  {
    id: 'weather-cool',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ in autumn.' },
      { speaker: 'B', text: 'I need a light coat.' },
    ],
    answers: ['cool'],
    distractors: ['hot', 'warm'],
    translation: '秋天天气很___。我需要一件薄外套。',
  },
  {
    id: 'weather-hot',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ in summer.' },
      { speaker: 'B', text: 'I want cold water.' },
    ],
    answers: ['hot'],
    distractors: ['cold', 'cool'],
    translation: '夏天天气很___。我想喝凉水。',
  },
  {
    id: 'weather-cold',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'It is ___ in winter.' },
      { speaker: 'B', text: 'I need a warm coat.' },
    ],
    answers: ['cold'],
    distractors: ['hot', 'cool'],
    translation: '冬天天气很___。我需要一件暖和的外套。',
  },
  {
    id: 'weather-snow',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'The ___ is white and cold.' },
      { speaker: 'B', text: 'It falls from the sky.' },
    ],
    answers: ['snow'],
    distractors: ['water', 'flower'],
    translation: '___又白又冷。它从天上落下来。',
  },
  {
    id: 'weather-water',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'We drink ___ every day.' },
      { speaker: 'B', text: 'It has no colour.' },
    ],
    answers: ['water'],
    distractors: ['snow', 'tree'],
    translation: '我们每天喝___。它没有颜色。',
  },
  {
    id: 'weather-tree',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'The ___ is tall and green.' },
      { speaker: 'B', text: 'A bird lives in it.' },
    ],
    answers: ['tree'],
    distractors: ['flower', 'star'],
    translation: '这棵___又高又绿。一只鸟住在里面。',
  },
  {
    id: 'weather-flower',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'The ___ is red and small.' },
      { speaker: 'B', text: 'It smells good.' },
    ],
    answers: ['flower'],
    distractors: ['tree', 'star'],
    translation: '这朵___又红又小。它闻起来很香。',
  },
  {
    id: 'weather-earth',
    pack: 'weather',
    lines: [
      { speaker: 'A', text: 'We live on the ___.' },
      { speaker: 'B', text: 'It is our home.' },
    ],
    answers: ['earth'],
    distractors: ['sun', 'moon'],
    translation: '我们住在___上。它是我们的家。',
  },
  // Travel
  {
    id: 'travel-bus',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'I go to school by ___.' },
      { speaker: 'B', text: 'It is big and yellow.' },
    ],
    answers: ['bus'],
    distractors: ['car', 'bike'],
    translation: '我坐___去上学。它又大又黄。',
  },
  {
    id: 'travel-car',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'My father drives a ___.' },
      { speaker: 'B', text: 'It has four wheels.' },
    ],
    answers: ['car'],
    distractors: ['bike', 'boat'],
    translation: '我爸爸开一辆___。它有四个轮子。',
  },
  {
    id: 'travel-bike',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'I ride my ___ to the park.' },
      { speaker: 'B', text: 'It is red and new.' },
    ],
    answers: ['bike'],
    distractors: ['car', 'bus'],
    translation: '我骑我的___去公园。它又红又新。',
  },
  {
    id: 'travel-boat',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'We go on the river by ___.' },
      { speaker: 'B', text: 'It is small and slow.' },
    ],
    answers: ['boat'],
    distractors: ['train', 'plane'],
    translation: '我们坐___在河上走。它又小又慢。',
  },
  {
    id: 'travel-plane',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The ___ flies in the sky.' },
      { speaker: 'B', text: 'It is very fast.' },
    ],
    answers: ['plane'],
    distractors: ['bus', 'boat'],
    translation: '___在天上飞。它非常快。',
  },
  {
    id: 'travel-train',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The ___ goes on the rails.' },
      { speaker: 'B', text: 'It is long and fast.' },
    ],
    answers: ['train'],
    distractors: ['bus', 'car'],
    translation: '___在铁轨上行驶。它又长又快。',
  },
  {
    id: 'travel-ship',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The ___ is big and goes on the sea.' },
      { speaker: 'B', text: 'It has many rooms.' },
    ],
    answers: ['ship'],
    distractors: ['boat', 'bus'],
    translation: '这艘___很大，在海上航行。它有很多房间。',
  },
  {
    id: 'travel-taxi',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'We call a ___ when it rains.' },
      { speaker: 'B', text: 'It takes us home.' },
    ],
    answers: ['taxi'],
    distractors: ['bus', 'bike'],
    translation: '下雨时我们叫一辆___。它送我们回家。',
  },
  {
    id: 'travel-travel',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'We ___ by train.' },
      { speaker: 'B', text: 'I love the window seat.' },
    ],
    answers: ['travel'],
    distractors: ['city', 'station'],
    translation: '我们坐火车___。我喜欢靠窗的座位。',
  },
  {
    id: 'travel-passport',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: "Don't forget your ___ at the airport." },
      { speaker: 'B', text: 'We need it to fly.' },
    ],
    answers: ['passport'],
    distractors: ['station', 'city'],
    translation: '在机场别忘了你的___。我们坐飞机需要它。',
  },
  {
    id: 'travel-station',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'We wait for the train at the ___.' },
      { speaker: 'B', text: 'It is big and busy.' },
    ],
    answers: ['station'],
    distractors: ['airport', 'street'],
    translation: '我们在___等火车。那里又大又热闹。',
  },
  {
    id: 'travel-airport',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The plane is at the ___.' },
      { speaker: 'B', text: "Let's go in." },
    ],
    answers: ['airport'],
    distractors: ['station', 'street'],
    translation: '飞机在___。我们进去吧。',
  },
  {
    id: 'travel-city',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'This ___ is big and busy.' },
      { speaker: 'B', text: 'It has many cars.' },
    ],
    answers: ['city'],
    distractors: ['town', 'country'],
    translation: '这座___又大又热闹。它有很多汽车。',
  },
  {
    id: 'travel-country',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'A ___ has its own flag.' },
      { speaker: 'B', text: 'It has a flag and a song.' },
    ],
    answers: ['country'],
    distractors: ['city', 'town'],
    translation: '一个___有自己的国旗。那里的人说一种语言。',
  },
  {
    id: 'travel-town',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'He lives in a small ___ near the mountain.' },
      { speaker: 'B', text: 'It is quiet there.' },
    ],
    answers: ['town'],
    distractors: ['city', 'country'],
    translation: '他住在山附近的一个小___。那里很安静。',
  },
  {
    id: 'travel-street',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'There is a shop on this ___.' },
      { speaker: 'B', text: "Let's buy some bread." },
    ],
    answers: ['street'],
    distractors: ['river', 'lake'],
    translation: '这条___上有一家商店。我们买点面包吧。',
  },
  {
    id: 'travel-road',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The ___ goes to the city.' },
      { speaker: 'B', text: 'It is long and straight.' },
    ],
    answers: ['road'],
    distractors: ['river', 'lake'],
    translation: '这条___通向城市。它又长又直。',
  },
  {
    id: 'travel-river',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The ___ is long and runs to the sea.' },
      { speaker: 'B', text: 'Fish live in it.' },
    ],
    answers: ['river'],
    distractors: ['lake', 'street'],
    translation: '这条___很长，一直流向大海。鱼住在里面。',
  },
  {
    id: 'travel-lake',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'We swim in the ___.' },
      { speaker: 'B', text: 'The water is cool.' },
    ],
    answers: ['lake'],
    distractors: ['street', 'road'],
    translation: '我们在___里游泳。水很凉爽。',
  },
  {
    id: 'travel-mountain',
    pack: 'travel',
    lines: [
      { speaker: 'A', text: 'The ___ is very high.' },
      { speaker: 'B', text: 'Snow is on the top.' },
    ],
    answers: ['mountain'],
    distractors: ['lake', 'river'],
    translation: '这座___很高。山顶上有雪。',
  },
  // Body
  {
    id: 'body-face',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'Your ___ has two eyes and a mouth.' },
      { speaker: 'B', text: 'Wash it every morning.' },
    ],
    answers: ['face'],
    distractors: ['hand', 'foot'],
    translation: '你的___上有两只眼睛和一张嘴。每天早上洗一洗。',
  },
  {
    id: 'body-hair',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'My ___ is black and short.' },
      { speaker: 'B', text: 'I wash it every week.' },
    ],
    answers: ['hair'],
    distractors: ['eye', 'ear'],
    translation: '我的___又黑又短。我每周洗一次。',
  },
  {
    id: 'body-eye',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I see with my ___.' },
      { speaker: 'B', text: 'It is brown.' },
    ],
    answers: ['eye'],
    distractors: ['ear', 'nose'],
    translation: '我用___看东西。它是棕色的。',
  },
  {
    id: 'body-ear',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I hear with my ___.' },
      { speaker: 'B', text: 'It is small.' },
    ],
    answers: ['ear'],
    distractors: ['eye', 'mouth'],
    translation: '我用___听声音。它很小。',
  },
  {
    id: 'body-nose',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I smell with my ___.' },
      { speaker: 'B', text: 'The flower smells good.' },
    ],
    answers: ['nose'],
    distractors: ['ear', 'hand'],
    translation: '我用___闻气味。这朵花很香。',
  },
  {
    id: 'body-mouth',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I eat with my ___.' },
      { speaker: 'B', text: 'I speak with it, too.' },
    ],
    answers: ['mouth'],
    distractors: ['nose', 'eye'],
    translation: '我用___吃东西。我也用它说话。',
  },
  {
    id: 'body-hand',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I write with my ___.' },
      { speaker: 'B', text: 'It has five fingers.' },
    ],
    answers: ['hand'],
    distractors: ['foot', 'ear'],
    translation: '我用___写字。它有五根手指。',
  },
  {
    id: 'body-foot',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I walk with my ___.' },
      { speaker: 'B', text: 'It is in my shoe.' },
    ],
    answers: ['foot'],
    distractors: ['hand', 'head'],
    translation: '我用___走路。它在我的鞋子里。',
  },
  {
    id: 'body-leg',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'My ___ helps me run.' },
      { speaker: 'B', text: 'It is long and strong.' },
    ],
    answers: ['leg'],
    distractors: ['head', 'ear'],
    translation: '我的___很长。我能跑得很快。',
  },
  {
    id: 'body-head',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I have a hat on my ___.' },
      { speaker: 'B', text: 'It is red.' },
    ],
    answers: ['head'],
    distractors: ['foot', 'hand'],
    translation: '我___上有一顶帽子。它是红色的。',
  },
  {
    id: 'body-arm',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I carry my bag with my ___.' },
      { speaker: 'B', text: 'It is strong.' },
    ],
    answers: ['arm'],
    distractors: ['leg', 'foot'],
    translation: '我用___拎书包。它很有力。',
  },
  {
    id: 'body-body',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'Your ___ has a head, two arms and two legs.' },
      { speaker: 'B', text: 'It is you!' },
    ],
    answers: ['body'],
    distractors: ['face', 'hand'],
    translation: '你的___有一个头、两条胳膊和两条腿。它就是你！',
  },
  {
    id: 'body-doctor',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'You are ill. Go to see the ___.' },
      { speaker: 'B', text: 'He can help you.' },
    ],
    answers: ['doctor'],
    distractors: ['medicine', 'headache'],
    translation: '你生病了。去看___吧。他能帮助你。',
  },
  {
    id: 'body-nurse',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'The ___ works with the doctor.' },
      { speaker: 'B', text: 'She is kind.' },
    ],
    answers: ['nurse'],
    distractors: ['doctor', 'fever'],
    translation: '___和医生一起工作。她很和善。',
  },
  {
    id: 'body-headache',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'My head hurts. I have a ___.' },
      { speaker: 'B', text: 'You need a rest.' },
    ],
    answers: ['headache'],
    distractors: ['fever', 'cough'],
    translation: '我头疼。我___了。你需要休息。',
  },
  {
    id: 'body-fever',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'My body is very hot. I have a ___.' },
      { speaker: 'B', text: 'Take some medicine.' },
    ],
    answers: ['fever'],
    distractors: ['cough', 'headache'],
    translation: '我全身很烫。我___了。吃点药吧。',
  },
  {
    id: 'body-cough',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'I have a bad ___.' },
      { speaker: 'B', text: "I can't stop." },
    ],
    answers: ['cough'],
    distractors: ['fever', 'medicine'],
    translation: '我___得很厉害。我停不下来。',
  },
  {
    id: 'body-medicine',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'Take this ___ after dinner.' },
      { speaker: 'B', text: 'It will help you.' },
    ],
    answers: ['medicine'],
    distractors: ['cough', 'fever'],
    translation: '晚饭后吃这个___。它会帮到你。',
  },
  {
    id: 'body-healthy',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'Eat good food and be ___.' },
      { speaker: 'B', text: 'Then you can run fast.' },
    ],
    answers: ['healthy'],
    distractors: ['ill', 'cough'],
    translation: '吃好东西，保持___。这样你就能跑得快。',
  },
  {
    id: 'body-ill',
    pack: 'body',
    lines: [
      { speaker: 'A', text: 'He is ___, so he stays at home.' },
      { speaker: 'B', text: "Let's visit him." },
    ],
    answers: ['ill'],
    distractors: ['healthy', 'doctor'],
    translation: '他___了，所以待在家里。我们去看看他吧。',
  },
  // Actions
  {
    id: 'actions-run',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ every morning.' },
      { speaker: 'B', text: 'It is good for my body.' },
    ],
    answers: ['run'],
    distractors: ['sleep', 'sit'],
    translation: '我每天早上___。这对身体很好。',
  },
  {
    id: 'actions-jump',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'The rabbit can ___ very high.' },
      { speaker: 'B', text: 'It has long legs.' },
    ],
    answers: ['jump'],
    distractors: ['walk', 'sleep'],
    translation: '兔子能___得很高。它有长长的腿。',
  },
  {
    id: 'actions-sing',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'She can ___ a song.' },
      { speaker: 'B', text: 'Her voice is beautiful.' },
    ],
    answers: ['sing'],
    distractors: ['draw', 'read'],
    translation: '她会___一首歌。她的声音很美。',
  },
  {
    id: 'actions-dance',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'We ___ to the music.' },
      { speaker: 'B', text: 'It is fun.' },
    ],
    answers: ['dance'],
    distractors: ['read', 'write'],
    translation: '我们随着音乐___。真有趣。',
  },
  {
    id: 'actions-draw',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ a picture with my crayon.' },
      { speaker: 'B', text: 'It is a cat.' },
    ],
    answers: ['draw'],
    distractors: ['sing', 'drink'],
    translation: '我用蜡笔___一幅画。它是一只猫。',
  },
  {
    id: 'actions-read',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ a book every night.' },
      { speaker: 'B', text: 'It is my favourite time.' },
    ],
    answers: ['read'],
    distractors: ['write', 'listen'],
    translation: '我每天晚上___一本书。这是我最喜欢的时间。',
  },
  {
    id: 'actions-write',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ my name on the book.' },
      { speaker: 'B', text: 'I can do it now.' },
    ],
    answers: ['write'],
    distractors: ['draw', 'read'],
    translation: '我在书上___我的名字。我现在会写了。',
  },
  {
    id: 'actions-walk',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ to school.' },
      { speaker: 'B', text: 'It takes ten minutes.' },
    ],
    answers: ['walk'],
    distractors: ['fly', 'swim'],
    translation: '我___去学校。要走十分钟。',
  },
  {
    id: 'actions-ride',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ my bike to the park.' },
      { speaker: 'B', text: 'It is fast.' },
    ],
    answers: ['ride'],
    distractors: ['sleep', 'swim'],
    translation: '我___自行车去公园。它很快。',
  },
  {
    id: 'actions-swim',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'Fish can ___ in the water.' },
      { speaker: 'B', text: 'They are fast.' },
    ],
    answers: ['swim'],
    distractors: ['run', 'jump'],
    translation: '鱼能在水里___。它们很快。',
  },
  {
    id: 'actions-fly',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'A bird can ___ in the sky.' },
      { speaker: 'B', text: 'It has two wings.' },
    ],
    answers: ['fly'],
    distractors: ['swim', 'walk'],
    translation: '鸟能在天上___。它有一对翅膀。',
  },
  {
    id: 'actions-sleep',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ at nine at night.' },
      { speaker: 'B', text: 'My room is quiet.' },
    ],
    answers: ['sleep'],
    distractors: ['eat', 'read'],
    translation: '我晚上九点___。我的房间很安静。',
  },
  {
    id: 'actions-listen',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ to the teacher.' },
      { speaker: 'B', text: 'Then I can answer.' },
    ],
    answers: ['listen'],
    distractors: ['speak', 'sing'],
    translation: '我___老师讲课。这样我就能回答。',
  },
  {
    id: 'actions-speak',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'Can you ___ English?' },
      { speaker: 'B', text: 'Yes, a little.' },
    ],
    answers: ['speak'],
    distractors: ['listen', 'read'],
    translation: '你会___英语吗？会一点。',
  },
  {
    id: 'actions-sit',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'Please ___ down.' },
      { speaker: 'B', text: 'The chair is here.' },
    ],
    answers: ['sit'],
    distractors: ['stand', 'sleep'],
    translation: '请___下。椅子在这里。',
  },
  {
    id: 'actions-stand',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'Please ___ up.' },
      { speaker: 'B', text: "Let's say hello." },
    ],
    answers: ['stand'],
    distractors: ['sit', 'sleep'],
    translation: '请___起来。我们问好吧。',
  },
  {
    id: 'actions-open',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'It is hot. Please ___ the window.' },
      { speaker: 'B', text: 'Thank you.' },
    ],
    answers: ['open'],
    distractors: ['close', 'eat'],
    translation: '天很热。请___窗户。谢谢。',
  },
  {
    id: 'actions-close',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'It is cold. Please ___ the door.' },
      { speaker: 'B', text: 'OK.' },
    ],
    answers: ['close'],
    distractors: ['open', 'draw'],
    translation: '天很冷。请___门。好的。',
  },
  {
    id: 'actions-eat',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ an apple every day.' },
      { speaker: 'B', text: 'It is sweet.' },
    ],
    answers: ['eat'],
    distractors: ['drink', 'read'],
    translation: '我每天___一个苹果。它很甜。',
  },
  {
    id: 'actions-drink',
    pack: 'actions',
    lines: [
      { speaker: 'A', text: 'I ___ water every day.' },
      { speaker: 'B', text: 'It is good for me.' },
    ],
    answers: ['drink'],
    distractors: ['eat', 'open'],
    translation: '我每天___水。这对我很好。',
  },
];

const WORD_BY_ID = new Map<string, Word>(GENERAL_WORDS.map((word) => [word.id, word]));
const BY_PACK_WORD = new Map<string, DialogueEntry>();
for (const entry of DIALOGUES) {
  for (const wordId of entry.answers) BY_PACK_WORD.set(`${entry.pack}:${wordId}`, entry);
}

export function packOfScope(scope: string): string {
  return scope.startsWith('topic-') ? scope.slice('topic-'.length) : '';
}

export function dialogueFor(scope: string, wordId: string): DialogueEntry | undefined {
  const pack = packOfScope(scope);
  return pack ? BY_PACK_WORD.get(`${pack}:${wordId}`) : undefined;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Answer plus two curated distractors, shuffled. Throws on a broken entry. */
export function dialogueOptions(
  entry: DialogueEntry,
  word: Word,
  random: () => number = Math.random,
): Word[] {
  const decoys = shuffle([...entry.distractors], random)
    .slice(0, 2)
    .map((id) => WORD_BY_ID.get(id));
  if (decoys.some((item) => !item)) throw new Error(`Unknown dialogue distractor in ${entry.id}`);
  return shuffle([word, ...(decoys as Word[])], random);
}
