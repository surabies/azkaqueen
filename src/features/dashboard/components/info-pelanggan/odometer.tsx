// Angka stand meter dalam gaya roda angka meter air: satu kotak per digit.
// Warna tetap (navy) supaya sama dengan lembar cetak/PDF.
export function Odometer({
  label,
  nilai,
  digit = 5,
}: {
  label: string
  nilai: number | null
  digit?: number
}) {
  const teks =
    nilai == null ? null : String(Math.max(0, Math.trunc(nilai))).padStart(digit, "0")

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {teks ? (
        <div
          role="img"
          aria-label={`${label} ${nilai?.toLocaleString("id-ID")}`}
          className="flex gap-0.5"
        >
          {[...teks].map((d, i) => (
            <span
              key={i}
              aria-hidden
              className="flex h-11 w-7 items-center justify-center rounded-[3px] bg-slate-900 font-mono text-xl font-medium tabular-nums text-white ring-1 ring-inset ring-white/10 dark:bg-slate-700"
            >
              {d}
            </span>
          ))}
        </div>
      ) : (
        <span className="flex h-11 items-center text-xl text-muted-foreground">—</span>
      )}
    </div>
  )
}
