"use client"

// Kartu angka showcase. Dibuat client component karena dua hal:
//  1. angka menghitung naik dari 0 saat kartu masuk layar,
//  2. kartu diberi atribut data-terlihat agar ilustrasi di dalamnya (titik, segmen) menyala bergantian.
// Keduanya memakai IntersectionObserver dan memanipulasi DOM langsung (tanpa setState),
// jadi tidak ada render ulang dan aman dari aturan react-hooks/set-state-in-effect.
import { useEffect, useRef, type ReactNode } from "react"

const DURASI = 1400 // ms
const format = (n: number) => new Intl.NumberFormat("id-ID").format(n)

type Props = {
  nilai: number
  label: string
  // Bagian atas kartu (ikon / ilustrasi)
  atas?: ReactNode
  // Latar di belakang isi kartu (mis. gelombang air)
  latar?: ReactNode
  // true = angka dan kartu versi besar (kartu utama)
  besar?: boolean
  className?: string
}

export function KartuStat({ nilai, label, atas, latar, besar = false, className = "" }: Props) {
  const kartu = useRef<HTMLDivElement>(null)
  const angka = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const k = kartu.current
    const a = angka.current
    if (!k || !a) return

    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0

    const pengamat = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        pengamat.disconnect()
        // Tandai terlihat: memicu transisi ilustrasi lewat "group-data-[terlihat]:"
        k.setAttribute("data-terlihat", "")
        if (kurangiGerak) return

        // Hitung naik dengan easing "easeOutCubic": cepat di awal, melambat di akhir
        const mulai = performance.now()
        a.textContent = format(0)
        const langkah = (t: number) => {
          const p = Math.min((t - mulai) / DURASI, 1)
          a.textContent = format(Math.round(nilai * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(langkah)
        }
        raf = requestAnimationFrame(langkah)
      },
      { threshold: 0.3 },
    )
    pengamat.observe(k)

    return () => {
      pengamat.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [nilai])

  return (
    <div
      ref={kartu}
      className={`group relative flex flex-col justify-between gap-8 overflow-hidden rounded-xs border border-border p-6 transition-colors duration-150 hover:border-foreground/30 ${className}`}
    >
      {latar}

      <div className="relative z-10">{atas}</div>

      <div className="relative z-10 flex flex-col gap-2">
        {/* Teks awal = angka akhir, jadi tetap benar di server / tanpa JavaScript */}
        <span
          ref={angka}
          className={`font-medium tracking-tight text-foreground tabular-nums ${
            besar ? "text-6xl lg:text-8xl" : "text-4xl lg:text-5xl"
          }`}
        >
          {format(nilai)}
        </span>
        <span className="text-pretty text-base text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}