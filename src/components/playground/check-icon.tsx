// Ikon centang yang sebelumnya di-copy-paste 4x di HTML.
// Dijadikan komponen agar cukup ditulis sekali dan dipakai ulang.
export function CheckIcon() {
  return (
    <svg
      className="h-[1lh] w-5.5 shrink-0"
      viewBox="0 0 22 22"
      fill="none"
      strokeLinecap="square" // di JSX: stroke-linecap -> strokeLinecap (camelCase)
      aria-hidden="true" // ikon dekoratif, disembunyikan dari screen reader
    >
      <circle cx="11" cy="11" r="11" className="fill-sky-400/25" />
      <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25" />
      <path
        d="M8 11.5L10.5 14L14 8"
        className="stroke-sky-800 dark:stroke-sky-300"
      />
    </svg>
  )
}
