import { BOOKS, GRADE_LABELS, type Book, type BookMode } from '../data/catalog';
import { CURRICULUM_CORE_TARGET, GENERAL_WORD_TARGET } from '../data/general-words';
import { Icon } from './Icons';

const tabs: { mode: BookMode; title: string }[] = [
  { mode: 'grade', title: '按年级' },
  { mode: 'level', title: '按难度' },
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
                    新增 {book.added} · 累计 {book.count}
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
