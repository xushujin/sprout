import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '../../shared/types';
import {
  findSubjectBook,
  subjectBooks,
  SUBJECT_META,
  type LearningSubject,
  type SubjectId,
} from '../data/question';
import { chineseQuestions, CHINESE_TOTAL } from '../data/chinese';
import { MATH_TOPIC_COUNT } from '../lib/math-quiz';
import {
  completeSubjectRound,
  makeSubjectRound,
  readProgress,
  saveSoundPreferences,
  selectSubjectBook,
  type Progress,
  type SubjectRoundItem,
} from '../lib/progress';
import { gameSound, type SoundPreferences } from '../lib/game-sound';
import { growthFor } from '../lib/growth';
import { themeCopyFor, themeFor } from '../lib/theme';
import { Icon } from '../components/Icons';
import { ArtImage } from '../components/ArtImage';
import { CELEBRATE_ART, SUBJECT_ART, SUBJECT_ART_FALLBACK, THEME_ART } from '../lib/art';
import { SubjectSwitch } from '../components/SubjectSwitch';
import { SoundControls } from '../components/SoundControls';
import { RoundSprout, Sunflower } from '../components/Sunflower';

const SUBJECT_SECONDS = 30;

export function SubjectPractice({
  user,
  progress,
  subject,
  onSelectSubject,
  onComplete,
  roundActive,
}: {
  user: User;
  progress: Progress;
  subject: LearningSubject;
  onSelectSubject: (subject: SubjectId) => void;
  onComplete: () => void;
  roundActive: (active: boolean) => void;
}) {
  const copy = themeCopyFor(user);
  const theme = themeFor(user) ?? 'boy';
  const meta = SUBJECT_META[subject];
  const [bookId, setBookId] = useState(() => findSubjectBook(progress.subjectBookId, subject).id);
  useEffect(() => {
    setBookId(findSubjectBook(progress.subjectBookId, subject).id);
  }, [progress.subjectBookId, subject]);
  const book = findSubjectBook(bookId, subject);
  const isMath = book.subject === 'math';
  const [items, setItems] = useState<SubjectRoundItem[] | null>(null);
  const [roundId, setRoundId] = useState('');
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'quiz' | 'feedback' | 'done'>('quiz');
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(SUBJECT_SECONDS);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const saving = useRef(false);
  const answered = useRef(false);
  const started = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const startPoints = useRef(0);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const [sounds, setSounds] = useState<SoundPreferences>(() => ({
    music: progress.sound?.music !== false,
    effects: progress.sound?.effects !== false,
  }));

  const states = progress.subjects?.[book.id] ?? {};
  const learned = Object.values(states).filter((state) => state.seen).length;
  const mistakes = Object.values(states).filter((state) => state.needsReview).length;
  const total = isMath ? MATH_TOPIC_COUNT[book.grade] : chineseQuestions(book.grade).length;
  const growth = growthFor(progress.points);
  const preview = useMemo(() => makeSubjectRound(progress, book), [progress, book.id]);
  const current = items?.[index];

  useEffect(() => {
    if (leaving) leaveDialog.current?.showModal();
    else leaveDialog.current?.close();
  }, [leaving]);
  useEffect(() => {
    if (!items || phase === 'done') return;
    const visibility = () => {
      if (document.hidden) pauseRound();
      else if (!leaving) resumeRound();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [items, phase, leaving]);
  useEffect(
    () => () => {
      gameSound.stop();
      roundActive(false);
    },
    [],
  );
  useEffect(() => {
    if (!items || phase !== 'quiz') return;
    const tick = () => {
      if (pausedAt.current !== null) return;
      const seconds = Math.max(
        0,
        Math.ceil(SUBJECT_SECONDS - (Date.now() - started.current) / 1000),
      );
      setRemaining(seconds);
      gameSound.setUrgent(seconds <= 5);
      if (!seconds && !answered.current) finish(false, null);
    };
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [items, phase, index]);

  function changeBook(id: string) {
    setBookId(id);
    void selectSubjectBook(user.id, id);
  }
  function changeSound(value: SoundPreferences) {
    setSounds(value);
    gameSound.setPreferences(value);
    void saveSoundPreferences(user.id, value);
  }
  function pauseRound() {
    gameSound.pause();
    if (phase === 'quiz' && pausedAt.current === null) pausedAt.current = Date.now();
  }
  function resumeRound() {
    if (pausedAt.current !== null) {
      started.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
    }
    gameSound.resume();
  }
  function start() {
    const latest = readProgress(user.id);
    const round = makeSubjectRound(latest, book);
    if (round.length < 5) return;
    startPoints.current = latest.points;
    setItems(round);
    setRoundId(crypto.randomUUID());
    setIndex(0);
    setPhase('quiz');
    setAnswers([]);
    setSelected(null);
    setRemaining(SUBJECT_SECONDS);
    setLeaving(false);
    pausedAt.current = null;
    answered.current = false;
    started.current = Date.now();
    gameSound.start(sounds);
    roundActive(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function finish(correct: boolean, choice: string | null) {
    answered.current = true;
    setSelected(choice);
    setAnswers((old) => [...old, correct]);
    setPhase('feedback');
    gameSound.setUrgent(false);
    gameSound.answer(correct);
  }
  function choose(choice: string) {
    if (!current || answered.current || phase !== 'quiz') return;
    finish(choice === current.question.answer, choice);
  }
  async function next() {
    if (!items || saving.current) return;
    if (index < 4) {
      setIndex(index + 1);
      setPhase('quiz');
      setSelected(null);
      setRemaining(SUBJECT_SECONDS);
      answered.current = false;
      started.current = Date.now();
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      await completeSubjectRound(user.id, roundId, items, answers, book.id);
      gameSound.finish();
      setPhase('done');
      roundActive(false);
      onComplete();
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  function goHome() {
    gameSound.stop();
    setLeaving(false);
    setItems(null);
    setAnswers([]);
    setSelected(null);
    pausedAt.current = null;
    roundActive(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function requestHome() {
    if (saving.current) return;
    pauseRound();
    setLeaving(true);
  }
  function continueLearning() {
    setLeaving(false);
    if (!document.hidden) resumeRound();
  }

  const heading = (title: string, subtitle: string) => (
    <div className="page-heading">
      <div>
        <span className="eyebrow">MY LITTLE GARDEN</span>
        <h1>
          {title} <span className="heading-wave">👋</span>
        </h1>
        <p>
          {subtitle} <span className="theme-badge">{copy.badge}</span>
        </p>
      </div>
      <span className="date-tag">慢慢学，天天长</span>
    </div>
  );

  if (!items)
    return (
      <div className="page-enter">
        {heading(
          `你好，${user.display_name}`,
          isMath ? '今天也来算一算，想一想。' : '今天也来认几个新朋友。',
        )}
        <SubjectSwitch value={subject} onChange={onSelectSubject} />
        <section className="book-picker subject-picker" aria-label="选择年级">
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
              <h2>选一个年级，开始今天的练习</h2>
            </div>
            <ArtImage
              src={SUBJECT_ART[subject]}
              alt=""
              className="subject-picker-art"
              fallback={SUBJECT_ART_FALLBACK[subject]}
              eager
            />
          </div>
          <div className="grade-options subject-grades">
            {subjectBooks(subject).map((item) => (
              <button
                key={item.id}
                className={book.id === item.id ? 'selected' : ''}
                aria-pressed={book.id === item.id}
                onClick={() => changeBook(item.id)}
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
            {isMath
              ? `数学按${book.short}范围随机出题：${book.description}。同一类题每次都会换新数字，做完一轮再来一轮也不会重复。`
              : `语文按${book.short}范围混合出题：${book.description}。${CHINESE_TOTAL} 道题全部由 WordSprout 自主整编，答错的题会回到「再练一次」。`}
          </p>
          <div className="book-selection-summary">
            <strong>
              <Icon name="check" size={16} />
              {book.name}
            </strong>
            <span>
              已练 {learned} / {total} {isMath ? '类题型' : '道题'}
            </span>
          </div>
        </section>
        <section className="hero-card subject-hero">
          <div className="hero-copy">
            <span className="pill pale">
              {meta.emoji} {book.name} · 每轮 5 题
            </span>
            <h2>
              {isMath ? (
                <>
                  算一道题，
                  <br />
                  解开一个小谜题。
                </>
              ) : (
                <>
                  认一个字，
                  <br />
                  读出一整个故事。
                </>
              )}
            </h2>
            <p>{mistakes ? `还有 ${mistakes} 道题想再练一次，这一轮先来照顾它们。` : copy.hint}</p>
            <button className="button primary" onClick={start} disabled={preview.length < 5}>
              开始 5 道题
              <Icon name="arrow" size={20} />
            </button>
            <div
              className="growth-line"
              role="group"
              aria-label={`向日葵现在是${growth.stage.name}${
                growth.next ? `，还差 ${growth.toNext} 分长成${growth.next.name}` : '，已经结籽'
              }`}
            >
              <img
                className="growth-badge"
                src={`/sunflower/stage-${growth.index}-badge.webp`}
                alt=""
                aria-hidden="true"
              />
              <strong>{growth.stage.name}</strong>
              <span className="growth-track" aria-hidden="true">
                <span style={{ width: `${Math.round(growth.progress * 100)}%` }} />
              </span>
              <small>
                {growth.next ? `还差 ${growth.toNext} 分到${growth.next.name}` : '已经结籽啦'}
              </small>
            </div>
            <SoundControls value={sounds} onChange={changeSound} />
            <span className="hero-caption">轻松几分钟，进步看得见</span>
          </div>
          <div className={`hero-art hero-art--subject hero-art--${subject}`}>
            <span className="hero-halo" aria-hidden="true" />
            <ArtImage
              src={SUBJECT_ART[subject]}
              alt=""
              className="hero-character hero-character--subject"
              fallback={SUBJECT_ART_FALLBACK[subject]}
              eager
              width={512}
              height={512}
            />
            <span className="hero-float hero-float--1" aria-hidden="true" />
            <span className="hero-float hero-float--2" aria-hidden="true" />
            <span className="hero-float hero-float--3" aria-hidden="true" />
          </div>
        </section>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon green">
              <Icon name="check" />
            </span>
            <div>
              <strong>
                {learned}
                <small> {isMath ? '类' : '道'}</small>
              </strong>
              <span>{isMath ? '练过的题型' : '会做的题'}</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon amber">
              <Icon name="star" />
            </span>
            <div>
              <strong>
                {progress.points}
                <small> 分</small>
              </strong>
              <span>成长积分</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon lilac">
              <Icon name="refresh" />
            </span>
            <div>
              <strong>
                {progress.rounds}
                <small> 轮</small>
              </strong>
              <span>完成的学习</span>
            </div>
          </div>
        </div>
        <div className="section-heading">
          <h2>下一轮的小题目</h2>
          <span>
            {meta.name} · {book.short} · 每轮从题库里挑 5 题
          </span>
        </div>
        <div className="preview-grid subject-preview-grid">
          {preview.map((item, i) => (
            <div className={`preview-card tone-${i}`} key={item.question.key}>
              <img
                className="subject-preview-watermark"
                src={SUBJECT_ART[subject]}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <span className="preview-number">0{i + 1}</span>
              <p className="subject-preview-prompt">{item.question.prompt}</p>
              <span>{item.question.topic}</span>
            </div>
          ))}
        </div>
        <div className="garden-tip">
          <ArtImage
            src={THEME_ART[theme].note}
            alt=""
            className="garden-tip-art"
            fallback={isMath ? '🧮' : '💡'}
          />
          <p>
            <strong>{isMath ? '数字小秘诀' : '小芽悄悄话'}</strong>
            {isMath
              ? '同一类题会换新数字再来一次，记住方法，比记住答案更重要。答对一题 +10 积分，补对一题额外 +5。'
              : '答错也没关系，这道题会回到「再练一次」。下次做对，还能额外获得 5 积分！'}
          </p>
        </div>
        <p className="local-note">
          {isMath
            ? '数学题库由 WordSprout 按年级范围随机生成 · 完成一轮后同步积分'
            : '语文题库为 WordSprout 自主整编 · 按年级混合出题 · 完成一轮后同步积分'}
        </p>
      </div>
    );

  if (phase === 'done') {
    const correct = answers.filter(Boolean).length;
    const repaired = (items ?? []).filter((item, i) => item.wasMistake && answers[i]).length;
    const grown = growthFor(progress.points);
    const stageUp = grown.index > growthFor(startPoints.current).index;
    return (
      <div className="result-card page-enter">
        <div className="result-medal">
          <ArtImage src={CELEBRATE_ART} alt="" className="result-medal-art" fallback="🌟" eager />
        </div>
        <span className="eyebrow">{book.name} · 本轮成长</span>
        <h1>{correct === 5 ? '五道题，全都答对啦！' : '又解开了一组小谜题！'}</h1>
        <p>认真做完一轮，就是值得庆祝的成长。</p>
        <div className="result-stats">
          <div>
            <strong>
              {correct}
              <small> / 5</small>
            </strong>
            <span>答对题目</span>
          </div>
          <div>
            <strong>+{correct * 10 + repaired * 5}</strong>
            <span>成长积分</span>
          </div>
        </div>
        <p className="muted result-note">成长积分已到账；星榜本周净积分每 30 分钟更新一次。</p>
        <div className={`result-growth${stageUp ? ' is-new' : ''}`}>
          <Sunflower variant="badge" stage={grown.index} className="sunflower-result" />
          <p>
            <strong>
              {stageUp ? `向日葵${grown.stage.name}啦！` : `向日葵 · ${grown.stage.name}`}
            </strong>
            <span>
              {grown.next
                ? `再攒 ${grown.toNext} 分就到${grown.next.name}`
                : '已经结籽啦，真了不起'}
            </span>
          </p>
        </div>
        {repaired > 0 && (
          <p className="success-text">
            你补对了 {repaired} 道题，额外获得 {repaired * 5} 积分！
          </p>
        )}
        {correct < 5 && (
          <p className="muted">没做对的 {5 - correct} 道题，下一轮会优先陪你练习。</p>
        )}
        <div className="result-words">
          {(items ?? []).map((item, i) => (
            <span key={item.question.key} className={answers[i] ? 'word-good' : 'word-retry'}>
              {item.question.topic} · {item.question.answer}{' '}
              <Icon name={answers[i] ? 'check' : 'refresh'} size={14} />
            </span>
          ))}
        </div>
        <div className="result-buttons">
          <button className="button primary" onClick={start}>
            再来 5 道题
            <Icon name="arrow" size={20} />
          </button>
          <button className="button secondary" onClick={goHome}>
            <Icon name="home" size={18} />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const correct = answers[index];
  const question = current.question;
  const stacked = question.choices.some((choice) => choice.length > 6);
  return (
    <div className="round-page page-enter">
      <div className="round-toolbar">
        <button
          type="button"
          className="button secondary home-button"
          onClick={requestHome}
          disabled={busy}
        >
          <Icon name="home" size={18} />
          返回首页
        </button>
        <SoundControls value={sounds} onChange={changeSound} />
      </div>
      <dialog
        ref={leaveDialog}
        className="leave-dialog"
        aria-labelledby="subject-leave-title"
        aria-describedby="subject-leave-description"
        onCancel={(event) => {
          event.preventDefault();
          continueLearning();
        }}
      >
        <span className="leave-illustration" aria-hidden="true">
          🌱
        </span>
        <h2 id="subject-leave-title">要先回到花园吗？</h2>
        <p id="subject-leave-description">
          本轮还没有完成，返回后这轮答案不会保存。之前已完成的学习和积分都会保留。
        </p>
        <div className="leave-actions">
          <button className="button primary" autoFocus onClick={continueLearning}>
            继续本轮
          </button>
          <button className="button secondary" onClick={goHome}>
            确认返回首页
          </button>
        </div>
      </dialog>
      <div className="round-top">
        <span className="eyebrow">{isMath ? 'LITTLE MATHEMATICIAN' : 'LITTLE READER'}</span>
        <span>
          {book.name} · {index + 1} / 5
        </span>
      </div>
      <div className="round-steps" aria-label={`进度 ${index + 1}/5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i <= index ? 'filled' : ''} />
        ))}
      </div>
      <section className="question-card" data-subject={book.subject}>
        <img
          className="question-watermark"
          src={SUBJECT_ART[subject]}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <div className="quiz-title">
          <span className="question-topic">{question.topic}</span>
          <span
            className={`timer ${remaining <= 5 ? 'urgent' : ''}`}
            aria-label={`剩余 ${remaining} 秒`}
          >
            {remaining}s
          </span>
        </div>
        <div
          className={`question-prompt question-prompt--${question.display ?? 'text'} ${
            phase === 'feedback' ? 'is-answered' : ''
          }`}
        >
          {question.prompt}
        </div>
        {question.note && <p className="question-note">{question.note}</p>}
        <div className={`choice-grid ${stacked ? 'choice-grid--stacked' : ''}`}>
          {question.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => choose(choice)}
              disabled={phase === 'feedback'}
              className={`choice ${
                phase === 'feedback' && choice === question.answer ? 'correct' : ''
              } ${phase === 'feedback' && selected === choice && !correct ? 'incorrect' : ''}`}
              aria-label={`选择 ${choice}`}
            >
              {choice}
            </button>
          ))}
        </div>
        {phase === 'feedback' && (
          <div className={`feedback ${correct ? 'good' : 'retry'}`} role="status">
            <RoundSprout answers={answers} />
            <div>
              <strong>
                {correct ? '✓ 小芽长高了一点！' : <>正确答案是「{question.answer}」</>}
              </strong>
              <p>{question.explain}</p>
              <p>
                {correct
                  ? `+${current.wasMistake ? 15 : 10} 积分${
                      current.wasMistake ? '，补对成功！' : '，继续加油！'
                    }`
                  : '已经放进「再练一次」，下一轮换个问法再来。'}
              </p>
            </div>
            <button className="button primary" onClick={() => void next()} disabled={busy}>
              {busy ? '正在保存…' : index === 4 ? '收获本轮成长' : '下一题'}
              <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
