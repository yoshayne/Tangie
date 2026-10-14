/** Simple brand quill, used as a placeholder where a photo has not been supplied yet. */
export function QuillIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M44 4C30 12 22 24 24 40c1 6 3 10 6 14l2-1c-2-8-1-18 4-26 3-5 7-9 11-12-3 1-8 5-11 9 2-7 6-13 10-20z" />
      <path d="M6 44c8-8 18-12 30-12-8 2-15 6-20 12 5-3 11-5 18-5-9 2-17 6-24 14z" />
    </svg>
  );
}
