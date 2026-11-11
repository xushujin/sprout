import { useEffect, useRef, useState } from 'react';
import type { User } from '../../shared/types';
import type { Word } from '../data/words';
import { findBook, loadBookWords } from '../data/catalog';
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
import { speak, stopAudio } from '../lib/audio';
import { Icon, SproutArt } from '../components/Icons';

export function WordPicture({ word }: { word: Word }) {
  return word.image ? (
    <img src={word.image} alt={word.zh} className="word-image" />
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

export function Learn({
  user,
  progress,
  onComplete,
  roundActive,
}: {
  user: User;
  progress: Progress;
  onComplete: () => void;
  roundActive: (active: boolean) => void;
}) {
  const [bookId, setBookId] = useState(() => findBook(progress.bookId).id);
  const book = findBook(bookId);
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
  const current = round?.[index];
  const mistakes = scopeWords.filter((word) => progress.words[word.id]?.needsReview).length;
  const bookLearned = scopeWords.filter((word) => progress.words[word.id]?.seen).length;
  const learned = Object.values(progress.words).filter((w) => w.seen).length;

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
      const seconds = Math.max(0, Math.ceil(15 - (Date.now() - started.current) / 1000));
      setRemaining(seconds);
      gameSound.setUrgent(seconds <= 5);
      if (!seconds && !answered.current) {
        answered.current = true;
        setSelected(null);
        setAnswers((old) => [...old, false]);
        setPhase('feedback');
        stopAudio();
        gameSound.setUrgent(false);
        gameSound.answer(false);
      }
    };
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [phase, index]);

  function start() {
    if (scopeWords.length < 5) return;
    gameSound.start(sounds);
    pausedAt.current = null;
    setRound(makeRound(readProgress(user.id), scopeWords));
    setRoundWords(scopeWords);
    setRoundId(crypto.randomUUID());
    setIndex(0);
    setPhase('study');
    setAnswers([]);
    setAudioHint('');
    roundActive(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  async function play() {
    setAudioHint('');
    if (current && !(await speak(current.word)))
      setAudioHint('音频暂时没播出，请点发音按钮再试一次。');
  }
  function quiz() {
    if (!current) return;
    setOptions(optionsFor(current.word, roundWords));
    setRemaining(15);
    setSelected(null);
    answered.current = false;
    started.current = Date.now();
    setPhase('quiz');
    void play();
  }
  function choose(id: string) {
    if (answered.current || phase !== 'quiz' || !current) return;
    answered.current = true;
    setSelected(id);
    setAnswers((old) => [...old, id === current.word.id]);
    setPhase('feedback');
    stopAudio();
    gameSound.setUrgent(false);
    gameSound.answer(id === current.word.id);
  }
  async function next() {
    if (!round || saving.current) return;
    if (index < 4) {
      stopAudio();
      gameSound.setUrgent(false);
      setIndex(index + 1);
      setPhase('study');
      setAudioHint('');
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      await completeRound(user.id, roundId, round, answers);
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
            <p>今天也让英语，长大一点点。</p>
          </div>
          <span className="date-tag">慢慢学，天天长</span>
        </div>
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
            <SoundControls value={sounds} onChange={changeSound} />
            <span className="hero-caption">轻松几分钟，进步看得见</span>
          </div>
          <SproutArt className="hero-art" />
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
            {scopeWords.length ? `只从当前词库选词 · ${book.count} 项` : '词库加载后展示'}
          </span>
        </div>
        <div className="preview-grid">
          {makeRound(progress, scopeWords).map(({ word, wasMistake }, i) => (
            <div className={`preview-card tone-${i}`} key={word.id}>
              <span className="preview-number">0{i + 1}</span>
              <WordPicture word={word} />
              <h3>{word.en}</h3>
              <span>{wasMistake ? '再见面，记更牢' : word.category}</span>
            </div>
          ))}
        </div>
        <div className="garden-tip">
          <span>💡</span>
          <p>
            <strong>小芽悄悄话</strong>答错也没关系，它会回到“补错池”。下次答对，还能额外获得 5
            积分！
          </p>
        </div>
        <p className="local-note">
          课标参考词库为自主分级 · 成长记录保存在这台设备 · 完成一轮后同步积分
        </p>
      </div>
    );

  if (phase === 'done') {
    const correct = answers.filter(Boolean).length;
    const repaired = round.filter((word, i) => word.wasMistake && answers[i]).length;
    return (
      <div className="result-card page-enter">
        <div className="result-medal">🌟</div>
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
          <span className="phonetic">{current.word.phonetic}</span>
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
        <section className="quiz-card">
          <div className="quiz-title">
            <h1>
              {phase === 'feedback'
                ? correct
                  ? '答对啦，真棒！'
                  : '没关系，再记住它！'
                : '听一听，选出正确的意思'}
            </h1>
            <span
              className={`timer ${remaining <= 5 ? 'urgent' : ''}`}
              aria-label={`剩余 ${remaining} 秒`}
            >
              {remaining}s
            </span>
          </div>
          <button className="quiz-sound" onClick={() => void play()} aria-label="再听一次发音">
            <Icon name="sound" size={32} />
            <span>再听一次</span>
          </button>
          <p className="quiz-word">{current.word.en}</p>
          <p className="muted">也可以看单词来选择 · 每题 15 秒</p>
          {audioHint && (
            <p className="muted" role="status">
              {audioHint}
            </p>
          )}
          <div className="answer-grid">
            {options.map((word) => (
              <button
                key={word.id}
                onClick={() => choose(word.id)}
                disabled={phase === 'feedback'}
                className={`answer-option ${phase === 'feedback' && word.id === current.word.id ? 'correct' : ''} ${phase === 'feedback' && selected === word.id && !correct ? 'incorrect' : ''}`}
                aria-label={`选择${word.zh}`}
              >
                {(word.image || word.emoji) && <WordPicture word={word} />}
                <span>{word.zh}</span>
              </button>
            ))}
          </div>
          {phase === 'feedback' && (
            <div className={`feedback ${correct ? 'good' : 'retry'}`} role="status">
              <div>
                <strong>
                  {correct
                    ? '✓ 小芽长高了一点！'
                    : `${current.word.emoji} ${current.word.en} 是「${current.word.zh}」`}
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
