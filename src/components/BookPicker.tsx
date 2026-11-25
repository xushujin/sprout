import { BOOKS, GRADE_LABELS, type Book, type BookMode } from '../data/catalog';
import { CURRICULUM_CORE_TARGET, GENERAL_WORD_TARGET } from '../data/general-words';
import { PRESCHOOL_THEMES } from '../data/preschool';
import { TOPIC_PACKS } from '../data/topics';
import { Icon } from './Icons';

const tabs: { mode: BookMode; title: string }[] = [
  { mode: 'grade', title: '按年级' },
  { mode: 'theme', title: '主题包' },
  { mode: 'level', title: '按难度' },
  { mode: 'preschool', title: '幼小衔接' },
];
export function BookPicker({
  selected,
  onChange,
  learned,
  loading,
  error,
  retry,
}: {
  selected: Book;
  onChange: (id: string) => void;
  learned: number;
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  function switchMode(mode: BookMode) {
    if (mode === selected.mode) return;
    onChange(BOOKS.find((book) => book.mode === mode)!.id);
  }
  return (
    <section className="book-picker" aria-label="选择学习词库">
      <div className="book-picker-heading">
        <div>
          <span className="eyebrow">PICK YOUR LITTLE ADVENTURE</span>
          <h2>今天，想种哪一片小花园？</h2>
        </div>
        <Icon name="book" size={26} />
      </div>
      <div className="book-tabs" role="tablist" aria-label="词库分类">
        {tabs.map(({ mode, title }) => (
          <button
            key={mode}
            role="tab"
            aria-selected={selected.mode === mode}
            aria-controls="book-panel"
            onClick={() => switchMode(mode)}
          >
            {title}
          </button>
        ))}
      </div>
      <div
        id="book-panel"
        role="tabpanel"
        aria-label={tabs.find((tab) => tab.mode === selected.mode)!.title}
      >
        {selected.mode === 'grade' && (
          <>
            <div className="grade-options">
              {BOOKS.filter((book) => book.mode === 'grade').map((book) => (
                <button
                  key={book.id}
                  className={selected.id === book.id ? 'selected' : ''}
                  aria-pressed={selected.id === book.id}
                  onClick={() => onChange(book.id)}
                >
                  <strong>{GRADE_LABELS[book.grade! - 1]}</strong>
                  <span>
                    <span className="grade-added">新增 {book.added} · </span>累计 {book.count}
                  </span>
                </button>
              ))}
            </div>
            <p className="book-note">
              以课标二级词汇范围（{CURRICULUM_CORE_TARGET} 词）为参照，并补充{' '}
              {GENERAL_WORD_TARGET - CURRICULUM_CORE_TARGET}{' '}
              个主题拓展词。各年级为累计学习，具体分级是本站自主建议。
            </p>
          </>
        )}
        {selected.mode === 'theme' && (
          <>
            <div className="pack-intro">
              <div>
                <strong>按兴趣挑一个主题</strong>
                <span>每个主题包 20 个词 · 每轮 5 个 · 认图片、听发音、拼单词</span>
              </div>
              <span aria-hidden="true">🧺</span>
            </div>
            <div className="pack-options">
              {BOOKS.filter((book) => book.mode === 'theme').map((book) => {
                const pack = TOPIC_PACKS.find((item) => item.id === book.theme)!;
                return (
                  <button
                    key={book.id}
                    className={selected.id === book.id ? 'selected' : ''}
                    aria-pressed={selected.id === book.id}
                    onClick={() => onChange(book.id)}
                  >
                    <span className="pack-emoji" aria-hidden="true">
                      {pack.emoji}
                    </span>
                    <span className="pack-copy">
                      <strong>{pack.name}</strong>
                      <span>{pack.description}</span>
                    </span>
                    <span className="pack-count">{book.count} 词</span>
                  </button>
                );
              })}
            </div>
            <p className="book-note">
              主题包由 WordSprout
              自主整理，词条全部来自当前词库与同一批录音，只是换一种生活场景来复习；不对应任何教材单元，也不额外增加积分门槛。
            </p>
          </>
        )}
        {selected.mode === 'preschool' && (
          <>
            <div className="pack-intro">
              <div>
                <strong>先听声音，再认一认</strong>
                <span>每个小主题 10 个词 · 每轮 5 个 · 适合刚接触英语的孩子</span>
              </div>
              <span aria-hidden="true">🌱</span>
            </div>
            <div className="pack-options">
              {BOOKS.filter((book) => book.mode === 'preschool').map((book) => {
                const theme = PRESCHOOL_THEMES.find((item) => item.id === book.theme)!;
                return (
                  <button
                    key={book.id}
                    className={selected.id === book.id ? 'selected' : ''}
                    aria-pressed={selected.id === book.id}
                    onClick={() => onChange(book.id)}
                  >
                    <span className="pack-emoji" aria-hidden="true">
                      {theme.emoji}
                    </span>
                    <span className="pack-copy">
                      <strong>{theme.name}</strong>
                      <span>{theme.description}</span>
                    </span>
                    <span className="pack-count">{book.count} 词</span>
                  </button>
                );
              })}
            </div>
            <p className="book-note">
              幼小衔接是 WordSprout
              自主编排的启蒙路线，选词来自当前词库，按生活主题循序渐进；不对应特定教材，也不宣称官方课程分级。可先整轮听音认意思，再逐步脱离提示。
            </p>
          </>
        )}
        {selected.mode === 'level' && (
          <>
            <div className="level-options">
              {BOOKS.filter((book) => book.mode === 'level').map((book, i) => (
                <button
                  key={book.id}
                  className={selected.id === book.id ? 'selected' : ''}
                  aria-pressed={selected.id === book.id}
                  onClick={() => onChange(book.id)}
                >
                  <span className="level-emoji">{['🌱', '🌿', '🌳'][i]}</span>
                  <strong>{book.name}</strong>
                  <span>
                    {book.count} 个词 · {book.description}
                  </span>
                </button>
              ))}
            </div>
            <p className="book-note">
              三个难度按主题和抽象程度逐层累计：入门 200 词、基础累计 400 词、进阶累计 600
              词；可以随时调整，不对应任何出版社教材。
            </p>
          </>
        )}
      </div>
      <p className="book-note">
        <a href="/vocabulary/credits.html" target="_blank" rel="noreferrer">
          词库来源与使用说明
        </a>
      </p>
      <div className="book-selection-summary">
        <strong>
          <Icon name="check" size={16} />
          {selected.name}
        </strong>
        <span>
          {loading
            ? '正在打开词库…'
            : error
              ? '等待加载'
              : `已认识 ${learned} / ${selected.count} 项`}
        </span>
      </div>
      {error && (
        <div className="book-load-error" role="status">
          <span>{error}</span>
          <button className="button small secondary" onClick={retry}>
            重新加载词库
          </button>
        </div>
      )}
    </section>
  );
}
