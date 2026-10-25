"use client"

// features/dashboard/components/pemetaan-rute/pemetaan-rute-client.tsx —
// PERAKIT halaman Pemetaan Rute: mengatur rute mana dikerjakan petugas mana,
// dan urutannya. PERMANEN: berlaku otomatis tiap periode (dibaca mobile lewat
// GET /laporan-harian/rute-saya) tanpa admin mengatur ulang tiap bulan.
// Satu rute boleh dibagi ke beberapa petugas.
//
// Tata letak: pilih petugas (kiri, DataGrid) → atur rutenya (kanan, seret
// untuk urutkan). Pembagian berkas:
//   panel-petugas.tsx · kolom-petugas-rute.ts   panel kiri
//   panel-rute.tsx · daftar-seret.tsx            panel kanan
//   use-penugasan-rute.ts                        data & aksi panel kanan
//   tambah-rute-dialog.tsx · halaman-urutan-pelanggan.tsx · use-urutan-pelanggan.ts
//   model.ts                                     tipe & pemetaan murni
import * as React from "react"
import { useRouter } from "next/navigation"
import { useKonfirmasi } from "../konfirmasi/use-konfirmasi"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { namaTampil, type BarisRuteSeret, type PencatatBaris } from "./model"
import { PanelPetugas } from "./panel-petugas"
import { PanelRute } from "./panel-rute"
import { RuteTanpaPetugas } from "./rute-tanpa-petugas"
import { DialogAturPosisi } from "./dialog-atur-posisi"
import { TambahRuteDialog } from "./tambah-rute-dialog"
import { usePenugasanRute } from "./use-penugasan-rute"

export function PemetaanRuteClient({ bolehUbah }: { bolehUbah: boolean }) {
  const router = useRouter()
  const [terpilih, setTerpilih] = React.useState<PencatatBaris | null>(null)
  const [segarGrid, setSegarGrid] = React.useState(0)
  const [tambahBuka, setTambahBuka] = React.useState(false)
  const [posisiRute, setPosisiRute] = React.useState<{
    id: string
    kode: string
    posisi: number
  } | null>(null)

  const { minta, dialog } = useKonfirmasi()
  const penugasan = usePenugasanRute(terpilih?.id ?? null, () => setSegarGrid((v) => v + 1))

  React.useEffect(() => {
    if (!penugasan.berubah) return
    const cegahTutup = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", cegahTutup)
    return () => window.removeEventListener("beforeunload", cegahTutup)
  }, [penugasan.berubah])

  function pilihPetugas(petugas: PencatatBaris) {
    if (petugas.id === terpilih?.id) return
    if (
      penugasan.berubah &&
      !window.confirm("Buang draf urutan rute yang belum disimpan?")
    ) {
      return
    }
    penugasan.batalkanUrutan()
    setTerpilih(petugas)
  }

  // Penjaga: melepas rute harus dikonfirmasi, dan kegagalannya tampil di dialog.
  function mintaLepas(rute: BarisRuteSeret) {
    if (!terpilih) return
    const nama = namaTampil(terpilih)
    minta({
      judul: `Lepas rute ${rute.kode}?`,
      deskripsi: (
        <>
          Rute <strong>{rute.kode}</strong> tidak lagi ditugaskan ke <strong>{nama}</strong> dan akan hilang dari
          daftar kerjanya di aplikasi mobile. Rute dan pelanggannya tidak dihapus, dan petugas lain yang
          memegang rute ini tidak terpengaruh.
        </>
      ),
      labelYa: "Lepas rute",
      nada: "bahaya",
      aksi: () => penugasan.lepas(rute.penugasanId),
    })
  }

  return (
    <Tabs defaultValue="pemetaan" className="flex min-h-0 flex-1 flex-col gap-3">
      <TabsList aria-label="Bagian pemetaan rute" className="shrink-0">
        <TabsTrigger value="pemetaan">Pemetaan petugas</TabsTrigger>
        <TabsTrigger value="tanpa-petugas">Rute belum ditugaskan</TabsTrigger>
      </TabsList>
      <TabsContent value="pemetaan" className="mt-0 min-h-0">
        <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          {/* Di layar sempit panel menumpuk; di desktop keduanya berbagi tinggi viewport. */}
          <div className="h-112 min-h-0 lg:h-auto">
            <PanelPetugas terpilihId={terpilih?.id ?? null} refreshKey={segarGrid} onPilih={pilihPetugas} />
          </div>

          <PanelRute
            className="min-h-96 lg:min-h-0"
            petugas={terpilih}
            bolehUbah={bolehUbah}
            memuat={penugasan.memuat}
            galat={penugasan.galat}
            rute={penugasan.rute}
            perubahanUrutan={penugasan.perubahanUrutan}
            berubah={penugasan.berubah}
            totalTarget={penugasan.totalTarget}
            menyusun={penugasan.menyusun}
            onUrut={(ids) => penugasan.urutkan(ids)}
            onAturPosisi={(id, posisi) => {
              const rute = penugasan.rute.find((item) => item.id === id)
              if (rute) setPosisiRute({ id, kode: rute.kode, posisi })
            }}
            onBatalkanUrutan={penugasan.batalkanUrutan}
            onSimpanUrutan={() => void penugasan.simpanUrutan()}
            onTambah={() => setTambahBuka(true)}
            onLepas={mintaLepas}
            onUrutPelanggan={(r) =>
              router.push(
                `/meter/pemetaan/urutan/${encodeURIComponent(r.id)}?kode=${encodeURIComponent(r.kode)}`,
              )
            }
          />
        </div>
      </TabsContent>
      <TabsContent value="tanpa-petugas" className="mt-0 flex min-h-0 flex-1 flex-col">
        <RuteTanpaPetugas
          bolehUbah={bolehUbah}
          refreshKey={segarGrid}
          onBerubah={() => setSegarGrid((v) => v + 1)}
        />
      </TabsContent>

      {tambahBuka && terpilih && (
        <TambahRuteDialog
          namaPencatat={namaTampil(terpilih)}
          ruteTerpakai={penugasan.ruteTerpakai}
          onPilih={penugasan.tugaskan}
          onTutup={() => setTambahBuka(false)}
        />
      )}
      {posisiRute && (
        <DialogAturPosisi
          jenis="rute"
          namaItem={posisiRute.kode}
          posisiSaatIni={posisiRute.posisi}
          jumlah={penugasan.rute.length}
          onTutup={() => setPosisiRute(null)}
          onTerapkan={(posisi) => {
            penugasan.aturPosisi(posisiRute.id, posisi)
            setPosisiRute(null)
          }}
        />
      )}
      {dialog}
    </Tabs>
  )
}
