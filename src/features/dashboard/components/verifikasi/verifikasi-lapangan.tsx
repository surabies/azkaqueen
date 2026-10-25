"use client";

// features/dashboard/components/verifikasi/verifikasi-lapangan.tsx —
// halaman verifikasi laporan petugas lapangan (master-detail): panel detail
// murni penampil (kiri, terbuka di ukuran minimum) + kartu ringkasan dan
// tabel laporan (kanan).
//
// SELURUH AKSI lewat MENU KLIK KANAN pada baris: Verifikasi V1 (modal),
// Validasi V2 dan Approve final V3, Cek ulang (modal alasan), dan Batalkan
// tahap terakhir (unverify). Pembacaan resmi baru dibuat saat V3.
import * as React from "react";
import {
  ArrowTurnBackwardIcon,
  FileVerifiedIcon,
  RotateLeft01Icon,
  SecurityCheckIcon,
  TaskDone01Icon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ambilSatu, ambilList, kirimJson, ApiError } from "../../lib/api-client";
import type { StatsVerifikasi, RingLaporanHarian } from "./tipe";
import { tahapLaporanHarian } from "./tipe";
import { RingkasanVerifikasi } from "./ringkasan-verifikasi";
import { PanelTabel } from "./panel-tabel";
import { PanelKosong } from "./panel-bagian";
import { PanelLapangan, type AksiLapangan } from "./panel-lapangan";
import { MenuKonteks, type AksiKonteks } from "./menu-konteks";

// Cermin ROLE_GROUPS (server/middleware/rbac.ts). Server tetap penjaga aslinya;
// ini hanya menentukan item menu mana yang aktif.
const SUPERVISOR_UP = new Set(["SUPER_ADMIN", "DIREKSI", "SENIOR_MANAGER", "MANAGER", "SUPERVISOR"]);
const MANAGEMENT_UP = new Set(["SUPER_ADMIN", "DIREKSI", "SENIOR_MANAGER", "MANAGER"]);
const SENIOR_UP = new Set(["SUPER_ADMIN", "DIREKSI", "SENIOR_MANAGER"]);

/** Bentuk baris grid /laporan-harian yang dibaca kolom & menu konteks. */
type BarisLaporan = RingLaporanHarian & {
  id?: string;
  nomorLangganan?: string;
  namaPelanggan?: string | null;
  alamatPelanggan?: string | null;
  standAwal?: number;
  standAkhir?: number;
  standAkhirRevisi?: number | null;
  pemakaian?: number;
  pemakaianTagihVerif?: number | null;
  pemakaianLalu?: number | null;
  persentase?: number | null;
  nomorMeter?: string | null;
  tanggalCatat?: string | null;
  pelanggan?: {
    id: string;
    nama: string;
    alamat?: string | null;
    tarifGolongan?: { kodeAsli: string } | null;
    rute?: { kode: string } | null;
    zona?: { kode: string; wilayahSeksi?: { kode: string } | null } | null;
  } | null;
  pencatat?: { id: string; namaLapangan: string } | null;
  pembacaan?: { id: string; standAkhir: number } | null;
  verif1By?: { name: string | null } | null;
  verif2By?: { name: string | null } | null;
  verif3By?: { name: string | null } | null;
  verifiedBy?: { name: string | null } | null;
};

export function VerifikasiLapangan({ role }: { role: string }) {
  const bisaV1 = SUPERVISOR_UP.has(role);
  const bisaV2 = MANAGEMENT_UP.has(role);
  const bisaV3 = SENIOR_UP.has(role);

  // undefined = belum init (diisi periode terbaru yang punya data).
  // null = pengguna memilih "Semua periode".
  const [periode, setPeriode] = React.useState<number | null | undefined>(undefined);
  const [stats, setStats] = React.useState<StatsVerifikasi | null>(null);
  const [galatStats, setGalatStats] = React.useState<string | null>(null);
  const [idTerpilih, setIdTerpilih] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  // Tab aktif diangkat ke sini: baris "belum dibaca" adalah DaftarCatat, bukan
  // laporan, jadi id-nya TIDAK ADA di /laporan-harian/:id.
  const [tab, setTab] = React.useState<"laporan" | "belum">("laporan");
  const [ringkasanTerbuka, setRingkasanTerbuka] = React.useState(true);

  const [menu, setMenu] = React.useState<{
    posisi: { x: number; y: number };
    baris: BarisLaporan;
  } | null>(null);
  const [aksi, setAksi] = React.useState<AksiLapangan | null>(null);
  const [konfirmasi, setKonfirmasi] = React.useState<{
    endpoint: "verif2" | "verif3" | "unverify";
    id: string;
    judul: string;
    deskripsi: string;
    destruktif?: boolean;
  } | null>(null);
  const [mengirim, setMengirim] = React.useState(false);
  const [galatAksi, setGalatAksi] = React.useState<string | null>(null);

  const [pencatats, setPencatats] = React.useState<{ id: string; namaLapangan: string }[]>([]);
  const [rutes, setRutes] = React.useState<{ id: string; kode: string }[]>([]);

  React.useEffect(() => {
    let batal = false;
    ambilList<{ id: string; namaLapangan: string }>("/pencatat", { pageSize: 500 })
      .then(({ rows }) => {
        if (!batal) setPencatats(rows);
      })
      .catch(() => {
        // Filter pencatat opsional — tabel tetap berfungsi tanpa daftarnya.
      });
    ambilList<{ id: string; kode: string }>("/rute", { pageSize: 500 })
      .then(({ rows }) => {
        if (!batal) setRutes(rows);
      })
      .catch(() => {
        // Sama seperti pencatat: saringan opsional.
      });
    return () => {
      batal = true;
    };
  }, []);

  React.useEffect(() => {
    let batal = false;
    ambilSatu<StatsVerifikasi>("/laporan-harian/stats", { periode: periode ?? undefined })
      .then((s) => {
        if (batal) return;
        setStats(s);
        setGalatStats(null);
        setPeriode((lama) => (lama === undefined ? (s.periodes[0] ?? null) : lama));
      })
      .catch((err) => {
        if (!batal)
          setGalatStats(err instanceof ApiError ? err.message : "Gagal memuat ringkasan.");
      });
    return () => {
      batal = true;
    };
  }, [periode, refreshKey]);

  const ambang = stats?.ambangAnomali ?? 50;

  async function jalankanKonfirmasi() {
    if (!konfirmasi) return;
    setMengirim(true);
    setGalatAksi(null);
    try {
      await kirimJson(`/laporan-harian/${konfirmasi.id}/${konfirmasi.endpoint}`, "PATCH", {});
      setKonfirmasi(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setGalatAksi(err instanceof ApiError ? err.message : "Aksi gagal dijalankan.");
    } finally {
      setMengirim(false);
    }
  }

  /// Item menu klik kanan sesuai tahap baris + role pengguna. Item yang belum
  /// waktunya (mis. V2 sebelum V1) disembunyikan; item yang butuh role lebih
  /// tinggi tampil disabled.
  function aksiMenu(baris: BarisLaporan): AksiKonteks[] {
    const id = baris.id;
    if (!id) return [];
    const tahap = tahapLaporanHarian(baris);
    const nama = baris.pelanggan?.nama ?? baris.namaPelanggan ?? baris.nomorLangganan ?? "";
    const daftar: AksiKonteks[] = [];

    if (tahap === "MENUNGGU_V1" || tahap === "DITOLAK") {
      daftar.push({
        label: "Verifikasi V1",
        icon: SecurityCheckIcon,
        pemisah: true,
        disabled: !bisaV1 || !baris.pelanggan,
        onPilih: () => {
          setMenu(null);
          setAksi("v1");
        },
      });
    }
    if (tahap === "MENUNGGU_V2") {
      daftar.push({
        label: "Verifikasi V2",
        icon: TaskDone01Icon,
        pemisah: true,
        disabled: !bisaV2,
        onPilih: () => {
          setMenu(null);
          setAksi("v2");
        },
      });
    }
    if (tahap === "MENUNGGU_V3") {
      daftar.push({
        label: "Verifikasi V3",
        icon: FileVerifiedIcon,
        pemisah: true,
        disabled: !bisaV3,
        onPilih: () => {
          setMenu(null);
          setAksi("v3");
        },
      });
    }

    if (tahap !== "RESMI" && tahap !== "DITOLAK") {
      daftar.push({
        label: "Cek ulang",
        icon: RotateLeft01Icon,
        disabled: !bisaV1,
        onPilih: () => {
          setMenu(null);
          setAksi("cekulang");
        },
      });
    }

    // Unverifikasi: membatalkan SATU tahap terakhir.
    if (tahap === "RESMI") {
      daftar.push({
        label: "Batalkan V3",
        icon: ArrowTurnBackwardIcon,
        pemisah: true,
        destruktif: true,
        disabled: !bisaV3,
        onPilih: () => {
          setMenu(null);
          setGalatAksi(null);
          setKonfirmasi({
            endpoint: "unverify",
            id,
            destruktif: true,
            judul: "Batalkan approve final?",
            deskripsi: baris.pembacaanId
              ? `PembacaanMeter resmi milik ${nama} dihapus dan laporan kembali ke tahap menunggu V3. Server menolak bila pembacaan sudah dipakai tagihan.`
              : `Persetujuan V3 untuk laporan ${nama} dibatalkan. Hasil resmi yang kini berasal dari jalur lain tetap dipertahankan.`,
          });
        },
      });
    } else if (tahap === "MENUNGGU_V3") {
      daftar.push({
        label: "Batalkan V2",
        icon: ArrowTurnBackwardIcon,
        destruktif: true,
        disabled: !bisaV2,
        onPilih: () => {
          setMenu(null);
          setGalatAksi(null);
          setKonfirmasi({
            endpoint: "unverify",
            id,
            destruktif: true,
            judul: "Batalkan V2?",
            deskripsi: `Tanda validasi V2 pada laporan ${nama} dihapus; laporan kembali menunggu V2.`,
          });
        },
      });
    } else if (tahap === "MENUNGGU_V2") {
      daftar.push({
        label: "Batalkan V1",
        icon: ArrowTurnBackwardIcon,
        destruktif: true,
        disabled: !bisaV1,
        onPilih: () => {
          setMenu(null);
          setGalatAksi(null);
          setKonfirmasi({
            endpoint: "unverify",
            id,
            destruktif: true,
            judul: "Batalkan V1?",
            deskripsi: `Hasil pemeriksaan V1 pada laporan ${nama} (termasuk revisi stand dan pilihan meter) dihapus; laporan kembali menunggu V1.`,
          });
        },
      });
    } else if (tahap === "DITOLAK") {
      daftar.push({
        label: "Kembalikan ke antrean (batalkan tolak)",
        icon: ArrowTurnBackwardIcon,
        disabled: !bisaV1,
        onPilih: () => {
          setMenu(null);
          setGalatAksi(null);
          setKonfirmasi({
            endpoint: "unverify",
            id,
            judul: "Batalkan penolakan?",
            deskripsi: `Catatan penolakan dihapus dan laporan ${nama} kembali ke antrean menunggu V1.`,
          });
        },
      });
    }

    return daftar;
  }

  return (
    <>
      {/* TATA LETAK: panel detail KIRI (terbuka di ukuran paling kecil —
          defaultSize = minSize), tabel KANAN yang butuh lebar. Tanpa gap dan
          tanpa border luar; satu-satunya garis di antara keduanya adalah
          pemisah yang bisa ditarik. */}
      <div className="h-[calc(100dvh-var(--navbar-h,3.5rem)-6.5rem)] min-h-96">
        <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0 items-stretch">
          <ResizablePanel
            defaultSize="18"
            minSize="18"
            maxSize="45"
            collapsible
            className="flex min-w-0 flex-col"
          >
            {/* Judul DI LUAR wadah bergulir supaya garis atasnya tidak terpotong. */}
            <aside className="bg-card border-border/70 flex h-full min-h-0 flex-col overflow-hidden rounded-lg border">
              <div className="border-border/70 shrink-0 border-b px-4 py-2.5">
                <h2 className="text-center text-sm font-medium">Detail laporan</h2>
              </div>
              <div className="scrollbar-tipis min-h-0 flex-1 overflow-y-auto">
                {/* key: ganti baris = remount panel, state mulai bersih. */}
                {tab === "belum" ? (
                  <PanelKosong
                    icon={ViewOffIcon}
                    pesan="Sambungan ini belum punya setoran, jadi belum ada detail laporan. Tagih pencatatannya ke petugas rute."
                  />
                ) : (
                  <PanelLapangan
                    key={idTerpilih ?? "kosong"}
                    id={idTerpilih}
                    aksi={aksi}
                    ambangAnomali={ambang}
                    onTutupAksi={() => setAksi(null)}
                    onSelesai={() => setRefreshKey((k) => k + 1)}
                  />
                )}
              </div>
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="82" minSize="50" className="flex min-w-0 flex-col">
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 pl-3">
              {galatStats && <p className="text-destructive shrink-0 text-xs">{galatStats}</p>}

              <RingkasanVerifikasi stats={stats} periode={periode ?? null} terbuka={ringkasanTerbuka} />

              <div className="min-h-0 min-w-0 flex-1">
                <PanelTabel
                  periodes={stats?.periodes ?? []}
                  pencatats={pencatats}
                  rutes={rutes}
                  ambangAnomali={ambang}
                  bolehRing={(r) => (r === 1 ? bisaV1 : r === 2 ? bisaV2 : bisaV3)}
                  idTerpilih={idTerpilih}
                  onPeriodeBerubah={setPeriode}
                  onKlikBaris={(row) => setIdTerpilih(row.id)}
                  onKlikKanan={(row, posisi) => {
                    setIdTerpilih(row.id);
                    setAksi(null);
                    setMenu({ posisi, baris: row as BarisLaporan });
                  }}
                  refreshKey={refreshKey}
                  onBerubah={() => setRefreshKey((k) => k + 1)}
                  sisaKerja={stats ? stats.total - stats.diverifikasi : null}
                  onTabBerubah={(t) => {
                    setTab(t);
                    setIdTerpilih(null);
                    setAksi(null);
                  }}
                  anomali={stats?.anomali ?? 0}
                  ringkasanTerbuka={ringkasanTerbuka}
                  onRingkasan={setRingkasanTerbuka}
                  stats={stats}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {menu && (
        <MenuKonteks
          posisi={menu.posisi}
          judul={`${menu.baris.nomorLangganan ?? ""} · ${menu.baris.pelanggan?.nama ?? menu.baris.namaPelanggan ?? ""}`}
          aksi={aksiMenu(menu.baris)}
          onTutup={() => setMenu(null)}
        />
      )}

      <AlertDialog
        open={konfirmasi !== null}
        onOpenChange={(buka) => {
          if (!buka && !mengirim) setKonfirmasi(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{konfirmasi?.judul}</AlertDialogTitle>
            <AlertDialogDescription>{konfirmasi?.deskripsi}</AlertDialogDescription>
          </AlertDialogHeader>
          {galatAksi && <p className="text-xs text-destructive">{galatAksi}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mengirim}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={mengirim}
              onClick={(e) => {
                e.preventDefault();
                void jalankanKonfirmasi();
              }}
            >
              {mengirim && <Spinner className="size-3.5" />}
              {konfirmasi?.destruktif ? "Ya, batalkan" : "Ya, lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}