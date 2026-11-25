import { useState } from 'react';

// Every illustration has a text fallback, so a failed asset never leaves a
// broken-image icon in front of a child (or an empty hero on a slow network).
export function ArtImage({
  src,
  alt,
  className = '',
  fallback = '',
  eager = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  eager?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`${className} art-fallback`.trim()} aria-hidden="true">
        {fallback}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
