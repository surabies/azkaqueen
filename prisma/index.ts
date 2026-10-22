// Satu PrismaClient untuk aplikasi. Cache global mencegah hot reload
// development membuka pool koneksi baru pada setiap perubahan file.
//
// Client dihasilkan ke ../generated/client, di luar folder schema Prisma.
import { PrismaClient } from "@generated";
import { PrismaPg } from "@prisma/adapter-pg";

// Keep type exports separate from runtime values so the CommonJS client can
// be analyzed by the application bundler.
export type * from "@generated";
export { Prisma } from "@generated";

// Runtime enum values must be listed explicitly; update this list when adding
// an enum to the Prisma schema.
export {
  AksiPengaduan,
  AlasanTaksir,
  GolonganTarif,
  JenisBiayaTetap,
  JenisMutasi,
  JenisPemutusan,
  JenisPengaduan,
  KlasifikasiPengaduan,
  JenisTagihanLain,
  KanalPembayaran,
  KategoriPembacaan,
  KodeDivisi,
  KondisiCatat,
  ObjekBayar,
  PrioritasPengaduan,
  Role,
  StatusDaftarCatat,
  StatusLaporanMandiri,
  StatusPasokanAir,
  StatusPelanggan,
  StatusPembayaran,
  StatusPengaduan,
  StatusPeriodePenagihan,
  StatusPotensi,
  StatusTagihan,
  SumberDaftarCatat,
  UkuranMeter,
  UserStatus,
} from "@generated";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL tidak ditemukan di environment — cek file .env di root project.",
  );
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
