import { ArtImage } from './ArtImage';
import { SUBJECT_ART, SUBJECT_ART_FALLBACK } from '../lib/art';
import { SUBJECT_META, type SubjectId } from '../data/question.ts';

const ORDER: SubjectId[] = ['english', 'chinese', 'math'];

export function SubjectSwitch({
  value,
  onChange,
  disabled,
}: {
  value: SubjectId;
  onChange: (subject: SubjectId) => void;
  disabled?: boolean;
}) {
  return (
    <section className="subject-switch" aria-label="选择科目">
      <div className="subject-switch-copy">
        <span className="eyebrow">TODAY&apos;S SUBJECT</span>
        <h2>今天想练哪一科？</h2>
      </div>
      <div className="subject-tabs" role="tablist" aria-label="科目">
        {ORDER.map((id) => {
          const meta = SUBJECT_META[id];
          return (
            <button
              key={id}
              role="tab"
              aria-selected={value === id}
              className={value === id ? 'selected' : ''}
              onClick={() => onChange(id)}
              disabled={disabled}
            >
              <ArtImage
                src={SUBJECT_ART[id]}
                alt=""
                className="subject-art"
                fallback={SUBJECT_ART_FALLBACK[id]}
              />
              <span className="subject-copy">
                <strong>{meta.name}</strong>
                <small>{meta.tagline}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
