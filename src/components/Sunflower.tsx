import { GROWTH_STAGES } from '../lib/growth';

// Illustrations are pre-rendered watercolour assets in public/sunflower.
// The stage index is derived from points elsewhere; this component only maps it to a file.
export function Sunflower({
  stage,
  className = '',
  variant = 'full',
}: {
  stage: number;
  className?: string;
  variant?: 'full' | 'badge';
}) {
  const index = Math.max(0, Math.min(GROWTH_STAGES.length - 1, Math.floor(stage)));
  const name = GROWTH_STAGES[index].name;
  const badge = variant === 'badge';
  return (
    <img
      src={`/sunflower/stage-${index}${badge ? '-badge' : ''}.webp`}
      alt={`向日葵成长阶段：${name}`}
      className={`sunflower ${className}`.trim()}
      width={badge ? 256 : 1024}
      height={badge ? 256 : 1024}
      loading={badge ? 'lazy' : 'eager'}
      decoding="async"
      draggable={false}
    />
  );
}

// A five-question round grows its own mini sprout: every correct answer adds a
// leaf, a wrong answer still raises the stem, and a perfect round opens a flower.
export function RoundSprout({ answers, total = 5 }: { answers: boolean[]; total?: number }) {
  const answered = Math.min(total, answers.length);
  const correct = answers.filter(Boolean).length;
  const stemTop = 44 - (32 * answered) / total;
  const flowered = answered === total && correct === total;
  return (
    <svg
      viewBox="0 0 48 48"
      className="round-sprout"
      role="img"
      aria-label={`本轮已答对 ${correct} 题`}
    >
      <ellipse cx="24" cy="45" rx="10" ry="2.5" fill="#5F5E5A" />
      {answered > 0 && (
        <path
          d={`M24 44V${stemTop}`}
          stroke="#639922"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {answers.map((ok, i) => {
        if (!ok) return null;
        const y = 44 - (32 * (i + 0.6)) / total;
        const left = i % 2 === 0;
        return (
          <path
            key={i}
            className="round-sprout-leaf"
            d={left ? `M24 ${y}q-7-1-8-7 6-1 8 7Z` : `M24 ${y}q7-1 8-7-6-1-8 7Z`}
            fill={left ? '#97C459' : '#639922'}
          />
        );
      })}
      {answered > 0 && !flowered && <path d={`M24 ${stemTop}q-3-2-2-5 3 1 2 5Z`} fill="#97C459" />}
      {flowered && (
        <g transform="translate(24 9)">
          {Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx={0} cy={-4} r={2.6} fill="#EF9F27" transform={`rotate(${i * 72})`} />
          ))}
          <circle cx={0} cy={0} r={3.2} fill="#854F0B" />
        </g>
      )}
    </svg>
  );
}
