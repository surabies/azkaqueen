"use client"

// Impor cadangan lapangan — DUA PINTU TERPISAH, keduanya menuntut periode
// dinyatakan di depan sebelum berkas apa pun dipilih.
//
// Versi lama menerima "lempar apa saja ke sini" lalu menebak periode dan jenis
// dari nama berkas. Layar ini sengaja membalik urutannya: admin menyatakan apa
// yang sedang ia impor, dan server mengadu tiap berkas dengan pernyataan itu.
// Alasan lengkapnya ada di catatan blok
// packages/server/modules/laporan/laporan-harian.router.ts.
import * as React from "react"
import { AlertTriangle, CheckCircle2, FileText, Images, Loader2, Upload } from "lucide-react"
import { kirimForm, ApiError } from "../../lib/api-client"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { formatPeriode } from "@/features/public/lib/format"

const JENIS_FOTO = [
  { id: "stand", label: "Foto stand meter" },
  { id: "segel", label: "Foto segel" },
  { id: "rumah", label: "Foto rumah" },
  { id: "video", label: "Video pembacaan" },
] as const
type JenisFoto = (typeof JENIS_FOTO)[number]["id"]

type Status = "TERSIMPAN" | "DUPLIKAT" | "DILAMPIRKAN" | "TANPA_PENCATATAN" | "GAGAL"
interface HasilBaris {
  index: number
  jenis: string
  nomorLangganan: string
  periode: number
  status: Status
  pesan?: string
}
interface HasilImpor {
  total: number
  tersimpan: number
  duplikat: number
  dilampirkan: number
  tanpaPencatatan: number
  gagal: number
  hasil: HasilBaris[]
}

/// `<input type="month">` memberi "2026-07"; server menuntut 202607. Dipakai
/// pemilih bulan, bukan kotak teks bebas, supaya periode yang tidak mungkin
/// ada tidak bisa diketik sejak awal — separuh gunanya layar ini adalah
/// menolak periode yang keliru.
function keAngkaPeriode(bulan: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(bulan)
  if (!m) return null
  const angka = Number(`${m[1]}${m[2]}`)
  return Number.isFinite(angka) ? angka : null
}

export function ImporCadanganClient() {
  const [hasil, setHasil] = React.useState<HasilImpor | null>(null)

  return (
    <div className="max-w-2xl space-y-4">
      <Tabs defaultValue="catatan" onValueChange={() => setHasil(null)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catatan">
            <FileText className="size-4" />
            Catatan pencatatan
          </TabsTrigger>
          <TabsTrigger value="foto">
            <Images className="size-4" />
            Foto bukti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catatan" className="mt-4">
          <FormImpor
            judul="Impor catatan pencatatan"
            keterangan="Berkas CSV yang diekspor aplikasi petugas — inilah yang MEMBUAT baris pembacaan. Impor ini dulu, baru fotonya punya induk untuk dilampiri."
            accept=".csv,text/csv,.zip,application/zip"
            path="/laporan-harian/impor/catatan"
            onHasil={setHasil}
          />
        </TabsContent>

        <TabsContent value="foto" className="mt-4">
          <FormImpor
            judul="Impor foto bukti"
            keterangan="Satu jenis per unggahan. Nama berkas harus mengikuti pola periode_tipe_nomor — mis. 202607_rumah_00700800867.jpg — dan harus cocok dengan periode & jenis yang dipilih di atas."
            accept="image/jpeg,image/png,image/webp,video/mp4,.zip,application/zip"
            path="/laporan-harian/impor/foto"
            denganJenis
            onHasil={setHasil}
          />
        </TabsContent>
      </Tabs>

      {hasil && <PanelHasil hasil={hasil} />}
    </div>
  )
}

function FormImpor({
  judul, keterangan, accept, path, denganJenis, onHasil,
}: {
  judul: string
  keterangan: string
  accept: string
  path: string
  denganJenis?: boolean
  onHasil: (h: HasilImpor | null) => void
}) {
  const [bulan, setBulan] = React.useState("")
  const [jenis, setJenis] = React.useState<JenisFoto>("stand")
  const [files, setFiles] = React.useState<File[]>([])
  const [mengirim, setMengirim] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const periode = keAngkaPeriode(bulan)
  const siap = periode !== null && files.length > 0 && !mengirim

  async function impor() {
    if (periode === null || files.length === 0) return
    setMengirim(true)
    setGalat(null)
    onHasil(null)
    try {
      const form = new FormData()
      form.append("periode", String(periode))
      if (denganJenis) form.append("jenis", jenis)
      for (const f of files) form.append("berkas", f)
      onHasil(await kirimForm<HasilImpor>(path, form))
      // Berkasnya dilepas setelah berhasil supaya unggahan yang sama tidak
      // terkirim dua kali hanya karena tombolnya tersenggol lagi.
      setFiles([])
      if (inputRef.current) inputRef.current.value = ""
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : "Gagal mengimpor.")
    } finally {
      setMengirim(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-base font-semibold">{judul}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{keterangan}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="periode-impor">Periode</Label>
          <Input
            id="periode-impor"
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            {periode !== null ? `${formatPeriode(periode)} — ${periode}` : "Wajib dipilih lebih dulu."}
          </p>
        </div>

        {denganJenis && (
          <div className="grid gap-1.5">
            <Label htmlFor="jenis-impor">Jenis berkas</Label>
            <Select value={jenis} onValueChange={(v) => setJenis(v as JenisFoto)}>
              <SelectTrigger id="jenis-impor" aria-label="Jenis berkas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JENIS_FOTO.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Satu jenis per unggahan.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          disabled={periode === null}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="cursor-pointer"
        />
        <Button onClick={impor} disabled={!siap} className="shrink-0">
          {mengirim ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {mengirim ? "Mengimpor…" : "Impor"}
        </Button>
      </div>

      {files.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {files.length} berkas dipilih{files.length <= 3 ? `: ${files.map((f) => f.name).join(", ")}` : ""}.
        </p>
      )}
      {periode === null && <p className="mt-2 text-xs text-amber-600">Pilih periode lebih dulu — berkas baru bisa dipilih setelahnya.</p>}
      {galat && <p className="mt-3 text-sm text-destructive">{galat}</p>}
    </div>
  )
}

function PanelHasil({ hasil }: { hasil: HasilImpor }) {
  // Yang perlu perhatian: gagal + foto tanpa pencatatan induk. Sisanya cukup
  // diringkas jadi lencana — daftar 300 baris "berhasil" tidak menolong siapa
  // pun, tapi satu baris yang ditolak wajib kelihatan beserta alasannya.
  const bermasalah = hasil.hasil.filter((h) => h.status === "GAGAL" || h.status === "TANPA_PENCATATAN")

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        {hasil.gagal === 0 ? (
          <CheckCircle2 className="size-5 text-emerald-600" />
        ) : (
          <AlertTriangle className="size-5 text-amber-600" />
        )}
        <h3 className="text-base font-semibold">Hasil impor</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">Total {hasil.total}</Badge>
        {hasil.tersimpan > 0 && <Badge className="bg-emerald-600 hover:bg-emerald-600">Pembacaan {hasil.tersimpan}</Badge>}
        {hasil.dilampirkan > 0 && <Badge className="bg-sky-600 hover:bg-sky-600">Foto dilampirkan {hasil.dilampirkan}</Badge>}
        {hasil.duplikat > 0 && <Badge variant="outline">Duplikat {hasil.duplikat}</Badge>}
        {hasil.tanpaPencatatan > 0 && (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            Tanpa pencatatan {hasil.tanpaPencatatan}
          </Badge>
        )}
        {hasil.gagal > 0 && <Badge variant="destructive">Gagal {hasil.gagal}</Badge>}
      </div>

      {bermasalah.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Perlu perhatian:</p>
          <ul className="divide-y rounded-md border text-sm">
            {bermasalah.map((h) => (
              <li key={h.index} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="font-mono shrink-0">
                  {h.nomorLangganan || "?"}
                  <span className="ml-2 text-xs text-muted-foreground">{h.jenis}</span>
                </span>
                <span className="text-right text-muted-foreground">{h.pesan ?? "Gagal."}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
