"use client"

// features/dashboard/components/pengguna/pengguna-dialog.tsx — form tambah &
// ubah akun internal.
//
// TIGA ENDPOINT, SATU FORM. Server sengaja memisahkan role dan status dari
// PATCH /users/:id (lihat catatan di user.router.ts): keduanya punya endpoint
// sendiri supaya selalu melewati pengecekan self-modification dan audit
// khusus. Form ini menyatukannya kembali untuk pemakainya — satu tombol
// Simpan — lalu mengirim ke tiga alamat yang benar, dan HANYA yang berubah.
//
// Perubahan role/status dikirim BELAKANGAN, setelah data dasar tersimpan.
// Kalau salah satunya ditolak server (mis. mengubah role sendiri), yang sudah
// tersimpan tidak ikut hilang dan pesannya menyebut persis bagian mana yang
// gagal.

import * as React from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@workspace/ui/components/select"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ambilList, kirimJson, ApiError } from "../../lib/api-client"
import { LABEL_ROLE, LABEL_STATUS_USER } from "../../lib/label"

export interface BarisPengguna {
  id: string
  name?: string | null
  username?: string | null
  email?: string | null
  role?: string | null
  status?: string | null
  divisiId?: string | null
  divisiKode?: string | null
}

interface Divisi {
  id: string
  kode: string
  nama: string
}

/// Nilai sentinel untuk "tanpa divisi". Select tidak menerima value kosong,
/// dan mengirim string kosong ke server berarti id tak sah — bukan null.
const TANPA_DIVISI = "__TANPA__"

export function PenggunaDialog({
  pengguna,
  idSaya,
  roleSaya,
  onTutup,
  onTersimpan,
}: {
  /** null = mode TAMBAH; berisi baris = mode UBAH. */
  pengguna: BarisPengguna | null
  /** id akun yang sedang login — role & status dirinya sendiri dikunci. */
  idSaya?: string | null
  /** Reset sandi akun ORANG LAIN hanya untuk SUPER_ADMIN (user.router.ts). */
  roleSaya?: string | null
  onTutup: () => void
  onTersimpan: () => void
}) {
  const ubah = pengguna != null
  const diriSendiri = ubah && idSaya != null && pengguna.id === idSaya
  const bisaReset = ubah && !diriSendiri && roleSaya === "SUPER_ADMIN"

  const [nama, setNama] = React.useState(pengguna?.name ?? "")
  const [email, setEmail] = React.useState(pengguna?.email ?? "")
  const [username, setUsername] = React.useState(pengguna?.username ?? "")
  const [sandi, setSandi] = React.useState("")
  const [role, setRole] = React.useState(pengguna?.role ?? "STAFF")
  const [status, setStatus] = React.useState(pengguna?.status ?? "ACTIVE")
  const [divisiId, setDivisiId] = React.useState(pengguna?.divisiId ?? TANPA_DIVISI)

  const [divisi, setDivisi] = React.useState<Divisi[]>([])
  const [mengirim, setMengirim] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)

  // Reset sandi berdiri SENDIRI, tidak ikut tombol Simpan. Ia bukan
  // penyuntingan data melainkan tindakan istimewa dengan jejak audit sendiri
  // (RESET_PASSWORD), dan menggabungkannya ke Simpan akan membuat orang
  // mengganti sandi orang lain tanpa sadar saat sekadar membetulkan email.
  const [sandiReset, setSandiReset] = React.useState("")
  const [bukaReset, setBukaReset] = React.useState(false)
  const [mereset, setMereset] = React.useState(false)
  const [pesanReset, setPesanReset] = React.useState<string | null>(null)

  async function resetSandi() {
    if (!pengguna) return
    setMereset(true)
    setGalat(null)
    setPesanReset(null)
    try {
      await kirimJson(`/users/${pengguna.id}/password`, "PATCH", { passwordBaru: sandiReset })
      setPesanReset("Kata sandi berhasil direset.")
      setSandiReset("")
      setBukaReset(false)
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : "Gagal mereset kata sandi.")
    } finally {
      setMereset(false)
    }
  }

  React.useEffect(() => {
    let batal = false
    ambilList<Divisi>("/divisi", { pageSize: 50 })
      .then(({ rows }) => {
        if (!batal) setDivisi(rows)
      })
      .catch(() => {
        // Divisi opsional — gagal memuatnya tidak boleh memblokir pembuatan akun.
      })
    return () => {
      batal = true
    }
  }, [])

  // Aturan server: password hanya bisa diset bila username ada, karena login
  // Credentials membutuhkan keduanya. Ditegakkan di sini juga supaya
  // pemakainya tahu SEBELUM menekan Simpan.
  const sandiTanpaUsername = sandi.trim().length > 0 && username.trim().length === 0
  const bisaSimpan =
    nama.trim().length > 0 && email.trim().length > 0 && !sandiTanpaUsername && !mengirim

  async function simpan() {
    setMengirim(true)
    setGalat(null)
    const idDivisi = divisiId === TANPA_DIVISI ? null : divisiId

    try {
      if (!ubah) {
        await kirimJson("/users", "POST", {
          name: nama.trim(),
          email: email.trim(),
          username: username.trim() || null,
          password: sandi.trim() || undefined,
          role,
          status,
          divisiId: idDivisi,
        })
      } else {
        // Hanya kirim yang benar-benar berubah — PATCH parsial, dan setiap
        // field yang ikut terkirim akan tercatat di AuditLog.
        const patch: Record<string, unknown> = {}
        if (nama.trim() !== (pengguna.name ?? "")) patch.name = nama.trim()
        if (email.trim() !== (pengguna.email ?? "")) patch.email = email.trim()
        if (username.trim() !== (pengguna.username ?? "")) patch.username = username.trim() || null
        if (idDivisi !== (pengguna.divisiId ?? null)) patch.divisiId = idDivisi
        if (Object.keys(patch).length > 0) await kirimJson(`/users/${pengguna.id}`, "PATCH", patch)

        if (role !== pengguna.role) {
          await kirimJson(`/users/${pengguna.id}/role`, "PATCH", { role })
        }
        if (status !== pengguna.status) {
          await kirimJson(`/users/${pengguna.id}/status`, "PATCH", { status })
        }
      }
      onTersimpan()
      onTutup()
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : "Gagal menyimpan. Coba lagi.")
      setMengirim(false)
    }
  }

  return (
    <Dialog open onOpenChange={(buka) => !buka && onTutup()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ubah ? "Ubah pengguna" : "Tambah pengguna"}</DialogTitle>
          <DialogDescription>
            {ubah
              ? "Perubahan role dan status tercatat di log audit."
              : "Akun dibuat administrator — tidak ada pendaftaran mandiri."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pg-nama">Nama lengkap</Label>
            <Input
              id="pg-nama"
              autoComplete="off"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="mis. Dani Ramdani"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pg-email">Email</Label>
            <Input
              id="pg-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@tirtawening.co.id"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pg-username">Username</Label>
              <Input
                id="pg-username"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="opsional"
                className="font-mono"
              />
            </div>
            {!ubah && (
              <div className="grid gap-2">
                <Label htmlFor="pg-sandi">Kata sandi</Label>
                {/* `new-password`, BUKAN "off". Chrome mengabaikan "off" pada
                    kolom kata sandi, lalu mencari kolom "username" pasangannya
                    di seluruh halaman — dan yang dipilihnya adalah kotak cari
                    tabel di belakang dialog ini, yang lalu terisi nama akun
                    tersimpan. `new-password` menyatakan ini sandi BARU, jadi
                    tidak ada pasangan yang perlu dicari. */}
                <Input
                  id="pg-sandi"
                  type="password"
                  autoComplete="new-password"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                  placeholder="min. 8 karakter"
                />
              </div>
            )}
          </div>

          {/* Dijelaskan SEBELUM Simpan ditekan, bukan sebagai galat sesudahnya. */}
          <p className="text-xs text-muted-foreground">
            {sandiTanpaUsername
              ? "Kata sandi butuh username — login dengan kata sandi memakai username, bukan email."
              : "Tanpa username & kata sandi, akun hanya bisa masuk lewat Google."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole} disabled={diriSendiri}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABEL_ROLE).map(([nilai, teks]) => (
                    <SelectItem key={nilai} value={nilai}>{teks}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={diriSendiri}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABEL_STATUS_USER).map(([nilai, teks]) => (
                    <SelectItem key={nilai} value={nilai}>{teks}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Server menolak perubahan role/status atas diri sendiri supaya
              admin terakhir tidak bisa mengunci dirinya keluar. Dikunci di
              sini juga, dengan alasannya — bukan dibiarkan gagal di server. */}
          {diriSendiri && (
            <p className="text-xs text-muted-foreground">
              Role dan status akun Anda sendiri tidak bisa diubah dari sini.
            </p>
          )}

          <div className="grid gap-2">
            <Label>Divisi</Label>
            <Select value={divisiId} onValueChange={setDivisiId}>
              <SelectTrigger>
                <SelectValue placeholder="Tanpa divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TANPA_DIVISI}>Tanpa divisi</SelectItem>
                {divisi.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nama} <span className="text-muted-foreground">({d.kode})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {bisaReset && (
            <div className="rounded-lg border border-dashed p-3">
              {!bukaReset ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Kata sandi</p>
                    <p className="text-xs text-muted-foreground">
                      Sandi lama tidak perlu diketahui. Tindakan ini tercatat sebagai
                      RESET_PASSWORD di log audit.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setBukaReset(true)}>
                    <KeyRound className="size-4" aria-hidden /> Reset kata sandi
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="pg-reset">Kata sandi baru</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="pg-reset"
                      type="password"
                      autoComplete="new-password"
                      value={sandiReset}
                      onChange={(e) => setSandiReset(e.target.value)}
                      placeholder="min. 8 karakter"
                      className="min-w-48 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={resetSandi}
                      disabled={sandiReset.trim().length < 8 || mereset}
                    >
                      {mereset && <Loader2 className="size-4 animate-spin" />} Terapkan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setBukaReset(false)
                        setSandiReset("")
                      }}
                      disabled={mereset}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {pesanReset && (
            <Alert>
              <AlertDescription>{pesanReset}</AlertDescription>
            </Alert>
          )}

          {galat && (
            <Alert variant="destructive">
              <AlertDescription>{galat}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onTutup} disabled={mengirim}>
            Batal
          </Button>
          <Button onClick={simpan} disabled={!bisaSimpan}>
            {mengirim && <Loader2 className="size-4 animate-spin" />}
            {ubah ? "Simpan perubahan" : "Buat akun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
