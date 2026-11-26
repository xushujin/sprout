import { useEffect, useRef, useState } from 'react';
import { findBook, scopeFor } from '../data/catalog';
import {
  findSubjectBook,
  subjectBooks,
  type LearningSubject,
  type SubjectId,
} from '../data/question';
import { chineseQuestions } from '../data/chinese';
import { MATH_TOPIC_COUNT } from '../lib/math-quiz';
import type { Progress } from '../lib/progress';
import { Icon } from './Icons';
import { ArtImage } from './ArtImage';
import { BookPicker } from './BookPicker';
import { SubjectSwitch } from './SubjectSwitch';
import { SUBJECT_ART, SUBJECT_ART_FALLBACK } from '../lib/art';

/** A round that was just configured and should start without another tap. */
export interface StartRequest {
  subject: SubjectId;
  bookId: string;
}

/**
 * The one place where a round is configured. The home page only offers a single
 * "start" button, so subject, grade / theme / difficulty are picked here and
 * then the round begins straight away — no going back to a picker first.
 */
export function RoundSetup({
  progress,
  initialSubject,
  busy,
  onClose,
  onStart,
}: {
  progress: Progress;
  initialSubject: SubjectId;
  busy: boolean;
  onClose: () => void;
  onStart: (subject: SubjectId, bookId: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [subject, setSubject] = useState<SubjectId>(initialSubject);
  const [bookId, setBookId] = useState(() => defaultBookId(progress, initialSubject));
  const remembered = useRef<Partial<Record<SubjectId, string>>>({});

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!node.open) node.showModal();
    return () => {
      if (node.open) node.close();
    };
  }, []);

  function pickSubject(next: SubjectId) {
    setSubject(next);
    setBookId(remembered.current[next] ?? defaultBookId(progress, next));
  }
  function pickBook(id: string) {
    setBookId(id);
    remembered.current[subject] = id;
  }

  const englishBook = findBook(bookId);
  const gradeBook = findSubjectBook(bookId, subject as LearningSubject);
  const isEnglish = subject === 'english';

  return (
    <dialog
      ref={dialog}
      className="setup-dialog"
      aria-labelledby="setup-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="setup-sheet">
        <header className="setup-head">
          <div>
            <span className="eyebrow">READY TO GROW</span>
            <h2 id="setup-title">这一轮，想练点什么？</h2>
          </div>
          <button type="button" className="setup-close" onClick={onClose} aria-label="关掉选择">
            <Icon name="close" size={18} />
          </button>
        </header>

        <SubjectSwitch value={subject} onChange={pickSubject} />

        <div className="setup-body">
          {isEnglish ? (
            <BookPicker
              compact
              selected={englishBook}
              onChange={pickBook}
              learned={seenIn(progress, scopeFor(englishBook))}
              loading={false}
              error=""
              retry={() => {}}
            />
          ) : (
            <section className="book-picker subject-picker setup-grades" aria-label="选择年级">
              <img
                className="subject-picker-watermark"
                src={SUBJECT_ART[subject]}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <div className="book-picker-heading">
                <div>
                  <span className="eyebrow">CHOOSE A LEVEL</span>
                  <h2>选一个年级</h2>
                </div>
                <ArtImage
                  src={SUBJECT_ART[subject]}
                  alt=""
                  className="subject-picker-art"
                  fallback={SUBJECT_ART_FALLBACK[subject]}
                />
              </div>
              <div className="grade-options subject-grades">
                {subjectBooks(subject).map((item) => (
                  <button
                    key={item.id}
                    className={gradeBook.id === item.id ? 'selected' : ''}
                    aria-pressed={gradeBook.id === item.id}
                    onClick={() => pickBook(item.id)}
                  >
                    <strong>{item.short}</strong>
                    <span>
                      {item.subject === 'math'
                        ? `${MATH_TOPIC_COUNT[item.grade]} 类题型`
                        : `${chineseQuestions(item.grade).length} 道题`}
                    </span>
                  </button>
                ))}
              </div>
              <p className="book-note">
                {gradeBook.subject === 'math'
                  ? `数学按${gradeBook.short}范围随机出题：${gradeBook.description}。同一类题每次都会换新数字。`
                  : `语文按${gradeBook.short}范围混合出题：${gradeBook.description}。答错的题会回到「再练一次」。`}
              </p>
              <div className="book-selection-summary">
                <strong>
                  <Icon name="check" size={16} />
                  {gradeBook.name}
                </strong>
                <span>每轮 5 题</span>
              </div>
            </section>
          )}
        </div>

        <footer className="setup-actions">
          <span className="setup-hint">
            {isEnglish
              ? '每轮 5 项 · 认图片、听发音、拼单词'
              : '每轮 5 题 · 答错会回到「再练一次」'}
          </span>
          <div>
            <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
              再想想
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => onStart(subject, bookId)}
              disabled={busy}
            >
              {busy ? '正在准备…' : '开始这一轮'}
              <Icon name="arrow" size={20} />
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

function defaultBookId(progress: Progress, subject: SubjectId): string {
  if (subject === 'english') return findBook(progress.bookId).id;
  const saved = progress.subjectBooks?.[subject] ?? progress.subjectBookId;
  return findSubjectBook(saved, subject).id;
}

function seenIn(progress: Progress, scope: string): number {
  const states = scope === 'general' ? progress.words : (progress.preschoolWords?.[scope] ?? {});
  return Object.values(states).filter((state) => state.seen).length;
}
