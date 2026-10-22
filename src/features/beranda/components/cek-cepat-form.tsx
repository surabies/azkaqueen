"use client"

// features/beranda/components/cek-cepat-form.tsx — titik fokus fungsional
// hero: bukan mockup dashboard, tapi input nomor langganan sungguhan yang
// mengantar ke /cek-tagihan dengan nomor sudah terisi.
//
// SENGAJA tidak memanggil API dari sini: pemanggilan tetap terjadi di
// halaman cek-tagihan (dari browser pemakai) supaya rate limit per-IP tetap
// bermakna dan logika verifikasi tidak terduplikasi di dua tempat.
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Cek tagihan dinonaktifkan SEMENTARA (lihat catatan di nav-links.ts) —
// form ditampilkan disabled + kursor "not-allowed", bukan dihapus, supaya
// gampang diaktifkan lagi begitu tabel Tagihan mulai diisi aplikasi sendiri.
const NONAKTIF = true

export function CekCepatForm() {
  const router = useRouter()
  const [nomor, setNomor] = React.useState("")
  const lengkap = nomor.length === 11

  function lanjut(e: React.FormEvent) {
    e.preventDefault()
    if (lengkap && !NONAKTIF) router.push(`/cek-tagihan?nomor=${nomor}`)
  }

  return (
    <div>
      <form
        onSubmit={lanjut}
        title={NONAKTIF ? "Sementara tidak tersedia" : undefined}
        className={"flex w-full max-w-md items-stretch gap-2" + (NONAKTIF ? " cursor-not-allowed" : "")}
      >
        <label htmlFor="cek-cepat" className="sr-only">
          Nomor langganan
        </label>
        <Input
          id="cek-cepat"
          value={nomor}
          onChange={(e) => setNomor(e.target.value.replace(/\D/g, "").slice(0, 11))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Nomor langganan — 11 digit"
          disabled={NONAKTIF}
          className="h-11 flex-1 rounded-xl border-white/10 bg-white/5 font-mono text-sm text-white placeholder:text-slate-500 backdrop-blur-xl disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          disabled={!lengkap || NONAKTIF}
          className="group h-11 rounded-xl bg-linear-to-r from-cyan-400 to-teal-400 px-4 text-tirta hover:from-cyan-300 hover:to-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cek
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>
      {NONAKTIF && <p className="mt-1.5 text-xs text-slate-500">Cek tagihan sementara tidak tersedia.</p>}
    </div>
  )
}
