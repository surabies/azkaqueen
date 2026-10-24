// Tiga ilustrasi animasi untuk kartu fitur (padanan visual di nextjs.org).
// Semuanya dekoratif (aria-hidden dipasang oleh kartu pembungkus) dan memakai token tema shadcn:
//   --border, --muted, --muted-foreground, --background, --primary
// Animasi memakai CSS keyframes di <style> masing-masing ilustrasi (prefix "fv-"),
// dan otomatis berhenti untuk pengguna yang memilih "kurangi gerakan".

// Aturan bersama: matikan animasi jika prefers-reduced-motion
const REDUCED = "@media (prefers-reduced-motion: reduce){.fv-a{animation:none!important}}"

/* ------------------------------------------------------------------ */
/* 1. Cek Tagihan — rekening air dengan dial meter yang terisi         */
/* ------------------------------------------------------------------ */
export function VisualTagihan() {
  return (
    // Pembungkus sama dengan di Next.js: grid tengah, padding 16px, rasio 322:246, maks 320px
    <div className="grid size-full place-items-center p-4">
      <div className="aspect-322/246 w-full max-w-[320px]">
        <svg viewBox="0 0 320 244" fill="none" className="block size-full">
          <style>{`
            @keyframes fv-isi { 0%{stroke-dashoffset:100} 55%{stroke-dashoffset:28} 100%{stroke-dashoffset:100} }
            @keyframes fv-denyut { 0%,100%{opacity:.4} 50%{opacity:1} }
            @keyframes fv-gulir { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
            .fv-isi{animation:fv-isi 4s ease-in-out infinite}
            .fv-denyut{animation:fv-denyut 2.4s ease-in-out infinite}
            .fv-gulir{animation:fv-gulir 2.4s ease-in-out infinite}
            ${REDUCED}
          `}</style>

          {/* Kartu rekening */}
          <rect x="20" y="14" width="280" height="216" rx="12" fill="var(--muted)" />
          <rect x="20.5" y="14.5" width="279" height="215" rx="11.5" stroke="var(--muted-foreground)" strokeOpacity="0.5" />

          {/* Kepala kartu: ikon, judul, lencana status */}
          <circle cx="42" cy="36" r="8" fill="var(--border)" />
          <rect x="58" y="32" width="60" height="8" rx="4" fill="var(--border)" />
          <rect x="232" y="30" width="52" height="12" rx="6" fill="var(--primary)" fillOpacity="0.18" />
          <path d="M20 56H300" stroke="var(--border)" />

          {/* Dial meter: jalur abu + busur biru yang terisi dan kosong berulang */}
          <circle cx="92" cy="120" r="38" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="92" cy="120" r="38"
            stroke="var(--primary)" strokeWidth="8" strokeLinecap="round"
            pathLength={100} strokeDasharray="100" strokeDashoffset="100"
            transform="rotate(-90 92 120)"
            className="fv-a fv-isi"
          />
          <rect x="74" y="114" width="36" height="12" rx="3" fill="var(--muted-foreground)" fillOpacity="0.35" />

          {/* Baris rincian tagihan (berdenyut bergantian) */}
          {[
            { y: 78, w: 110 },
            { y: 96, w: 84 },
            { y: 114, w: 110 },
            { y: 132, w: 70 },
          ].map((b, i) => (
            <rect
              key={b.y} x="160" y={b.y} width={b.w} height="8" rx="4" fill="var(--border)"
              className="fv-a fv-denyut" style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}

          {/* Angka meter: 5 kotak digit, digit terakhir "berputar" */}
          {[34, 58, 82, 106, 130].map((x, i) => (
            <g key={x}>
              <rect x={x} y="176" width="20" height="34" rx="4" fill="var(--background)" stroke="var(--border)" />
              <rect
                x={x + 6} y="187" width="8" height="12" rx="2" fill="var(--muted-foreground)" fillOpacity="0.5"
                className={i === 4 ? "fv-a fv-gulir" : undefined}
              />
            </g>
          ))}

          {/* Total tagihan */}
          <rect x="160" y="176" width="124" height="34" rx="6" fill="var(--primary)" fillOpacity="0.12" stroke="var(--primary)" strokeOpacity="0.4" />
          <rect x="172" y="189" width="64" height="8" rx="4" fill="var(--primary)" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Pantau Status — kartu "jendela" dengan konten yang mengalir masuk */
/* ------------------------------------------------------------------ */
// Garis grid latar: 12 garis vertikal + 12 horizontal, jarak sama (sesuai SVG asli)
const GARIS_V = Array.from({ length: 12 }, (_, i) => 31 + i * 32.909)
const GARIS_H = Array.from({ length: 12 }, (_, i) => 0.5 + i * 32.818)

// Blok konten di dalam kartu: [x, y, tinggi]
const BLOK: [number, number, number][] = [
  [135.916, 130.489, 35.708],
  [242.399, 130.489, 70.708],
  [135.916, 173.199, 65.708],
  [242.399, 208.199, 88.416],
  [135.916, 245.909, 50.708],
]

// Jalur kabel yang mengarah ke kartu, tiap jalur membawa satu "denyut" biru
const JALUR: { d: string; w: number; delay: number }[] = [
  { d: "M0 33.5H30C30.5523 33.5 31 33.9477 31 34.5V98C31 98.5523 31.4477 99 32 99H63C63.5523 99 64 98.5523 64 98V78C64 70.8203 69.8203 65 77 65H310", w: 1.774, delay: 0 },
  { d: "M393 0.5V131C393 131.552 392.552 132 392 132H361C360.448 132 360 132.448 360 133V284C360 291.18 354.18 297 347 297H254.5", w: 1, delay: 0.7 },
  { d: "M0 328.5H30C30.5523 328.5 31 328.052 31 327.5V264C31 263.448 31.4499 263 32.0022 263C43.9398 263 51.0602 263 62.9978 263C63.5501 263 64 263.448 64 264V284C64 291.18 69.8203 297 77 297H262", w: 1.774, delay: 1.4 },
  { d: "M424 197.5L394 197.5C393.448 197.5 393 197.948 393 198.5L393 229.5C393 230.052 392.552 230.5 392 230.5L361 230.5C360.448 230.5 360 230.948 360 231.5L360 284C360 291.18 354.18 297 347 297L172.5 297", w: 1.9975, delay: 2.1 },
]

export function VisualStatus() {
  return (
    // Di Next.js: kotak relatif, SVG diletakkan absolute di tengah vertikal
    <div className="relative size-full">
      <svg viewBox="0 0 424 362" fill="none" className="absolute top-1/2 w-full -translate-y-1/2">
        <style>{`
          @keyframes fv-alir { 0%{stroke-dashoffset:.22} 100%{stroke-dashoffset:-1} }
          @keyframes fv-masuk { 0%{opacity:0;transform:translateY(10px)} 12%,80%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(0)} }
          .fv-alir{animation:fv-alir 3s linear infinite}
          .fv-masuk{animation:fv-masuk 6s ease-out infinite}
          ${REDUCED}
        `}</style>

        {/* Grid latar */}
        {GARIS_V.map((x) => (
          <path key={`v${x}`} d={`M${x.toFixed(3)} 10.5V351.5`} stroke="var(--border)" />
        ))}
        {GARIS_H.map((y) => (
          <path key={`h${y}`} d={`M424 ${y.toFixed(3)}L0 ${y.toFixed(3)}`} stroke="var(--border)" />
        ))}

        {/* Isi kartu (dipotong mengikuti sudut membulat) */}
        <g clipPath="url(#fv-klip)">
          <rect x="64" y="65.5" width="296" height="231" rx="12" fill="var(--muted)" />
          {/* Tiga titik jendela */}
          <circle cx="78.026" cy="79.3" r="2.8" fill="var(--muted-foreground)" fillOpacity="0.6" />
          <circle cx="86.426" cy="79.3" r="2.8" fill="var(--muted-foreground)" fillOpacity="0.6" />
          <circle cx="94.825" cy="79.3" r="2.8" fill="var(--muted-foreground)" fillOpacity="0.6" />
          <path d="M62.501 90.348H360" stroke="var(--border)" />

          {/* Kepala konten: judul + baris */}
          <rect x="135.916" y="108.15" width="29.242" height="8.299" rx="4.149" fill="var(--border)" />
          <rect x="135.916" y="120.284" width="29.242" height="4.369" rx="2" fill="var(--border)" />
          <rect x="177.106" y="120.284" width="165.771" height="4.369" rx="2" fill="var(--border)" />

          {/* Kolom kiri: avatar + garis-garis teks */}
          <rect x="75.078" y="108.15" width="23.352" height="23.352" rx="11.676" fill="var(--border)" />
          <path d="M86.754 116.189L90.67 122.972H82.838Z" fill="var(--muted-foreground)" />
          {[
            [139.501, 41.846],
            [145.522, 27.322],
            [151.542, 41.846],
            [157.561, 41.846],
            [163.582, 29.404],
          ].map(([y, w]) => (
            <rect key={y} x="75.078" y={y} width={w} height="4.369" rx="2" fill="var(--border)" />
          ))}

          {/* Blok konten yang "mengalir masuk" satu per satu, lalu mengulang */}
          {BLOK.map(([x, y, h], i) => (
            <rect
              key={`${x}-${y}`} x={x} y={y} width="99.484" height={h} rx="2" fill="var(--border)"
              className="fv-a fv-masuk" style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </g>
        <rect x="64" y="65.5" width="296" height="231" rx="12" stroke="var(--muted-foreground)" strokeOpacity="0.6" />

        {/* Denyut biru yang berjalan di sepanjang kabel menuju kartu */}
        {JALUR.map((j) => (
          <path
            key={j.d} d={j.d}
            stroke="var(--primary)" strokeWidth={j.w} strokeLinecap="round"
            pathLength={1} strokeDasharray="0.22 2"
            className="fv-a fv-alir" style={{ animationDelay: `${j.delay}s` }}
          />
        ))}

        <defs>
          <clipPath id="fv-klip">
            <rect x="64" y="65.5" width="296" height="231" rx="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Verifikasi Petugas — simpul jaringan dengan cincin berdenyut     */
/* ------------------------------------------------------------------ */
// Simpul: [cx, cy, beriCincin]. Tiga simpul (atas, kiri-tengah, bawah-tengah) punya cincin animasi.
const SIMPUL: [number, number, boolean][] = [
  [134.239, 28.844, true],
  [186.736, 106.809, false],
  [239.257, 192.189, false],
  [81.742, 106.809, true],
  [28.844, 192.189, false],
  [133.864, 192.189, true],
]

export function VisualJaringan() {
  return (
    <div className="grid size-full place-items-center p-4">
      <svg viewBox="0 0 269 222" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-67">
        <style>{`
          @keyframes fv-baris { to{stroke-dashoffset:-7} }
          @keyframes fv-cincin { to{stroke-dashoffset:-100} }
          .fv-baris{animation:fv-baris 1s linear infinite}
          .fv-cincin{animation:fv-cincin 3s linear infinite}
          ${REDUCED}
        `}</style>

        {/* Garis putus-putus abu (statis) */}
        <path d="M134.054 29.718L222.847 167.84" stroke="var(--muted-foreground)" strokeDasharray="4 3" />
        <path d="M90.399 98.684L38.745 179.036" stroke="var(--muted-foreground)" strokeDasharray="4 3" />

        {/* Garis putus-putus biru: "berjalan" (marching dashes) */}
        <path d="M134.734 29.718L84.017 108.611" stroke="var(--primary)" strokeDasharray="4 3" className="fv-a fv-baris" />
        <path d="M80.546 110.517L134.054 193.752" stroke="var(--primary)" strokeDasharray="4 3" className="fv-a fv-baris" />

        {/* Simpul */}
        {SIMPUL.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="28.344" fill="var(--muted)" stroke="var(--muted-foreground)" strokeOpacity="0.6" />
        ))}

        {/* Cincin biru yang mengitari simpul (seperti komet), berputar terus */}
        {SIMPUL.filter(([, , cincin]) => cincin).map(([cx, cy], i) => (
          <circle
            key={`c${cx}-${cy}`} cx={cx} cy={cy} r="27.844"
            stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.6"
            pathLength={100} strokeDasharray="30 70"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="fv-a fv-cincin" style={{ animationDelay: `${i * -1}s` }}
          />
        ))}
      </svg>
    </div>
  )
}