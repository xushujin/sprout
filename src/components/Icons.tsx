import type { ReactNode } from 'react';

type Name =
  | 'sprout'
  | 'book'
  | 'cup'
  | 'arrow'
  | 'sound'
  | 'music'
  | 'home'
  | 'check'
  | 'close'
  | 'logout'
  | 'shield'
  | 'cloud'
  | 'star'
  | 'refresh'
  | 'leaf';
const paths: Record<Name, ReactNode> = {
  sprout: (
    <>
      <path d="M12 21v-9M12 15C3 16 2 9 3 4c7 0 11 4 9 11ZM12 11C11 4 16 2 22 3c0 7-4 10-10 8Z" />
    </>
  ),
  book: (
    <>
      <path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z" />
    </>
  ),
  cup: (
    <>
      <path d="M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H3v3a4 4 0 0 0 5 4M17 5h4v3a4 4 0 0 1-5 4M12 14v6M8 21h8" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  music: (
    <>
      <path d="M9 18V5l12-3v13M9 9l12-3" />
      <ellipse cx="6" cy="18" rx="3" ry="3" />
      <ellipse cx="18" cy="15" rx="3" ry="3" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z" />
    </>
  ),
  sound: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: (
    <>
      <path d="M10 3H4v18h6M10 12h12m-4-4 4 4-4 4" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18H5a4 4 0 0 1-1-8 7 7 0 0 1 14-2 5 5 0 0 1 1 10h-2M12 21V11m-4 4 4-4 4 4" />
    </>
  ),
  star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />,
  refresh: (
    <>
      <path d="M20 10a8 8 0 0 0-14-5L3 8M3 3v5h5M4 14a8 8 0 0 0 14 5l3-3m0 5v-5h-5" />
    </>
  ),
  leaf: (
    <>
      <path d="M4 20C-2 8 7 2 21 3c1 13-5 21-17 17ZM4 20 16 8" />
    </>
  ),
};
export function Icon({
  name,
  size = 22,
  className,
}: {
  name: Name;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

export function SproutArt({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 300"
      className={className}
      role="img"
      aria-label="微笑的小芽正在花盆里长大"
    >
      <ellipse cx="182" cy="268" rx="106" ry="13" fill="#476644" opacity=".09" />
      <circle cx="182" cy="139" r="107" fill="#e6edc8" />
      <path d="M181 195v-84" fill="none" stroke="#397c55" strokeWidth="11" strokeLinecap="round" />
      <path d="M181 151c-52 8-74-21-70-58 47-6 80 17 70 58Z" fill="#77a76c" />
      <path d="M182 123c-7-47 26-75 70-73 5 47-24 80-70 73Z" fill="#43835b" />
      <path
        d="m184 121 41-41m-45 66-40-32"
        stroke="#b6d894"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="m125 190 13 61c3 13 84 13 88 0l13-61" fill="#d69a71" />
      <rect x="116" y="179" width="132" height="26" rx="10" fill="#e8ae83" />
      <ellipse cx="162" cy="223" rx="3" ry="4" fill="#5c4633" />
      <ellipse cx="200" cy="223" rx="3" ry="4" fill="#5c4633" />
      <path
        d="M174 230q7 9 14 0"
        stroke="#5c4633"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="154" cy="231" rx="8" ry="4" fill="#eeaa8d" />
      <ellipse cx="209" cy="231" rx="8" ry="4" fill="#eeaa8d" />
      <path
        d="m68 91 4 10 10 4-10 4-4 10-4-10-10-4 10-4ZM278 162l4 8 8 4-8 4-4 8-4-8-8-4 8-4Z"
        fill="#cbae65"
      />
      <circle cx="83" cy="206" r="4" fill="#b3c8a4" />
      <circle cx="273" cy="103" r="5" fill="#b3c8a4" />
    </svg>
  );
}
