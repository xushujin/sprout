import { shuffle, type Grade, type SubjectQuestion } from '../data/question.ts';

// Maths is generated rather than authored: the number ranges below are the
// curriculum, and every round draws fresh values, so practice never runs out.
// Each topic keeps a stable key so a missed skill returns to the review pool.

export interface MathDraft {
  prompt: string;
  note?: string;
  choices: string[];
  answer: string;
  explain: string;
  display?: 'text' | 'char' | 'pinyin' | 'formula';
}

export interface MathTopic {
  id: string;
  grade: Grade;
  name: string;
  make: (random: () => number) => MathDraft;
}

const int = (random: () => number, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

const pick = <T>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)];

function numeric(answer: number, candidates: number[], random: () => number, min = 0): string[] {
  const values = new Set<number>([answer]);
  for (const candidate of candidates) {
    if (values.size >= 3) break;
    if (Number.isInteger(candidate) && candidate !== answer && candidate >= min)
      values.add(candidate);
  }
  let step = 1;
  while (values.size < 3) {
    if (answer + step >= min) values.add(answer + step);
    step += 1;
  }
  return shuffle([...values].map(String), random);
}

function formula(prompt: string, answer: number, candidates: number[], random: () => number) {
  return {
    prompt,
    note: '算一算，选出正确答案',
    choices: numeric(answer, candidates, random),
    answer: String(answer),
    explain: prompt.replace('= ?', `= ${answer}`),
  };
}

function symbolQuestion(
  a: number,
  b: number,
  random: () => number,
  note = '在（ ）里填上合适的符号',
): MathDraft {
  const answer = a > b ? '>' : a < b ? '<' : '=';
  return {
    prompt: `${a} （ ） ${b}`,
    note,
    choices: shuffle(['>', '<', '='], random),
    answer,
    explain: `${a} ${answer} ${b}`,
  };
}

function staticQuestion(
  random: () => number,
  row: { prompt: string; answer: string; wrong: [string, string]; explain?: string },
  note = '想一想，选出正确答案',
): MathDraft {
  return {
    prompt: row.prompt,
    note,
    choices: shuffle([row.answer, ...row.wrong], random),
    answer: row.answer,
    explain: row.explain ?? row.prompt.replace('（ ）', row.answer),
  };
}

const round = (value: number, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;

/** Trims trailing zeros so 3.30 prints as 3.3 and 4.00 as 4. */
function trim(value: number, digits = 2): string {
  const text = value.toFixed(digits);
  return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function fraction(numerator: number, denominator: number): string {
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

/** Fraction options need string-level dedupe: 1/4 and 2/8 are different strings. */
function fractionChoices(answer: string, decoys: string[], random: () => number): string[] {
  const unique = new Set<string>([answer]);
  for (const decoy of decoys) {
    if (unique.size >= 3) break;
    if (!unique.has(decoy)) unique.add(decoy);
  }
  let step = 1;
  while (unique.size < 3) {
    const candidate = `${step}/${step + 1}`;
    if (!unique.has(candidate)) unique.add(candidate);
    step += 1;
  }
  return shuffle([...unique], random);
}

function decimalChoices(
  answer: number,
  wrongs: number[],
  random: () => number,
  digits = 2,
): string[] {
  const values = new Set<string>([trim(answer, digits)]);
  for (const wrong of wrongs) {
    if (values.size >= 3) break;
    if (Math.abs(wrong - answer) > 1e-9) values.add(trim(wrong, digits));
  }
  let step = 1;
  while (values.size < 3) {
    values.add(trim(answer + step, digits));
    step += 1;
  }
  return shuffle([...values], random);
}

function decimalQuestion(
  prompt: string,
  answer: number,
  wrongs: number[],
  random: () => number,
  explain: string,
  digits = 2,
): MathDraft {
  return {
    prompt,
    note: '算一算，选出正确答案',
    choices: decimalChoices(answer, wrongs, random, digits),
    answer: trim(answer, digits),
    explain,
  };
}

const G1_TOPICS: MathTopic[] = [
  {
    id: 'add10',
    grade: 1,
    name: '10 以内加法',
    make(random) {
      const a = int(random, 1, 8);
      const b = int(random, 1, 10 - a);
      return formula(`${a} + ${b} = ?`, a + b, [a + b - 1, a + b + 1, a + b + 2], random);
    },
  },
  {
    id: 'sub10',
    grade: 1,
    name: '10 以内减法',
    make(random) {
      const a = int(random, 3, 10);
      const b = int(random, 1, a - 1);
      return formula(`${a} - ${b} = ?`, a - b, [a - b + 1, a - b - 1, a + b], random);
    },
  },
  {
    id: 'add20carry',
    grade: 1,
    name: '20 以内进位加法',
    make(random) {
      const a = int(random, 6, 9);
      const b = int(random, 11 - a, 9);
      return formula(`${a} + ${b} = ?`, a + b, [a + b - 1, a + b + 1, a + b - 10], random);
    },
  },
  {
    id: 'sub20borrow',
    grade: 1,
    name: '20 以内退位减法',
    make(random) {
      const a = int(random, 11, 18);
      const b = int(random, a - 9, 9);
      return formula(`${a} - ${b} = ?`, a - b, [a - b - 1, a - b + 1, a - b + 10], random);
    },
  },
  {
    id: 'tens',
    grade: 1,
    name: '整十数加减',
    make(random) {
      if (random() < 0.5) {
        const a = int(random, 1, 7) * 10;
        const b = int(random, 1, 9 - a / 10) * 10;
        return formula(`${a} + ${b} = ?`, a + b, [a + b + 10, a + b - 10, a + b + 1], random);
      }
      const a = int(random, 3, 9) * 10;
      const b = int(random, 1, a / 10 - 1) * 10;
      return formula(`${a} - ${b} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 1], random);
    },
  },
  {
    id: 'compare20',
    grade: 1,
    name: '比大小',
    make(random) {
      const roll = random();
      let a = int(random, 1, 20);
      let b = int(random, 1, 20);
      if (roll < 0.15) b = a;
      return symbolQuestion(a, b, random);
    },
  },
  {
    id: 'pattern',
    grade: 1,
    name: '找规律',
    make(random) {
      const start = int(random, 1, 9);
      const step = pick(random, [1, 2, 5, 10]);
      const terms = [start, start + step, start + 2 * step, start + 3 * step];
      const answer = start + 4 * step;
      return {
        prompt: `${terms.join('，')}，（ ）`,
        note: '找规律，填出下一个数',
        choices: numeric(answer, [answer - step, answer + step, answer + 1], random),
        answer: String(answer),
        explain: `每次加 ${step}，所以下一个数是 ${answer}。`,
      };
    },
  },
  {
    id: 'compose',
    grade: 1,
    name: '数的组成',
    make(random) {
      const total = int(random, 11, 19);
      const tens = 10;
      const ones = total - tens;
      return {
        prompt: `${total} = ${tens} + （ ）`,
        note: '想一想，括号里填几',
        choices: numeric(ones, [ones - 1, ones + 1, total], random),
        answer: String(ones),
        explain: `${total} 里面有 1 个十和 ${ones} 个一。`,
      };
    },
  },
  {
    id: 'evenodd',
    grade: 1,
    name: '单数与双数',
    make(random) {
      const answer = int(random, 1, 9) * 2;
      const wrong = shuffle([1, 3, 5, 7, 9, 11, 13], random).slice(0, 2);
      return {
        prompt: '下面哪个数是双数？',
        note: '双数就是 2、4、6、8……这样的数',
        choices: shuffle([String(answer), ...wrong.map(String)], random),
        answer: String(answer),
        explain: `${answer} 能被 2 整除，是双数。`,
      };
    },
  },
  {
    id: 'more',
    grade: 1,
    name: '多几少几',
    make(random) {
      const a = int(random, 5, 15);
      const b = int(random, 1, a - 1);
      return {
        prompt: `${a} 比 ${b} 多几？`,
        note: '用大数减小数',
        choices: numeric(a - b, [a - b + 1, a + b, b], random),
        answer: String(a - b),
        explain: `${a} - ${b} = ${a - b}，所以多 ${a - b}。`,
      };
    },
  },
  {
    id: 'wordadd',
    grade: 1,
    name: '加法应用题',
    make(random) {
      const a = int(random, 2, 8);
      const b = int(random, 1, 8);
      return {
        prompt: `树上原来有 ${a} 只小鸟，又飞来 ${b} 只。现在一共有几只？`,
        note: '把两部分合起来',
        choices: numeric(a + b, [a + b - 1, a + b + 1, a - b], random),
        answer: String(a + b),
        explain: `${a} + ${b} = ${a + b}（只）。`,
      };
    },
  },
  {
    id: 'wordsub',
    grade: 1,
    name: '减法应用题',
    make(random) {
      const a = int(random, 5, 12);
      const b = int(random, 1, a - 1);
      return {
        prompt: `盘子里有 ${a} 个苹果，吃掉 ${b} 个，还剩几个？`,
        note: '从总数里去掉一部分',
        choices: numeric(a - b, [a - b + 1, a - b - 1, a + b], random),
        answer: String(a - b),
        explain: `${a} - ${b} = ${a - b}（个）。`,
      };
    },
  },
  {
    id: 'shape',
    grade: 1,
    name: '认识图形',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          {
            prompt: '三角形有几条边？',
            answer: '3 条',
            wrong: ['4 条', '5 条'] as [string, string],
          },
          {
            prompt: '正方形有几个角？',
            answer: '4 个',
            wrong: ['3 个', '5 个'] as [string, string],
          },
          {
            prompt: '下面哪个图形没有角？',
            answer: '圆',
            wrong: ['三角形', '正方形'] as [string, string],
          },
          {
            prompt: '长方形有几条边？',
            answer: '4 条',
            wrong: ['3 条', '6 条'] as [string, string],
          },
          {
            prompt: '下面哪个图形有 3 条边？',
            answer: '三角形',
            wrong: ['正方形', '圆'] as [string, string],
          },
        ]),
      );
    },
  },
  {
    id: 'clock',
    grade: 1,
    name: '认识整时',
    make(random) {
      const hour = int(random, 1, 12);
      const next = (hour % 12) + 1;
      const prev = ((hour + 10) % 12) + 1;
      return {
        prompt: `钟面上时针指向 ${hour}，分针指向 12。现在是几时？`,
        note: '分针指向 12 就是整时',
        choices: shuffle([`${hour} 时`, `${next} 时`, `${prev} 时`], random),
        answer: `${hour} 时`,
        explain: `时针指向 ${hour}，分针指向 12，就是 ${hour} 时。`,
      };
    },
  },
  {
    id: 'ordinal',
    grade: 1,
    name: '排队问题',
    make(random) {
      const before = int(random, 1, 7);
      return {
        prompt: `排队时，小明前面有 ${before} 人，他排第几？`,
        note: '别忘了把小明自己数进去',
        choices: numeric(before + 1, [before, before + 2, before + 3], random),
        answer: String(before + 1),
        explain: `前面 ${before} 人，再加上小明自己，他排第 ${before + 1}。`,
      };
    },
  },
  {
    id: 'add3',
    grade: 1,
    name: '连加计算',
    make(random) {
      const a = int(random, 1, 4);
      const b = int(random, 1, 4);
      const c = int(random, 1, 10 - a - b);
      return formula(
        `${a} + ${b} + ${c} = ?`,
        a + b + c,
        [a + b + c - 1, a + b + c + 1, a + b],
        random,
      );
    },
  },
  {
    id: 'lineup',
    grade: 1,
    name: '左右排队',
    make(random) {
      const left = int(random, 1, 5);
      const right = int(random, 1, 5);
      return {
        prompt: `小明左边有 ${left} 人，右边有 ${right} 人。这一排一共有几人？`,
        note: '别忘记把小明自己数进去',
        choices: numeric(
          left + right + 1,
          [left + right, left + right + 2, left + right - 1],
          random,
        ),
        answer: String(left + right + 1),
        explain: `${left} + ${right} + 1 = ${left + right + 1}（人）。`,
      };
    },
  },
];

const G2_TOPICS: MathTopic[] = [
  {
    id: 'add2carry',
    grade: 2,
    name: '两位数加两位数（进位）',
    make(random) {
      const aUnit = int(random, 2, 9);
      const bUnit = int(random, 10 - aUnit, 9);
      const aTens = int(random, 1, 7);
      const bTens = int(random, 1, 8);
      const a = aTens * 10 + aUnit;
      const b = bTens * 10 + bUnit;
      return formula(`${a} + ${b} = ?`, a + b, [a + b - 10, a + b + 10, a + b - 1], random);
    },
  },
  {
    id: 'sub2borrow',
    grade: 2,
    name: '两位数减两位数（退位）',
    make(random) {
      const bUnit = int(random, 2, 9);
      const aUnit = int(random, 0, bUnit - 1);
      const aTens = int(random, 4, 9);
      const bTens = int(random, 1, aTens - 1);
      const a = aTens * 10 + aUnit;
      const b = bTens * 10 + bUnit;
      return formula(`${a} - ${b} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 1], random);
    },
  },
  {
    id: 'add2',
    grade: 2,
    name: '两位数加两位数',
    make(random) {
      const a = int(random, 12, 58);
      const b = int(random, 12, 99 - a);
      return formula(`${a} + ${b} = ?`, a + b, [a + b - 10, a + b + 10, a + b + 1], random);
    },
  },
  {
    id: 'sub2',
    grade: 2,
    name: '两位数减两位数',
    make(random) {
      const a = int(random, 42, 99);
      const b = int(random, 12, a - 11);
      return formula(`${a} - ${b} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 1], random);
    },
  },
  {
    id: 'mult',
    grade: 2,
    name: '表内乘法',
    make(random) {
      const a = int(random, 2, 9);
      const b = int(random, 2, 9);
      return formula(`${a} × ${b} = ?`, a * b, [a * b - a, a * b + b, a * b + 1], random);
    },
  },
  {
    id: 'div',
    grade: 2,
    name: '表内除法',
    make(random) {
      const a = int(random, 2, 9);
      const b = int(random, 2, 9);
      return formula(`${a * b} ÷ ${a} = ?`, b, [b + 1, b - 1, b + a], random);
    },
  },
  {
    id: 'multadd',
    grade: 2,
    name: '乘加混合',
    make(random) {
      const a = int(random, 2, 8);
      const b = int(random, 2, 8);
      const c = int(random, 1, 15);
      return formula(
        `${a} × ${b} + ${c} = ?`,
        a * b + c,
        [a * b + c - a, a * b, a * b + c + 1],
        random,
      );
    },
  },
  {
    id: 'compare100',
    grade: 2,
    name: '比大小',
    make(random) {
      let a = int(random, 10, 99);
      let b = int(random, 10, 99);
      if (random() < 0.15) b = a;
      return symbolQuestion(a, b, random);
    },
  },
  {
    id: 'pattern',
    grade: 2,
    name: '找规律',
    make(random) {
      const start = int(random, 1, 9);
      const step = pick(random, [3, 4, 5, 6, 10]);
      const terms = [start, start + step, start + 2 * step, start + 3 * step];
      const answer = start + 4 * step;
      return {
        prompt: `${terms.join('，')}，（ ）`,
        note: '找规律，填出下一个数',
        choices: numeric(answer, [answer - step, answer + step, answer + 1], random),
        answer: String(answer),
        explain: `每次加 ${step}，所以下一个数是 ${answer}。`,
      };
    },
  },
  {
    id: 'length',
    grade: 2,
    name: '长度单位',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          { prompt: '1 米 = （ ）厘米', answer: '100', wrong: ['10', '1000'] as [string, string] },
          { prompt: '2 米 = （ ）厘米', answer: '200', wrong: ['20', '2000'] as [string, string] },
          {
            prompt: '50 厘米 + 50 厘米 = （ ）米',
            answer: '1',
            wrong: ['2', '10'] as [string, string],
          },
          {
            prompt: '1 米 - 30 厘米 = （ ）厘米',
            answer: '70',
            wrong: ['30', '97'] as [string, string],
          },
        ]),
      );
    },
  },
  {
    id: 'money',
    grade: 2,
    name: '元角分',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          { prompt: '1 元 = （ ）角', answer: '10', wrong: ['100', '5'] as [string, string] },
          { prompt: '3 元 = （ ）角', answer: '30', wrong: ['13', '300'] as [string, string] },
          { prompt: '40 角 = （ ）元', answer: '4', wrong: ['40', '14'] as [string, string] },
          {
            prompt: '1 元 5 角 = （ ）角',
            answer: '15',
            wrong: ['6', '105'] as [string, string],
          },
        ]),
      );
    },
  },
  {
    id: 'time',
    grade: 2,
    name: '时间单位',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          { prompt: '1 小时 = （ ）分钟', answer: '60', wrong: ['30', '100'] as [string, string] },
          { prompt: '半小时 = （ ）分钟', answer: '30', wrong: ['60', '15'] as [string, string] },
          { prompt: '2 小时 = （ ）分钟', answer: '120', wrong: ['20', '60'] as [string, string] },
          { prompt: '60 分钟 = （ ）小时', answer: '1', wrong: ['6', '2'] as [string, string] },
        ]),
      );
    },
  },
  {
    id: 'wordmult',
    grade: 2,
    name: '乘法应用题',
    make(random) {
      const per = int(random, 3, 8);
      const boxes = int(random, 2, 6);
      return {
        prompt: `每盒有 ${per} 支铅笔，${boxes} 盒一共有多少支？`,
        note: '求几个几相加',
        choices: numeric(per * boxes, [per + boxes, per * boxes - per, per * boxes + per], random),
        answer: String(per * boxes),
        explain: `${per} × ${boxes} = ${per * boxes}（支）。`,
      };
    },
  },
  {
    id: 'worddiv',
    grade: 2,
    name: '除法应用题',
    make(random) {
      const per = int(random, 2, 6);
      const people = int(random, 2, 6);
      return {
        prompt: `有 ${per * people} 个苹果，平均分给 ${people} 个小朋友，每人分几个？`,
        note: '把总数平均分',
        choices: numeric(per, [per + 1, per - 1, people], random),
        answer: String(per),
        explain: `${per * people} ÷ ${people} = ${per}（个）。`,
      };
    },
  },
  {
    id: 'mixed10',
    grade: 2,
    name: '整十数连加连减',
    make(random) {
      const a = int(random, 2, 6) * 10;
      const b = int(random, 1, 3) * 10;
      const c = int(random, 1, (a + b) / 10 - 1) * 10;
      return formula(
        `${a} + ${b} - ${c} = ?`,
        a + b - c,
        [a + b - c + 10, a + b - c - 10, a + b + c],
        random,
      );
    },
  },
  {
    id: 'clockread',
    grade: 2,
    name: '认识几时几分',
    make(random) {
      const hour = int(random, 1, 11);
      const minutes = pick(random, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
      const pointer = minutes / 5;
      return {
        prompt: `${hour} 时 ${minutes} 分，分针指向数字（ ）。`,
        note: '分针走 1 大格是 5 分钟',
        choices: shuffle([String(pointer), String(pointer + 1), String(pointer - 1)], random),
        answer: String(pointer),
        explain: `${minutes} 分里有 ${pointer} 个 5 分，所以分针指向 ${pointer}。`,
      };
    },
  },
  {
    id: 'clockhalf',
    grade: 2,
    name: '认识几时半',
    make(random) {
      const hour = int(random, 1, 12);
      const next = (hour % 12) + 1;
      const prev = ((hour + 10) % 12) + 1;
      return {
        prompt: `钟面上时针在 ${hour} 和 ${next} 之间，分针指向 6。现在是几时几分？`,
        note: '分针指向 6 就是 30 分',
        choices: shuffle([`${hour} 时 30 分`, `${next} 时 30 分`, `${hour} 时 6 分`], random),
        answer: `${hour} 时 30 分`,
        explain: `时针刚过 ${hour}，分针指向 6，所以是 ${hour} 时 30 分（${prev} 时半已经过去）。`,
      };
    },
  },
  {
    id: 'divrem',
    grade: 2,
    name: '有余数的除法',
    make(random) {
      const divisor = int(random, 3, 9);
      const quotient = int(random, 2, 9);
      const rest = int(random, 1, divisor - 1);
      return {
        prompt: `${divisor * quotient + rest} ÷ ${divisor} 的余数是几？`,
        note: '先想几乘除数最接近被除数',
        choices: numeric(rest, [rest + 1, divisor - rest, quotient], random),
        answer: String(rest),
        explain: `${divisor * quotient + rest} = ${divisor} × ${quotient} + ${rest}，余数是 ${rest}。`,
      };
    },
  },
];

const G3_TOPICS: MathTopic[] = [
  {
    id: 'add3',
    grade: 3,
    name: '三位数加法',
    make(random) {
      const a = int(random, 120, 680);
      const b = int(random, 100, 999 - a);
      return formula(`${a} + ${b} = ?`, a + b, [a + b - 100, a + b + 100, a + b + 1], random);
    },
  },
  {
    id: 'sub3',
    grade: 3,
    name: '三位数减法',
    make(random) {
      const a = int(random, 320, 999);
      const b = int(random, 100, a - 100);
      return formula(`${a} - ${b} = ?`, a - b, [a - b + 100, a - b - 100, a - b + 1], random);
    },
  },
  {
    id: 'mult2x1',
    grade: 3,
    name: '两位数乘一位数',
    make(random) {
      const a = int(random, 12, 49);
      const b = int(random, 2, 9);
      return formula(`${a} × ${b} = ?`, a * b, [a * b - 10, a * b + 10, a * (b + 1)], random);
    },
  },
  {
    id: 'divexact',
    grade: 3,
    name: '除法计算',
    make(random) {
      const divisor = int(random, 3, 9);
      const quotient = int(random, 11, 29);
      return formula(
        `${divisor * quotient} ÷ ${divisor} = ?`,
        quotient,
        [quotient + 1, quotient - 10, quotient + 10],
        random,
      );
    },
  },
  {
    id: 'fractioncompare',
    grade: 3,
    name: '分数比大小',
    make(random) {
      const denominator = int(random, 5, 9);
      let left = int(random, 1, denominator - 1);
      let right = int(random, 1, denominator - 1);
      while (left === right) right = int(random, 1, denominator - 1);
      const answer = left > right ? `${left}/${denominator}` : `${right}/${denominator}`;
      return {
        prompt: `${left}/${denominator} 和 ${right}/${denominator}，哪个大？`,
        note: '分母相同，看分子',
        choices: shuffle([`${left}/${denominator}`, `${right}/${denominator}`, '一样大'], random),
        answer,
        explain: `分母相同，分子大的分数大，所以 ${answer} 更大。`,
      };
    },
  },
  {
    id: 'fractionadd',
    grade: 3,
    name: '同分母分数加法',
    make(random) {
      const denominator = int(random, 5, 9);
      const left = int(random, 1, denominator - 2);
      const right = int(random, 1, denominator - left - 1);
      const sum = left + right;
      return {
        prompt: `${left}/${denominator} + ${right}/${denominator} = （ ）`,
        note: '分母不变，分子相加',
        choices: shuffle(
          [`${sum}/${denominator}`, `${sum}/${denominator * 2}`, `${sum + 1}/${denominator}`],
          random,
        ),
        answer: `${sum}/${denominator}`,
        explain: `分母不变，${left} + ${right} = ${sum}，所以是 ${sum}/${denominator}。`,
      };
    },
  },
  {
    id: 'perimeter',
    grade: 3,
    name: '长方形周长',
    make(random) {
      const length = int(random, 5, 12);
      const width = int(random, 3, 9);
      return {
        prompt: `一个长方形长 ${length} 厘米，宽 ${width} 厘米，周长是多少厘米？`,
        note: '周长 =（长 + 宽）× 2',
        choices: numeric(
          2 * (length + width),
          [length + width, length * width, 2 * length + width],
          random,
        ),
        answer: String(2 * (length + width)),
        explain: `（${length} + ${width}）× 2 = ${2 * (length + width)}（厘米）。`,
      };
    },
  },
  {
    id: 'area',
    grade: 3,
    name: '长方形面积',
    make(random) {
      const length = int(random, 5, 12);
      const width = int(random, 3, 9);
      return {
        prompt: `一个长方形长 ${length} 厘米，宽 ${width} 厘米，面积是多少平方厘米？`,
        note: '面积 = 长 × 宽',
        choices: numeric(
          length * width,
          [2 * (length + width), length + width, length * width + 1],
          random,
        ),
        answer: String(length * width),
        explain: `${length} × ${width} = ${length * width}（平方厘米）。`,
      };
    },
  },
  {
    id: 'time',
    grade: 3,
    name: '经过的时间',
    make(random) {
      const hour = int(random, 7, 11);
      const minute = pick(random, [0, 10, 20, 30, 40]);
      const minutes = pick(random, [20, 25, 35, 45, 50]);
      const total = hour * 60 + minute + minutes;
      const endHour = Math.floor(total / 60);
      const endMinute = total % 60;
      return {
        prompt: `从 ${hour}:${String(minute).padStart(2, '0')} 到 ${endHour}:${String(endMinute).padStart(2, '0')}，经过了（ ）分钟。`,
        note: '结束时刻减去开始时刻',
        choices: numeric(minutes, [minutes + 5, minutes - 5, minutes + 10], random),
        answer: String(minutes),
        explain: `经过的时间是 ${minutes} 分钟。`,
      };
    },
  },
  {
    id: 'mass',
    grade: 3,
    name: '质量单位',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          { prompt: '1 千克 = （ ）克', answer: '1000', wrong: ['100', '10'] as [string, string] },
          { prompt: '3 千克 = （ ）克', answer: '3000', wrong: ['300', '30'] as [string, string] },
          { prompt: '2000 克 = （ ）千克', answer: '2', wrong: ['20', '200'] as [string, string] },
          { prompt: '5000 克 = （ ）千克', answer: '5', wrong: ['50', '500'] as [string, string] },
        ]),
      );
    },
  },
  {
    id: 'lengthmm',
    grade: 3,
    name: '毫米与厘米',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          { prompt: '1 厘米 = （ ）毫米', answer: '10', wrong: ['100', '5'] as [string, string] },
          { prompt: '3 厘米 = （ ）毫米', answer: '30', wrong: ['3', '300'] as [string, string] },
          { prompt: '20 毫米 = （ ）厘米', answer: '2', wrong: ['20', '200'] as [string, string] },
          {
            prompt: '4 厘米 5 毫米 = （ ）毫米',
            answer: '45',
            wrong: ['9', '405'] as [string, string],
          },
        ]),
      );
    },
  },
  {
    id: 'wordprice',
    grade: 3,
    name: '单价与总价',
    make(random) {
      const price = int(random, 3, 9);
      const count = int(random, 4, 9);
      return {
        prompt: `一支笔 ${price} 元，买 ${count} 支一共要多少元？`,
        note: '总价 = 单价 × 数量',
        choices: numeric(
          price * count,
          [price + count, price * count - price, price * count + price],
          random,
        ),
        answer: String(price * count),
        explain: `${price} × ${count} = ${price * count}（元）。`,
      };
    },
  },
  {
    id: 'worddiv',
    grade: 3,
    name: '除法应用题',
    make(random) {
      const per = int(random, 4, 9);
      const boxes = int(random, 3, 9);
      return {
        prompt: `有 ${per * boxes} 个鸡蛋，每盒装 ${per} 个，可以装几盒？`,
        note: '求总数里有几个每份数',
        choices: numeric(boxes, [boxes + 1, boxes - 1, per], random),
        answer: String(boxes),
        explain: `${per * boxes} ÷ ${per} = ${boxes}（盒）。`,
      };
    },
  },
  {
    id: 'compare1000',
    grade: 3,
    name: '比大小',
    make(random) {
      let a = int(random, 100, 999);
      let b = int(random, 100, 999);
      if (random() < 0.15) b = a;
      return symbolQuestion(a, b, random);
    },
  },
  {
    id: 'perimetersquare',
    grade: 3,
    name: '正方形周长',
    make(random) {
      const side = int(random, 3, 12);
      return {
        prompt: `一个正方形的边长是 ${side} 厘米，周长是多少厘米？`,
        note: '正方形周长 = 边长 × 4',
        choices: numeric(4 * side, [side * side, 2 * side, 4 * side + 4], random),
        answer: String(4 * side),
        explain: `${side} × 4 = ${4 * side}（厘米）。`,
      };
    },
  },
  {
    id: 'fractionsub',
    grade: 3,
    name: '同分母分数减法',
    make(random) {
      const denominator = int(random, 5, 9);
      const left = int(random, 2, denominator - 1);
      const right = int(random, 1, left - 1);
      const diff = left - right;
      return {
        prompt: `${left}/${denominator} - ${right}/${denominator} = （ ）`,
        note: '分母不变，分子相减',
        choices: shuffle(
          [
            `${diff}/${denominator}`,
            `${diff}/${denominator * 2}`,
            `${left + right}/${denominator}`,
          ],
          random,
        ),
        answer: `${diff}/${denominator}`,
        explain: `分母不变，${left} - ${right} = ${diff}，所以是 ${diff}/${denominator}。`,
      };
    },
  },
  {
    id: 'timesec',
    grade: 3,
    name: '时、分、秒',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          { prompt: '1 分 = （ ）秒', answer: '60', wrong: ['30', '100'] as [string, string] },
          { prompt: '2 分 = （ ）秒', answer: '120', wrong: ['20', '60'] as [string, string] },
          { prompt: '3 分 = （ ）秒', answer: '180', wrong: ['30', '300'] as [string, string] },
          {
            prompt: '1 分 30 秒 = （ ）秒',
            answer: '90',
            wrong: ['130', '60'] as [string, string],
          },
          {
            prompt: '2 分 15 秒 = （ ）秒',
            answer: '135',
            wrong: ['215', '75'] as [string, string],
          },
          { prompt: '60 秒 = （ ）分', answer: '1', wrong: ['6', '60'] as [string, string] },
          { prompt: '120 秒 = （ ）分', answer: '2', wrong: ['12', '20'] as [string, string] },
        ]),
      );
    },
  },
];

const G4_SHAPES: Array<{ prompt: string; answer: string; wrong: [string, string] }> = [
  { prompt: '平行四边形有几组对边互相平行？', answer: '2 组', wrong: ['1 组', '4 组'] },
  { prompt: '只有一组对边平行的四边形叫什么？', answer: '梯形', wrong: ['平行四边形', '长方形'] },
  { prompt: '长方形是特殊的（ ）。', answer: '平行四边形', wrong: ['梯形', '三角形'] },
  { prompt: '平行四边形的对角（ ）。', answer: '相等', wrong: ['互补', '不相等'] },
  {
    prompt: '从平行四边形一条边上的一点向对边画垂线，这点到垂足之间的线段叫（ ）。',
    answer: '高',
    wrong: ['底', '腰'],
  },
  { prompt: '梯形中互相平行的一组对边叫（ ）。', answer: '上底和下底', wrong: ['腰', '高'] },
];

const G4_TOPICS: MathTopic[] = [
  {
    id: 'bignum',
    grade: 4,
    name: '大数的组成',
    make(random) {
      const yi = int(random, 1, 9);
      const wan = int(random, 1, 9);
      const one = int(random, 1, 9);
      const answer = yi * 100000000 + wan * 10000 + one;
      return {
        prompt: `一个数由 ${yi} 个亿、${wan} 个万和 ${one} 个一组成，这个数是多少？`,
        note: '按数位写数',
        choices: shuffle(
          [
            String(answer),
            String(yi * 100000000 + wan * 1000000 + one),
            String(yi * 10000000 + wan * 10000 + one),
          ],
          random,
        ),
        answer: String(answer),
        explain: `${yi} 个亿是 ${yi * 100000000}，${wan} 个万是 ${wan * 10000}，合起来是 ${answer}。`,
      };
    },
  },
  {
    id: 'mul3x2',
    grade: 4,
    name: '三位数乘两位数',
    make(random) {
      const a = int(random, 102, 986);
      const b = int(random, 12, 98);
      return formula(`${a} × ${b} = ?`, a * b, [a * b - a, a * b + b, a * (b + 1)], random);
    },
  },
  {
    id: 'div2',
    grade: 4,
    name: '两位数除法',
    make(random) {
      const divisor = int(random, 12, 89);
      const quotient = int(random, 3, 9);
      return formula(
        `${divisor * quotient} ÷ ${divisor} = ?`,
        quotient,
        [quotient + 1, quotient - 1, divisor],
        random,
      );
    },
  },
  {
    id: 'mixed4',
    grade: 4,
    name: '四则混合运算',
    make(random) {
      if (random() < 0.5) {
        const a = int(random, 3, 9);
        const b = int(random, 3, 9);
        const c = int(random, 12, 89);
        const answer = a * b + c;
        return formula(
          `${a} × ${b} + ${c} = ?`,
          answer,
          [a * (b + c), answer - a, answer + b],
          random,
        );
      }
      const a = int(random, 12, 48);
      const b = int(random, 12, 48);
      const c = int(random, 2, 9);
      const answer = (a + b) * c;
      return formula(
        `(${a} + ${b}) × ${c} = ?`,
        answer,
        [a + b * c, answer - c, a * c + b],
        random,
      );
    },
  },
  {
    id: 'laws',
    grade: 4,
    name: '简便计算',
    make(random) {
      const count = int(random, 3, 19);
      const use125 = random() < 0.4;
      const base = use125 ? 125 : 25;
      const group = use125 ? 8 : 4;
      const answer = base * group * count;
      return formula(
        `${base} × ${count} × ${group} = ?`,
        answer,
        [base * count + group, answer + base, answer - count],
        random,
      );
    },
  },
  {
    id: 'angle',
    grade: 4,
    name: '角的度量',
    make(random) {
      const a = int(random, 15, 165);
      const answer = 180 - a;
      return {
        prompt: `一个平角减去 ${a}° 的角，剩下多少度？`,
        note: '平角是 180°',
        choices: numeric(answer, [180 + a, a, answer + 10], random),
        answer: String(answer),
        explain: `180° - ${a}° = ${answer}°。`,
      };
    },
  },
  {
    id: 'shape4',
    grade: 4,
    name: '平行四边形和梯形',
    make(random) {
      return staticQuestion(random, pick(random, G4_SHAPES));
    },
  },
  {
    id: 'decadd',
    grade: 4,
    name: '小数加减',
    make(random) {
      const a = int(random, 11, 89) / 10;
      const b = int(random, 11, 89) / 10;
      const answer = round(a + b, 1);
      return decimalQuestion(
        `${trim(a, 1)} + ${trim(b, 1)} = ?`,
        answer,
        [round(answer + 0.1, 1), round(answer - 1, 1), round(a + b + 1, 1)],
        random,
        `${trim(a, 1)} + ${trim(b, 1)} = ${trim(answer, 1)}`,
        1,
      );
    },
  },
  {
    id: 'deccompare',
    grade: 4,
    name: '小数比大小',
    make(random) {
      const a = int(random, 10, 99) / 10;
      const b = int(random, 10, 99) / 10;
      const answer = a > b ? '>' : a < b ? '<' : '=';
      return {
        prompt: `${trim(a, 1)} （ ） ${trim(b, 1)}`,
        note: '在（ ）里填上合适的符号',
        choices: shuffle(['>', '<', '='], random),
        answer,
        explain: `${trim(a, 1)} ${answer} ${trim(b, 1)}`,
      };
    },
  },
  {
    id: 'unitlen',
    grade: 4,
    name: '小数单位换算',
    make(random) {
      const meters = int(random, 11, 99) / 10;
      const answer = Math.round(meters * 100);
      return {
        prompt: `${trim(meters, 1)} 米 = （ ）厘米`,
        note: '1 米 = 100 厘米',
        choices: numeric(answer, [answer / 10, answer * 10, answer + 100], random),
        answer: String(answer),
        explain: `${trim(meters, 1)} × 100 = ${answer}（厘米）。`,
      };
    },
  },
  {
    id: 'areaunit',
    grade: 4,
    name: '公顷和平方千米',
    make(random) {
      const n = int(random, 2, 9);
      if (random() < 0.5) {
        return {
          prompt: `${n} 公顷 = （ ）平方米`,
          note: '1 公顷 = 10000 平方米',
          choices: numeric(n * 10000, [n * 1000, n * 100000, n * 100], random),
          answer: String(n * 10000),
          explain: `${n} × 10000 = ${n * 10000}（平方米）。`,
        };
      }
      return {
        prompt: `${n} 平方千米 = （ ）公顷`,
        note: '1 平方千米 = 100 公顷',
        choices: numeric(n * 100, [n * 10, n * 1000, n * 10000], random),
        answer: String(n * 100),
        explain: `${n} × 100 = ${n * 100}（公顷）。`,
      };
    },
  },
  {
    id: 'trip',
    grade: 4,
    name: '行程问题',
    make(random) {
      const speed = int(random, 40, 95);
      const time = int(random, 2, 8);
      return {
        prompt: `一辆汽车每小时行 ${speed} 千米，${time} 小时行多少千米？`,
        note: '路程 = 速度 × 时间',
        choices: numeric(
          speed * time,
          [speed + time, speed * time - speed, speed * (time + 1)],
          random,
        ),
        answer: String(speed * time),
        explain: `${speed} × ${time} = ${speed * time}（千米）。`,
      };
    },
  },
  {
    id: 'chickenrabbit',
    grade: 4,
    name: '鸡兔同笼',
    make(random) {
      const heads = int(random, 5, 20);
      const rabbits = int(random, 1, heads - 1);
      const legs = heads * 2 + rabbits * 2;
      return {
        prompt: `鸡兔同笼，共有 ${heads} 个头、${legs} 条腿。兔有几只？`,
        note: '假设全是鸡，多出的腿每 2 条对应 1 只兔',
        choices: numeric(rabbits, [heads - rabbits, rabbits + 1, heads - 1], random),
        answer: String(rabbits),
        explain: `假设全是鸡有 ${heads * 2} 条腿，多出 ${legs - heads * 2} 条，${legs - heads * 2} ÷ 2 = ${rabbits}（只兔）。`,
      };
    },
  },
  {
    id: 'average',
    grade: 4,
    name: '平均数',
    make(random) {
      const average = int(random, 70, 95);
      const deltas = [int(random, -4, 4), int(random, -4, 4), int(random, -4, 4)];
      const last = -deltas.reduce((sum, delta) => sum + delta, 0);
      const values = [...deltas, last].map((delta) => average + delta);
      const total = values.reduce((sum, value) => sum + value, 0);
      return {
        prompt: `四次跳绳的成绩分别是 ${values.join('、')} 下，平均每次跳多少下？`,
        note: '平均数 = 总数 ÷ 次数',
        choices: numeric(average, [average + 1, average - 1, average + 5], random),
        answer: String(average),
        explain: `(${values.join(' + ')}) ÷ 4 = ${total / 4}（下）。`,
      };
    },
  },
  {
    id: 'sequence',
    grade: 4,
    name: '找规律',
    make(random) {
      const start = int(random, 2, 20);
      const step = int(random, 2, 9);
      const terms = [0, 1, 2, 3].map((index) => start + step * index);
      const answer = start + step * 4;
      return {
        prompt: `${terms.join('、')}、（ ）`,
        note: '找出数列的规律',
        choices: numeric(answer, [answer + step, answer - step, answer + 10], random),
        answer: String(answer),
        explain: `每次加 ${step}，所以下一个是 ${answer}。`,
      };
    },
  },
  {
    id: 'triangleangle',
    grade: 4,
    name: '三角形内角和',
    make(random) {
      const a = int(random, 30, 80);
      const b = int(random, 30, 80);
      const answer = 180 - a - b;
      return {
        prompt: `三角形中两个角分别是 ${a}° 和 ${b}°，第三个角是多少度？`,
        note: '三角形内角和是 180°',
        choices: numeric(answer, [180 - a, 90 - a, answer + 20], random),
        answer: String(answer),
        explain: `180° - ${a}° - ${b}° = ${answer}°。`,
      };
    },
  },
  {
    id: 'anglecalc',
    grade: 4,
    name: '角的计算',
    make(random) {
      return staticQuestion(
        random,
        pick(random, [
          {
            prompt: '直角加上 35° 的角，是（ ）°',
            answer: '125',
            wrong: ['90', '145'] as [string, string],
          },
          {
            prompt: '平角减去 60° 的角，还剩（ ）°',
            answer: '120',
            wrong: ['60', '30'] as [string, string],
          },
          {
            prompt: '一个周角是（ ）°',
            answer: '360',
            wrong: ['180', '90'] as [string, string],
          },
          {
            prompt: '两个直角拼成的角是（ ）°',
            answer: '180',
            wrong: ['90', '360'] as [string, string],
          },
          {
            prompt: '一副三角尺上最大的角是（ ）°',
            answer: '90',
            wrong: ['60', '45'] as [string, string],
          },
          {
            prompt: '一个角是 120°，它比直角大（ ）°',
            answer: '30',
            wrong: ['60', '20'] as [string, string],
          },
        ]),
      );
    },
  },
];

const G5_TOPICS: MathTopic[] = [
  {
    id: 'decmul',
    grade: 5,
    name: '小数乘法',
    make(random) {
      const a = int(random, 11, 99) / 10;
      const b = int(random, 2, 9);
      const answer = round(a * b);
      return decimalQuestion(
        `${trim(a, 1)} × ${b} = ?`,
        answer,
        [round(answer + 0.1), round(answer * 10), round(answer - 1)],
        random,
        `${trim(a, 1)} × ${b} = ${trim(answer)}`,
      );
    },
  },
  {
    id: 'decdiv',
    grade: 5,
    name: '小数除法',
    make(random) {
      const quotient = int(random, 11, 99) / 10;
      const divisor = int(random, 2, 9);
      const dividend = round(quotient * divisor);
      return decimalQuestion(
        `${trim(dividend)} ÷ ${divisor} = ?`,
        quotient,
        [round(quotient * 10), round(quotient + 1), round(quotient / 10)],
        random,
        `${trim(dividend)} ÷ ${divisor} = ${trim(quotient)}`,
      );
    },
  },
  {
    id: 'decmixed',
    grade: 5,
    name: '小数混合运算',
    make(random) {
      const a = int(random, 11, 49) / 10;
      const b = int(random, 11, 49) / 10;
      const count = int(random, 2, 6);
      const first = round(a * count);
      const answer = round(first + b);
      return decimalQuestion(
        `${trim(a, 1)} × ${count} + ${trim(b, 1)} = ?`,
        answer,
        [round((a + b) * count), round(answer + 1), round(answer - 0.1)],
        random,
        `${trim(a, 1)} × ${count} = ${trim(first)}，${trim(first)} + ${trim(b, 1)} = ${trim(answer)}`,
      );
    },
  },
  {
    id: 'factors',
    grade: 5,
    name: '因数的个数',
    make(random) {
      const n = int(random, 12, 48);
      const list = Array.from({ length: n }, (_, index) => index + 1).filter(
        (value) => n % value === 0,
      );
      return {
        prompt: `${n} 的因数一共有几个？`,
        note: '一对一对地找，不要漏掉 1 和它本身',
        choices: numeric(
          list.length,
          [list.length + 1, list.length - 1, list.length + 2],
          random,
          1,
        ),
        answer: String(list.length),
        explain: `${n} 的因数有 ${list.join('、')}，共 ${list.length} 个。`,
      };
    },
  },
  {
    id: 'prime',
    grade: 5,
    name: '质数与合数',
    make(random) {
      const primes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79];
      const composites = [21, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87];
      const answer = pick(random, primes);
      const decoys = shuffle(composites, random).slice(0, 2).map(String);
      return {
        prompt: '下面哪个数是质数？',
        note: '质数只有 1 和它本身两个因数',
        choices: shuffle([String(answer), ...decoys], random),
        answer: String(answer),
        explain: `${answer} 只有 1 和它本身两个因数，是质数。`,
      };
    },
  },
  {
    id: 'multiple',
    grade: 5,
    name: '2、5 的倍数',
    make(random) {
      const answer = int(random, 2, 12) * 10;
      return {
        prompt: '下面哪个数既是 2 的倍数，又是 5 的倍数？',
        note: '同时是 2 和 5 的倍数，个位一定是 0',
        choices: numeric(answer, [answer + 5, answer + 2, answer - 4], random, 1),
        answer: String(answer),
        explain: `${answer} 的个位是 0，同时是 2 和 5 的倍数。`,
      };
    },
  },
  {
    id: 'reduce',
    grade: 5,
    name: '约分',
    make(random) {
      let a = int(random, 1, 5);
      let b = int(random, a + 1, 9);
      const divisor = gcd(a, b);
      a /= divisor;
      b /= divisor;
      const factor = int(random, 2, 6);
      return {
        prompt: `${a * factor}/${b * factor} 约分后是（ ）`,
        note: '分子分母同时除以最大公因数',
        choices: fractionChoices(
          `${a}/${b}`,
          [`${a * factor}/${b * factor}`, `${a}/${b + 1}`],
          random,
        ),
        answer: `${a}/${b}`,
        explain: `分子分母同时除以 ${factor}，得到 ${a}/${b}。`,
      };
    },
  },
  {
    id: 'fracadd',
    grade: 5,
    name: '异分母分数加法',
    make(random) {
      const d1 = int(random, 2, 6);
      let d2 = int(random, 2, 8);
      if (d2 === d1) d2 = d1 + 1;
      const numerator = d1 + d2;
      const denominator = d1 * d2;
      const answer = fraction(numerator, denominator);
      return {
        prompt: `1/${d1} + 1/${d2} = （ ）`,
        note: '先通分，再相加',
        choices: fractionChoices(answer, [`${numerator}/${denominator}`, `2/${d1 + d2}`], random),
        answer,
        explain: `通分后是 ${d2}/${denominator} + ${d1}/${denominator} = ${numerator}/${denominator}，约分得 ${answer}。`,
      };
    },
  },
  {
    id: 'fracdiv',
    grade: 5,
    name: '分数与除法',
    make(random) {
      const numerator = int(random, 1, 5);
      const denominator = int(random, numerator + 1, 9);
      return {
        prompt: `${numerator} ÷ ${denominator} = （ ）`,
        note: '被除数作分子，除数作分母',
        choices: shuffle(
          [
            `${numerator}/${denominator}`,
            `${denominator}/${numerator}`,
            `${numerator}/${denominator + 1}`,
          ],
          random,
        ),
        answer: `${numerator}/${denominator}`,
        explain: `${numerator} ÷ ${denominator} = ${numerator}/${denominator}。`,
      };
    },
  },
  {
    id: 'cuboidarea',
    grade: 5,
    name: '长方体表面积',
    make(random) {
      const a = int(random, 2, 9);
      const b = int(random, 2, 9);
      const c = int(random, 2, 9);
      const answer = 2 * (a * b + a * c + b * c);
      return {
        prompt: `一个长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，表面积是多少平方厘米？`,
        note: '表面积 =（长×宽 + 长×高 + 宽×高）× 2',
        choices: numeric(answer, [a * b * c, answer / 2, answer + 2 * a * b], random),
        answer: String(answer),
        explain: `(${a}×${b} + ${a}×${c} + ${b}×${c}) × 2 = ${answer}（平方厘米）。`,
      };
    },
  },
  {
    id: 'cuboidvol',
    grade: 5,
    name: '长方体体积',
    make(random) {
      const a = int(random, 2, 9);
      const b = int(random, 2, 9);
      const c = int(random, 2, 9);
      const answer = a * b * c;
      return {
        prompt: `一个长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，体积是多少立方厘米？`,
        note: '体积 = 长 × 宽 × 高',
        choices: numeric(answer, [2 * (a * b + a * c + b * c), answer + a * b, answer - a], random),
        answer: String(answer),
        explain: `${a} × ${b} × ${c} = ${answer}（立方厘米）。`,
      };
    },
  },
  {
    id: 'paraarea',
    grade: 5,
    name: '平行四边形面积',
    make(random) {
      const base = int(random, 3, 12);
      const height = int(random, 3, 10);
      const answer = base * height;
      return {
        prompt: `一个平行四边形的底是 ${base} 厘米，高是 ${height} 厘米，面积是多少平方厘米？`,
        note: '平行四边形面积 = 底 × 高',
        choices: numeric(answer, [answer / 2, (base + height) * 2, base + height], random),
        answer: String(answer),
        explain: `${base} × ${height} = ${answer}（平方厘米）。`,
      };
    },
  },
  {
    id: 'triarea',
    grade: 5,
    name: '三角形面积',
    make(random) {
      const base = int(random, 2, 12) * 2;
      const height = int(random, 3, 10);
      const answer = (base * height) / 2;
      return {
        prompt: `一个三角形的底是 ${base} 厘米，高是 ${height} 厘米，面积是多少平方厘米？`,
        note: '三角形面积 = 底 × 高 ÷ 2',
        choices: numeric(answer, [base * height, answer + base, answer / 2], random),
        answer: String(answer),
        explain: `${base} × ${height} ÷ 2 = ${answer}（平方厘米）。`,
      };
    },
  },
  {
    id: 'traparea',
    grade: 5,
    name: '梯形面积',
    make(random) {
      const top = int(random, 2, 8);
      let bottom = int(random, 2, 8);
      if (bottom === top) bottom += 2;
      const height = int(random, 1, 4) * 2;
      const answer = ((top + bottom) * height) / 2;
      return {
        prompt: `一个梯形上底 ${top} 厘米、下底 ${bottom} 厘米、高 ${height} 厘米，面积是多少平方厘米？`,
        note: '梯形面积 =（上底 + 下底）× 高 ÷ 2',
        choices: numeric(answer, [(top + bottom) * height, answer + height, top + bottom], random),
        answer: String(answer),
        explain: `(${top} + ${bottom}) × ${height} ÷ 2 = ${answer}（平方厘米）。`,
      };
    },
  },
  {
    id: 'equation',
    grade: 5,
    name: '简易方程',
    make(random) {
      const a = int(random, 2, 6);
      const x = int(random, 2, 9);
      const b = int(random, 1, 20);
      const c = a * x + b;
      return {
        prompt: `${a}x + ${b} = ${c}，x = ？`,
        note: '先把常数移到等号右边',
        choices: numeric(x, [x + 1, x - 1, c / a], random),
        answer: String(x),
        explain: `${a}x = ${c} - ${b} = ${a * x}，x = ${a * x} ÷ ${a} = ${x}。`,
      };
    },
  },
  {
    id: 'algebra',
    grade: 5,
    name: '用字母表示数',
    make(random) {
      const count = int(random, 3, 9);
      return {
        prompt: `每支笔 a 元，买 ${count} 支一共要（ ）元。`,
        note: '总价 = 单价 × 数量',
        choices: shuffle([`${count}a`, `a + ${count}`, `a ÷ ${count}`], random),
        answer: `${count}a`,
        explain: `a × ${count} = ${count}a（元）。`,
      };
    },
  },
  {
    id: 'volumeunit',
    grade: 5,
    name: '体积单位换算',
    make(random) {
      const n = int(random, 2, 9);
      if (random() < 0.5) {
        return {
          prompt: `${n} 升 = （ ）毫升`,
          note: '1 升 = 1000 毫升',
          choices: numeric(n * 1000, [n * 100, n * 10, n * 10000], random),
          answer: String(n * 1000),
          explain: `${n} × 1000 = ${n * 1000}（毫升）。`,
        };
      }
      return {
        prompt: `${n} 立方分米 = （ ）升`,
        note: '1 立方分米 = 1 升',
        choices: numeric(n, [n * 10, n * 100, n + 1], random),
        answer: String(n),
        explain: `1 立方分米 = 1 升，所以是 ${n} 升。`,
      };
    },
  },
  {
    id: 'tree',
    grade: 5,
    name: '植树问题',
    make(random) {
      const gap = int(random, 3, 9);
      const segments = int(random, 3, 9);
      const length = gap * segments;
      return {
        prompt: `一条 ${length} 米的小路，每隔 ${gap} 米栽一棵树（两端都栽），一共要栽多少棵？`,
        note: '两端都栽：棵数 = 段数 + 1',
        choices: numeric(segments + 1, [segments, segments + 2, segments * 2], random),
        answer: String(segments + 1),
        explain: `${length} ÷ ${gap} = ${segments}（段），${segments} + 1 = ${segments + 1}（棵）。`,
      };
    },
  },
];

const G6_PROPORTIONS: Array<{ prompt: string; answer: string; wrong: [string, string] }> = [
  { prompt: '路程一定，速度和时间成（ ）比例。', answer: '反', wrong: ['正', '不成'] },
  { prompt: '单价一定，总价和数量成（ ）比例。', answer: '正', wrong: ['反', '不成'] },
  {
    prompt: '长方形面积一定，长和宽成（ ）比例。',
    answer: '反',
    wrong: ['正', '不成'],
  },
  { prompt: '圆的周长和直径成（ ）比例。', answer: '正', wrong: ['反', '不成'] },
  { prompt: '人的身高和年龄成（ ）比例。', answer: '不成', wrong: ['正', '反'] },
  {
    prompt: '正方形的周长和边长成（ ）比例。',
    answer: '正',
    wrong: ['反', '不成'],
  },
  {
    prompt: '被减数一定，减数和差成（ ）比例。',
    answer: '不成',
    wrong: ['正', '反'],
  },
];

const G6_TOPICS: MathTopic[] = [
  {
    id: 'fracmul',
    grade: 6,
    name: '分数乘法',
    make(random) {
      const a = int(random, 1, 5);
      const b = int(random, a + 1, 8);
      const c = int(random, 1, 5);
      const d = int(random, c + 1, 8);
      const numerator = a * c;
      const denominator = b * d;
      const answer = fraction(numerator, denominator);
      return {
        prompt: `${a}/${b} × ${c}/${d} = （ ）`,
        note: '分子相乘，分母相乘，能约分要约分',
        choices: fractionChoices(
          answer,
          [`${numerator}/${denominator}`, `${a + c}/${b + d}`],
          random,
        ),
        answer,
        explain: `${a}×${c} = ${numerator}，${b}×${d} = ${denominator}，约分得 ${answer}。`,
      };
    },
  },
  {
    id: 'fracdiv',
    grade: 6,
    name: '分数除法',
    make(random) {
      const a = int(random, 1, 5);
      const b = int(random, a + 1, 8);
      const c = int(random, 2, 6);
      const answer = fraction(a, b * c);
      return {
        prompt: `${a}/${b} ÷ ${c} = （ ）`,
        note: '除以一个数，等于乘这个数的倒数',
        choices: fractionChoices(
          answer,
          [`${a}/${b * c}`, `${a * c}/${b}`, `${b}/${a * c}`],
          random,
        ),
        answer,
        explain: `${a}/${b} ÷ ${c} = ${a}/${b} × 1/${c} = ${answer}。`,
      };
    },
  },
  {
    id: 'fracmixed',
    grade: 6,
    name: '分数混合运算',
    make(random) {
      const b = int(random, 3, 7);
      const a = int(random, 1, b - 1);
      const count = int(random, 2, 4);
      const extra = int(random, 1, b - 1);
      const numerator = a * count + extra;
      const answer = fraction(numerator, b);
      return {
        prompt: `${a}/${b} × ${count} + ${extra}/${b} = （ ）`,
        note: '先算乘法，再算加法',
        choices: fractionChoices(
          answer,
          [fraction(a * count, b), `${numerator}/${b * count}`, `${numerator + 1}/${b}`],
          random,
        ),
        answer,
        explain: `${a}/${b} × ${count} = ${fraction(a * count, b)}，再加上 ${extra}/${b}，得 ${answer}。`,
      };
    },
  },
  {
    id: 'ratio',
    grade: 6,
    name: '化简比',
    make(random) {
      const a = int(random, 1, 5);
      const b = int(random, a + 1, 9);
      const factor = int(random, 2, 6);
      return {
        prompt: `${a * factor}:${b * factor} = （ ）`,
        note: '前项和后项同时除以相同的数',
        choices: shuffle([`${a}:${b}`, `${a * factor}:${b * factor}`, `${a + 1}:${b}`], random),
        answer: `${a}:${b}`,
        explain: `前项和后项同时除以 ${factor}，得到 ${a}:${b}。`,
      };
    },
  },
  {
    id: 'ratiodist',
    grade: 6,
    name: '按比分配',
    make(random) {
      const a = int(random, 1, 5);
      const b = int(random, a + 1, 8);
      const unit = int(random, 5, 15);
      const total = (a + b) * unit;
      return {
        prompt: `把 ${total} 按 ${a}:${b} 分配，较多的一份是多少？`,
        note: '先求总份数，再求一份是多少',
        choices: numeric(b * unit, [a * unit, total, unit], random),
        answer: String(b * unit),
        explain: `${a} + ${b} = ${a + b}（份），${total} ÷ ${a + b} = ${unit}，${unit} × ${b} = ${b * unit}。`,
      };
    },
  },
  {
    id: 'percent',
    grade: 6,
    name: '百分数互化',
    make(random) {
      if (random() < 0.5) {
        const decimal = int(random, 1, 99) / 100;
        return {
          prompt: `${trim(decimal)} = （ ）%`,
          note: '小数化成百分数，小数点向右移动两位',
          choices: numeric(
            Math.round(decimal * 100),
            [Math.round(decimal * 10), Math.round(decimal * 1000), Math.round(decimal * 100) + 10],
            random,
          ),
          answer: String(Math.round(decimal * 100)),
          explain: `${trim(decimal)} = ${Math.round(decimal * 100)}%。`,
        };
      }
      const denominator = pick(random, [2, 4, 5, 10, 20, 25]);
      const numerator = int(random, 1, denominator - 1);
      const percent = (numerator * 100) / denominator;
      return {
        prompt: `${numerator}/${denominator} = （ ）%`,
        note: '先化成小数，再化成百分数',
        choices: numeric(percent, [percent / 10, percent * 10, 100 - percent], random, 1),
        answer: String(percent),
        explain: `${numerator} ÷ ${denominator} = ${trim(numerator / denominator)} = ${percent}%。`,
      };
    },
  },
  {
    id: 'discount',
    grade: 6,
    name: '折扣',
    make(random) {
      const price = int(random, 5, 20) * 10;
      const discount = int(random, 5, 9);
      const answer = (price * discount) / 10;
      return {
        prompt: `一件商品原价 ${price} 元，打 ${discount} 折后是多少元？`,
        note: '几折就是原价的百分之几十',
        choices: numeric(answer, [price - discount, price * discount, answer + price / 10], random),
        answer: String(answer),
        explain: `${price} × ${discount / 10} = ${answer}（元）。`,
      };
    },
  },
  {
    id: 'circlec',
    grade: 6,
    name: '圆的周长',
    make(random) {
      const radius = int(random, 1, 10);
      const answer = round(2 * 3.14 * radius);
      return decimalQuestion(
        `一个圆的半径是 ${radius} 厘米，周长是多少厘米？（π 取 3.14）`,
        answer,
        [round(3.14 * radius), round(3.14 * radius * radius), round(answer + radius)],
        random,
        `2 × 3.14 × ${radius} = ${trim(answer)}（厘米）。`,
      );
    },
  },
  {
    id: 'circlea',
    grade: 6,
    name: '圆的面积',
    make(random) {
      const radius = int(random, 1, 10);
      const answer = round(3.14 * radius * radius);
      return decimalQuestion(
        `一个圆的半径是 ${radius} 厘米，面积是多少平方厘米？（π 取 3.14）`,
        answer,
        [round(2 * 3.14 * radius), round(3.14 * radius), round(3.14 * radius * radius * 2)],
        random,
        `3.14 × ${radius} × ${radius} = ${trim(answer)}（平方厘米）。`,
      );
    },
  },
  {
    id: 'cylinderarea',
    grade: 6,
    name: '圆柱表面积',
    make(random) {
      const radius = int(random, 1, 6);
      const height = int(random, 2, 10);
      const answer = round(2 * 3.14 * radius * radius + 2 * 3.14 * radius * height);
      return decimalQuestion(
        `一个圆柱的底面半径是 ${radius} 厘米，高是 ${height} 厘米，表面积是多少平方厘米？（π 取 3.14）`,
        answer,
        [
          round(3.14 * radius * radius * height),
          round(2 * 3.14 * radius * height),
          round(answer + 3.14),
        ],
        random,
        `两个底面积是 ${trim(round(2 * 3.14 * radius * radius))}，侧面积是 ${trim(round(2 * 3.14 * radius * height))}，合计 ${trim(answer)}（平方厘米）。`,
      );
    },
  },
  {
    id: 'cylindervol',
    grade: 6,
    name: '圆柱体积',
    make(random) {
      const radius = int(random, 1, 6);
      const height = int(random, 2, 10);
      const answer = round(3.14 * radius * radius * height);
      return decimalQuestion(
        `一个圆柱的底面半径是 ${radius} 厘米，高是 ${height} 厘米，体积是多少立方厘米？（π 取 3.14）`,
        answer,
        [round(3.14 * radius * height), round(3.14 * radius * radius), round(answer / height)],
        random,
        `3.14 × ${radius} × ${radius} × ${height} = ${trim(answer)}（立方厘米）。`,
      );
    },
  },
  {
    id: 'conevol',
    grade: 6,
    name: '圆锥体积',
    make(random) {
      const radius = int(random, 1, 6);
      const height = int(random, 1, 4) * 3;
      const answer = round((3.14 * radius * radius * height) / 3);
      return decimalQuestion(
        `一个圆锥的底面半径是 ${radius} 厘米，高是 ${height} 厘米，体积是多少立方厘米？（π 取 3.14）`,
        answer,
        [round(3.14 * radius * radius * height), round(3.14 * radius * height), round(answer * 3)],
        random,
        `3.14 × ${radius} × ${radius} × ${height} ÷ 3 = ${trim(answer)}（立方厘米）。`,
      );
    },
  },
  {
    id: 'negative',
    grade: 6,
    name: '负数比大小',
    make(random) {
      const a = int(random, 1, 20);
      let b = int(random, 1, 20);
      if (b === a) b = a + 1;
      const answer = a < b ? '>' : '<';
      return {
        prompt: `-${a} （ ） -${b}`,
        note: '在（ ）里填上合适的符号',
        choices: shuffle(['>', '<', '='], random),
        answer,
        explain: `负数比大小，绝对值大的反而小：-${a} ${answer} -${b}。`,
      };
    },
  },
  {
    id: 'scale',
    grade: 6,
    name: '比例尺',
    make(random) {
      const scale = pick(random, [100000, 200000, 500000, 1000000]);
      const map = int(random, 2, 9);
      const answer = (scale * map) / 100000;
      return {
        prompt: `在比例尺 1:${scale} 的地图上，量得两地相距 ${map} 厘米，实际距离是多少千米？`,
        note: '实际距离 = 图上距离 × 比例尺分母',
        choices: numeric(answer, [answer / 10, answer * 10, map], random, 1),
        answer: String(answer),
        explain: `${map} × ${scale} = ${map * scale}（厘米）= ${answer}（千米）。`,
      };
    },
  },
  {
    id: 'proportion',
    grade: 6,
    name: '正比例和反比例',
    make(random) {
      return staticQuestion(random, pick(random, G6_PROPORTIONS));
    },
  },
  {
    id: 'numbershape',
    grade: 6,
    name: '数与形',
    make(random) {
      const count = int(random, 3, 10);
      const answer = count * count;
      return {
        prompt: `1 + 3 + 5 + … + ${2 * count - 1} = ?`,
        note: '从 1 开始的连续奇数相加',
        choices: numeric(answer, [count * (count + 1), answer + count, answer - count], random),
        answer: String(answer),
        explain: `从 1 开始的 ${count} 个连续奇数相加，和是 ${count} × ${count} = ${answer}。`,
      };
    },
  },
  {
    id: 'ringarea',
    grade: 6,
    name: '圆环面积',
    make(random) {
      const outer = int(random, 3, 8);
      const inner = int(random, 1, outer - 1);
      const answer = round(3.14 * (outer * outer - inner * inner));
      return decimalQuestion(
        `一个圆环的外圆半径是 ${outer} 厘米，内圆半径是 ${inner} 厘米，面积是多少平方厘米？（π 取 3.14）`,
        answer,
        [
          round(3.14 * (outer * outer + inner * inner)),
          round(3.14 * (outer - inner) * (outer - inner)),
          round(3.14 * outer * outer),
        ],
        random,
        `3.14 × (${outer}×${outer} - ${inner}×${inner}) = ${trim(answer)}（平方厘米）。`,
      );
    },
  },
];

const TOPICS: Record<Grade, MathTopic[]> = {
  1: G1_TOPICS,
  2: G2_TOPICS,
  3: G3_TOPICS,
  4: G4_TOPICS,
  5: G5_TOPICS,
  6: G6_TOPICS,
};

export function mathTopics(grade: Grade): MathTopic[] {
  return TOPICS[grade];
}

export const MATH_TOPIC_COUNT = {
  1: G1_TOPICS.length,
  2: G2_TOPICS.length,
  3: G3_TOPICS.length,
  4: G4_TOPICS.length,
  5: G5_TOPICS.length,
  6: G6_TOPICS.length,
};

export function makeMathQuestion(topic: MathTopic, random: () => number): SubjectQuestion {
  const draft = topic.make(random);
  return {
    ...draft,
    key: `math:g${topic.grade}:${topic.id}`,
    subject: 'math',
    grade: topic.grade,
    topic: topic.name,
    display: draft.display ?? 'formula',
  };
}
