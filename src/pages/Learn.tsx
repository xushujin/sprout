import { useEffect, useRef, useState } from 'react';
import type { User } from '../../shared/types';
import type { Word } from '../data/words';
import { findBook, loadBookWords, scopeFor } from '../data/catalog';
import { dialogueOptions, type DialogueEntry } from '../data/dialogues';
import { BookPicker } from '../components/BookPicker';
import { SoundControls } from '../components/SoundControls';
import { gameSound, type SoundPreferences } from '../lib/game-sound';
import {
  completeRound,
  makeRound,
  optionsFor,
  readProgress,
  selectBook,
  saveSoundPreferences,
  type Progress,
  type RoundWord,
} from '../lib/progress';
import {
  QUIZ_SECONDS,
  quizHint,
  quizPrompt,
  spellAttempt,
  spellingTiles,
  type LetterTile,
} from '../lib/quiz';
import { speak, stopAudio } from '../lib/audio';
import { growthFor } from '../lib/growth';
import { Icon } from '../components/Icons';
import { ArtImage } from '../components/ArtImage';
import { CELEBRATE_ART, THEME_ART } from '../lib/art';
import { RoundSprout, Sunflower } from '../components/Sunflower';
import { SubjectSwitch } from '../components/SubjectSwitch';
import { SubjectPractice } from './SubjectPractice';
import type { SubjectId } from '../data/question';
import { themeCopyFor, themeFor } from '../lib/theme';

export function WordPicture({ word }: { word: Word }) {
  const [failed, setFailed] = useState(false);
  const image = word.image && !failed ? word.image : '';
  return image ? (
    <img
      src={image}
      alt={word.zh}
      className="word-image"
      width={384}
      height={384}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  ) : word.emoji ? (
    <span role="img" aria-label={word.zh} className="word-emoji">
      {word.emoji}
    </span>
  ) : (
    <span className="word-placeholder" aria-hidden="true">
      {word.en.charAt(0).toUpperCase()}
    </span>
  );
}

// One line of a dialogue. The blank stays visible while answering, then shows
// the reviewed word so the child reads the sentence back in full.
function DialogueText({ text, fill }: { text: string; fill?: string }) {
  if (!text.includes('___')) return <>{text}</>;
  const [before, after] = text.split('___');
  // Keep the punctuation that closes the sentence on the blank's line, so a
  // narrow phone never shows a lone period under the bubble.
  const trailing = after.match(/^([.,!?;:]+)([\s\S]*)$/);
  const punctuation = trailing?.[1] ?? '';
  const rest = trailing ? trailing[2] : after;
  return (
    <>
      {before}
      <span className="dialogue-blank-group">
        {fill ? (
          <span className="dialogue-blank filled">{fill}</span>
        ) : (
          <span className="dialogue-blank" role="img" aria-label="空格" />
        )}
        {punctuation}
      </span>
      {rest}
    </>
  );
}

function DialogueCard({
  entry,
  fill,
  showTranslation,
  toggleTranslation,
}: {
  entry: DialogueEntry;
  fill?: string;
  showTranslation: boolean;
  toggleTranslation: () => void;
}) {
  return (
    <div className="dialogue-card" aria-label="英语对话">
      {entry.lines.map((line, index) => (
        <div key={index} className={`dialogue-row ${line.speaker === 'B' ? 'right' : ''}`}>
          <span className="dialogue-speaker" aria-hidden="true">
            {line.speaker}
          </span>
          <p className="dialogue-bubble">
            <DialogueText text={line.text} fill={line.text.includes('___') ? fill : undefined} />
          </p>
        </div>
      ))}
      <button
        type="button"
        className="text-button dialogue-hint"
        onClick={toggleTranslation}
        aria-expanded={showTranslation}
      >
        {showTranslation ? '收起中文' : '中文提示'}
      </button>
      {showTranslation && <p className="dialogue-translation">{entry.translation}</p>}
    </div>
  );
}

interface LearnProps {
  user: User;
  progress: Progress;
  subject: SubjectId;
  onSelectSubject: (subject: SubjectId) => void;
  onComplete: () => void;
  roundActive: (active: boolean) => void;
}

// Thin dispatcher: English keeps its word engine, while 语文 / 数学 render the
// question practice page. Keeping them apart avoids loading both flows' state.
export function Learn(props: LearnProps) {
  // Switching subjects replaces the whole home body; start the new one at the
  // top instead of leaving the child halfway down the previous page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [props.subject]);
  if (props.subject !== 'english') return <SubjectPractice {...props} subject={props.subject} />;
  return <EnglishLearn {...props} />;
}

function EnglishLearn({ user, progress, onSelectSubject, onComplete, roundActive }: LearnProps) {
  const [bookId, setBookId] = useState(() => findBook(progress.bookId).id);
  const book = findBook(bookId);
  const scope = scopeFor(book);
  const [loadedBook, setLoadedBook] = useState<{ id: string; words: Word[] } | null>(null);
  const [bookError, setBookError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const scopeWords = loadedBook?.id === bookId ? loadedBook.words : [];
  const loadingBook = scopeWords.length === 0 && !bookError;
  const [round, setRound] = useState<RoundWord[] | null>(null);
  const [roundId, setRoundId] = useState('');
  const [roundWords, setRoundWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'study' | 'quiz' | 'feedback' | 'done'>('study');
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [remaining, setRemaining] = useState(15);
  const [quizSeconds, setQuizSeconds] = useState(15);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [revealWord, setRevealWord] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [audioHint, setAudioHint] = useState('');
  const saving = useRef(false);
  const answered = useRef(false);
  const started = useRef(0);
  const [busy, setBusy] = useState(false);
  const [sounds, setSounds] = useState<SoundPreferences>(() => ({
    music: progress.sound?.music !== false,
    effects: progress.sound?.effects !== false,
  }));
  const [leaving, setLeaving] = useState(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const pausedAt = useRef<number | null>(null);
  const startPoints = useRef(0);
  const current = round?.[index];
  const scopeProgress =
    scope === 'general' ? progress.words : (progress.preschoolWords?.[scope] ?? {});
  const mistakes = scopeWords.filter((word) => scopeProgress[word.id]?.needsReview).length;
  const bookLearned = scopeWords.filter((word) => scopeProgress[word.id]?.seen).length;
  const learnedIds = new Set(
    Object.entries(progress.words)
      .filter(([, state]) => state.seen)
      .map(([id]) => id),
  );
  for (const words of Object.values(progress.preschoolWords ?? {})) {
    for (const [id, state] of Object.entries(words)) {
      if (state.seen) learnedIds.add(id);
    }
  }
  const learned = learnedIds.size;
  const growth = growthFor(progress.points);
  const themeCopy = themeCopyFor(user);
  const theme = themeFor(user) ?? 'boy';

  useEffect(() => {
    const previous = readProgress(user.id).bookId;
    if (previous && findBook(previous).id !== previous) {
      void selectBook(user.id, findBook(previous).id);
    }
  }, [user.id]);

  useEffect(() => {
    const controller = new AbortController();
    setBookError('');
    void loadBookWords(findBook(bookId), controller.signal)
      .then((words) => {
        if (!controller.signal.aborted) setLoadedBook({ id: bookId, words });
      })
      .catch(() => {
        if (!controller.signal.aborted) setBookError('词库暂时没加载好，请联网后重试。');
      });
    return () => controller.abort();
  }, [bookId, loadAttempt]);

  function changeBook(id: string) {
    setBookError('');
    setBookId(id);
    void selectBook(user.id, id);
  }

  function changeSound(value: SoundPreferences) {
    setSounds(value);
    gameSound.setPreferences(value);
    void saveSoundPreferences(user.id, value);
  }
  function pauseRound() {
    stopAudio();
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
  function goHome() {
    stopAudio();
    gameSound.stop();
    setLeaving(false);
    setRound(null);
    setAnswers([]);
    setAudioHint('');
    setPicked([]);
    setRevealWord(false);
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

  useEffect(() => {
    if (leaving) leaveDialog.current?.showModal();
    else leaveDialog.current?.close();
  }, [leaving]);
  useEffect(() => {
    if (!round || phase === 'done') return;
    const visibility = () => {
      if (document.hidden) pauseRound();
      else if (!leaving) resumeRound();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [round, phase, leaving]);

  useEffect(
    () => () => {
      stopAudio();
      gameSound.stop();
      roundActive(false);
    },
    [],
  );
  useEffect(() => {
    if (phase !== 'quiz') return;
    const tick = () => {
      if (pausedAt.current !== null) return;
      const seconds = Math.max(0, Math.ceil(quizSeconds - (Date.now() - started.current) / 1000));
      setRemaining(seconds);
      gameSound.setUrgent(seconds <= 5);
      if (!seconds && !answered.current) finish(false, null);
    };
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [phase, index, quizSeconds]);

  function start() {
    if (scopeWords.length < 5) return;
    gameSound.start(sounds);
    pausedAt.current = null;
    const latest = readProgress(user.id);
    startPoints.current = latest.points;
    setRound(makeRound(latest, scopeWords, scope));
    setRoundWords(scopeWords);
    setRoundId(crypto.randomUUID());
    setIndex(0);
    setPhase('study');
    setAnswers([]);
    setAudioHint('');
    setPicked([]);
    setRevealWord(false);
    setShowTranslation(false);
    roundActive(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  async function play() {
    setAudioHint('');
    if (!current) return;
    if (await speak(current.word)) return;
    setAudioHint('音频暂时没播出，请点发音按钮再试一次。');
    // 听音题没有文字提示，音频失败时先把单词亮出来，别让孩子卡住。
    if (current.quiz === 'listen') setRevealWord(true);
  }
  function quiz() {
    if (!current) return;
    const kind = current.quiz;
    setOptions(
      kind === 'dialogue' && current.dialogue
        ? dialogueOptions(current.dialogue, current.word)
        : optionsFor(current.word, roundWords, kind === 'picture' ? 'zh' : 'en'),
    );
    setQuizSeconds(QUIZ_SECONDS[kind]);
    setRemaining(QUIZ_SECONDS[kind]);
    setSelected(null);
    setRevealWord(false);
    setShowTranslation(false);
    if (kind === 'spell') {
      setTiles(spellingTiles(current.word));
      setPicked([]);
    }
    answered.current = false;
    started.current = Date.now();
    setPhase('quiz');
    // A dialogue hides its answer inside the blank; playing the word here would
    // give it away.
    if (kind !== 'dialogue') void play();
  }
  function finish(correct: boolean, id: string | null) {
    answered.current = true;
    setSelected(id);
    setAnswers((old) => [...old, correct]);
    setPhase('feedback');
    stopAudio();
    gameSound.setUrgent(false);
    gameSound.answer(correct);
  }
  function choose(id: string) {
    if (answered.current || phase !== 'quiz' || !current) return;
    finish(id === current.word.id, id);
  }
  function pickLetter(tileIndex: number) {
    if (answered.current || phase !== 'quiz' || !current || current.quiz !== 'spell') return;
    if (picked.includes(tileIndex)) return;
    const next = [...picked, tileIndex];
    setPicked(next);
    if (next.length < current.word.en.length) return;
    // Filling the last slot is the submit action, so there is one less button
    // for a child to hunt for on a phone.
    finish(spellAttempt(tiles, next) === current.word.en.toLowerCase(), null);
  }
  function undoLetter() {
    if (answered.current || phase !== 'quiz' || !picked.length) return;
    setPicked(picked.slice(0, -1));
  }
  async function next() {
    if (!round || saving.current) return;
    if (index < 4) {
      stopAudio();
      gameSound.setUrgent(false);
      setIndex(index + 1);
      setPhase('study');
      setAudioHint('');
      setShowTranslation(false);
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      await completeRound(user.id, roundId, round, answers, scope);
      stopAudio();
      gameSound.finish();
      setPhase('done');
      roundActive(false);
      onComplete();
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  if (!round)
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <span className="eyebrow">MY WORD GARDEN</span>
            <h1>
              你好，{user.display_name} <span className="heading-wave">👋</span>
            </h1>
            <p>
              今天也让英语，长大一点点。 <span className="theme-badge">{themeCopy.badge}</span>
            </p>
          </div>
          <span className="date-tag">慢慢学，天天长</span>
        </div>
        <SubjectSwitch value="english" onChange={onSelectSubject} />
        <BookPicker
          selected={book}
          onChange={changeBook}
          learned={bookLearned}
          loading={loadingBook}
          error={bookError}
          retry={() => setLoadAttempt((value) => value + 1)}
        />
        <section className="hero-card">
          <div className="hero-copy">
            <span className="pill pale">🌱 {book.name} · 每轮 5 项</span>
            <h2>
              种下一个单词，
              <br />
              收获一个新世界。
            </h2>
            <p>
              {mistakes
                ? `还有 ${mistakes} 个小芽需要照顾，这一轮先来巩固它们。`
                : '听一听、认一认，和单词交个新朋友。'}
            </p>
            <button className="button primary" onClick={start} disabled={scopeWords.length < 5}>
              开始一轮学习
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
          <div className={`hero-art hero-art--${theme}`}>
            <span className="hero-halo" aria-hidden="true" />
            <ArtImage
              src={THEME_ART[theme].hero}
              alt=""
              className="hero-character"
              fallback={theme === 'girl' ? '🌷' : '🌲'}
              eager
              width={720}
              height={1080}
            />
            <span className="hero-float hero-float--1" aria-hidden="true" />
            <span className="hero-float hero-float--2" aria-hidden="true" />
            <span className="hero-float hero-float--3" aria-hidden="true" />
          </div>
        </section>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon green">
              <Icon name="leaf" />
            </span>
            <div>
              <strong>
                {learned}
                <small> 个</small>
              </strong>
              <span>认识的单词</span>
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
              <Icon name="check" />
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
          <h2>下一轮的小伙伴</h2>
          <span>
            {scopeWords.length
              ? `${
                  book.mode === 'preschool'
                    ? '先听音再认意思'
                    : book.mode === 'theme'
                      ? '同一主题，四种题型'
                      : '只从当前词库选词'
                } · ${book.count} 项`
              : '词库加载后展示'}
          </span>
        </div>
        <div className="preview-grid">
          {makeRound(progress, scopeWords, scope).map(({ word, wasMistake }, i) => (
            <div className={`preview-card tone-${i}`} key={word.id}>
              <span className="preview-number">0{i + 1}</span>
              <WordPicture word={word} />
              <h3>{word.en}</h3>
              <span>{wasMistake ? '再见面，记更牢' : word.category}</span>
            </div>
          ))}
        </div>
        <div className="garden-tip">
          <ArtImage src={THEME_ART[theme].note} alt="" className="garden-tip-art" fallback="💡" />
          <p>
            <strong>小芽悄悄话</strong>答错也没关系，它会回到“补错池”。下次答对，还能额外获得 5
            积分！
          </p>
        </div>
        <p className="local-note">
          {book.mode === 'preschool'
            ? '幼小衔接为自主启蒙路线 · 成长记录保存在这台设备 · 完成一轮后同步积分'
            : book.mode === 'theme'
              ? '主题包为自主整理的主题词集 · 词条来自 600 词词库 · 完成一轮后同步积分'
              : '课标参考词库为自主分级 · 成长记录保存在这台设备 · 完成一轮后同步积分'}
        </p>
      </div>
    );

  if (phase === 'done') {
    const correct = answers.filter(Boolean).length;
    const repaired = round.filter((word, i) => word.wasMistake && answers[i]).length;
    const grown = growthFor(progress.points);
    const stageUp = grown.index > growthFor(startPoints.current).index;
    return (
      <div className="result-card page-enter">
        <div className="result-medal">
          <ArtImage src={CELEBRATE_ART} alt="" className="result-medal-art" fallback="🌟" eager />
        </div>
        <span className="eyebrow">{book.name} · 本轮成长</span>
        <h1>{correct === 5 ? '五颗小芽，都发芽啦！' : '又向前走了一小步！'}</h1>
        <p>认真完成一轮，就是值得庆祝的成长。</p>
        <div className="result-stats">
          <div>
            <strong>
              {correct}
              <small> / 5</small>
            </strong>
            <span>答对单词</span>
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
            你补对了 {repaired} 个词，额外获得 {repaired * 5} 积分！
          </p>
        )}
        {correct < 5 && (
          <p className="muted">没记牢的 {5 - correct} 个词，下一轮会优先陪你练习。</p>
        )}
        <div className="result-words">
          {round.map(({ word }, i) => (
            <span key={word.id} className={answers[i] ? 'word-good' : 'word-retry'}>
              {word.emoji} {word.en} <Icon name={answers[i] ? 'check' : 'refresh'} size={14} />
            </span>
          ))}
        </div>
        <div className="result-buttons">
          <button className="button primary" onClick={start}>
            再种 5 个词
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
  const kind = current.quiz;
  // Three columns cannot hold a long English word on a phone without splitting
  // it mid-word, so those rounds give each option a full-width row instead.
  const stackedOptions = kind !== 'picture' && options.some((option) => option.en.length >= 7);
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
        aria-labelledby="leave-title"
        aria-describedby="leave-description"
        onCancel={(event) => {
          event.preventDefault();
          continueLearning();
        }}
      >
        <span className="leave-illustration" aria-hidden="true">
          🌱
        </span>
        <h2 id="leave-title">要先回到花园吗？</h2>
        <p id="leave-description">
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
        <span className="eyebrow">
          {phase === 'study' ? 'MEET A NEW FRIEND' : 'A LITTLE CHALLENGE'}
        </span>
        <span>
          {book.name} · {index + 1} / 5
        </span>
      </div>
      <div className="round-steps" aria-label={`进度 ${index + 1}/5`}>
        {round.map((_, i) => (
          <span key={i} className={i <= index ? 'filled' : ''} />
        ))}
      </div>
      {phase === 'study' ? (
        <section className="study-card">
          <span className="pill pale">
            {current.wasMistake
              ? '🌱 补错小任务 · 答对额外 +5 分'
              : current.isNew
                ? '✨ 认识新朋友'
                : '🌿 再复习一次'}
          </span>
          <WordPicture word={current.word} />
          <h1>{current.word.en}</h1>
          {current.word.phonetic && <span className="phonetic">{current.word.phonetic}</span>}
          <h2>{current.word.zh}</h2>
          <button className="sound-button" onClick={() => void play()}>
            <Icon name="sound" />
            听一听发音
          </button>
          {audioHint && (
            <p className="muted" role="status">
              {audioHint}
            </p>
          )}
          <button className="button primary study-next" onClick={quiz}>
            记住啦，来挑战
            <Icon name="arrow" size={20} />
          </button>
        </section>
      ) : (
        <section className={`quiz-card quiz-${kind}`} data-quiz={kind}>
          <div className="quiz-title">
            <h1>{quizPrompt(kind, phase === 'feedback' ? 'feedback' : 'quiz', correct)}</h1>
            <span
              className={`timer ${remaining <= 5 ? 'urgent' : ''}`}
              aria-label={`剩余 ${remaining} 秒`}
            >
              {remaining}s
            </span>
          </div>
          <div className="quiz-stage">
            {kind === 'picture' && (
              <>
                <button
                  className="quiz-sound"
                  onClick={() => void play()}
                  aria-label="再听一次发音"
                >
                  <Icon name="sound" size={32} />
                  <span>再听一次</span>
                </button>
                <p className="quiz-word">{current.word.en}</p>
              </>
            )}
            {kind === 'reverse' && (
              <>
                <WordPicture word={current.word} />
                <p className="quiz-word quiz-word--zh">{current.word.zh}</p>
                <button
                  className="quiz-sound quiz-sound--compact"
                  onClick={() => void play()}
                  aria-label="再听一次发音"
                >
                  <Icon name="sound" size={24} />
                  <span>听一听</span>
                </button>
              </>
            )}
            {kind === 'listen' && (
              <>
                <button
                  className="quiz-sound"
                  onClick={() => void play()}
                  aria-label="再听一次发音"
                >
                  <Icon name="sound" size={32} />
                  <span>再听一次</span>
                </button>
                {revealWord ? (
                  <p className="quiz-word">{current.word.en}</p>
                ) : (
                  <p className="quiz-word quiz-word--waiting" aria-label="单词先藏起来，用耳朵听">
                    · · ·
                  </p>
                )}
              </>
            )}
            {kind === 'spell' && (
              <>
                <WordPicture word={current.word} />
                <p className="quiz-word quiz-word--zh">{current.word.zh}</p>
              </>
            )}
            {kind === 'dialogue' && current.dialogue && (
              <DialogueCard
                entry={current.dialogue}
                fill={phase === 'feedback' ? current.word.en : undefined}
                showTranslation={showTranslation}
                toggleTranslation={() => setShowTranslation((value) => !value)}
              />
            )}
          </div>
          <p className="muted">{quizHint(kind)}</p>
          {audioHint && (
            <p className="muted" role="status">
              {audioHint}
            </p>
          )}
          {kind === 'spell' ? (
            <div className="spell-board">
              <div
                className="spell-slots"
                aria-label={`这个单词有 ${current.word.en.length} 个字母`}
              >
                {Array.from({ length: current.word.en.length }, (_, slot) => (
                  <span key={slot} className={picked[slot] === undefined ? '' : 'filled'}>
                    {picked[slot] === undefined ? '' : tiles[picked[slot]].letter}
                  </span>
                ))}
              </div>
              <div className="spell-tiles">
                {tiles.map((tile, tileIndex) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => pickLetter(tileIndex)}
                    disabled={phase === 'feedback' || picked.includes(tileIndex)}
                    className={picked.includes(tileIndex) ? 'used' : ''}
                    aria-label={`字母 ${tile.letter}`}
                  >
                    {tile.letter}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="text-button spell-undo"
                onClick={undoLetter}
                disabled={phase === 'feedback' || !picked.length}
              >
                退一格
              </button>
            </div>
          ) : (
            <div
              className={`answer-grid ${kind === 'picture' ? '' : 'answer-grid--en'}${
                stackedOptions ? ' answer-grid--stacked' : ''
              }`}
            >
              {options.map((word) => (
                <button
                  key={word.id}
                  onClick={() => choose(word.id)}
                  disabled={phase === 'feedback'}
                  className={`answer-option ${phase === 'feedback' && word.id === current.word.id ? 'correct' : ''} ${phase === 'feedback' && selected === word.id && !correct ? 'incorrect' : ''}`}
                  aria-label={`选择${kind === 'picture' ? word.zh : word.en}`}
                >
                  {kind === 'picture' && (word.image || word.emoji) && <WordPicture word={word} />}
                  <span>{kind === 'picture' ? word.zh : word.en}</span>
                </button>
              ))}
            </div>
          )}
          {phase === 'feedback' && (
            <div className={`feedback ${correct ? 'good' : 'retry'}`} role="status">
              <RoundSprout answers={answers} />
              <div>
                <strong>
                  {correct ? (
                    '✓ 小芽长高了一点！'
                  ) : (
                    <>
                      {current.word.emoji ? `${current.word.emoji} ` : ''}
                      {current.word.en} 是「{current.word.zh}」
                    </>
                  )}
                </strong>
                <p>
                  {correct
                    ? `+${current.wasMistake ? 15 : 10} 积分${current.wasMistake ? '，补错成功！' : '，继续加油！'}`
                    : '已经放进补错池，下次再来试试。'}
                </p>
              </div>
              <button className="button primary" onClick={() => void next()} disabled={busy}>
                {busy ? '正在保存…' : index === 4 ? '收获本轮成长' : '下一个单词'}
                <Icon name="arrow" size={18} />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
