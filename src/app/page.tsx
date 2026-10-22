import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FeatureList } from "@/components/playground/feature-list"
import { PatternColumn } from "@/components/playground/pattern-column"

export default function HomePage() {
  return (
    // Tahap 1: wrapper grid 5 kolom x 5 baris.
    // Kartu ada di tengah (col 3, row 3), sisanya diisi garis & pattern dekoratif.
    <main className="relative grid min-h-screen grid-cols-[1fr_2.5rem_auto_2.5rem_1fr] grid-rows-[1fr_1px_auto_1px_1fr] bg-white [--pattern-fg:var(--color-gray-950)]/5 dark:bg-gray-950 dark:[--pattern-fg:var(--color-white)]/10">
      {/* Tahap 2: bingkai abu-abu di luar kartu */}
      <div className="col-start-3 row-start-3 flex max-w-lg flex-col bg-gray-100 p-2 dark:bg-white/10">
        {/* Tahap 3: Card shadcn. Default-nya punya border, shadow, padding,
            dan gap, jadi kita reset agar tampilannya sama dengan aslinya. */}
        <Card className="gap-0 rounded-xl border-0 bg-white py-0 text-sm/7 text-gray-700 shadow-none dark:bg-gray-950 dark:text-gray-300">
          <CardContent className="p-10">
            {/* Tahap 4: logo. next/image mewajibkan width & height.
                Light/dark logo tetap dipisah dengan dark:hidden / not-dark:hidden. */}
            <Image
              src="/img/logo.svg"
              alt="Tailwind Play"
              width={120}
              height={24}
              className="mb-11.5 h-6 w-auto dark:hidden"
            />
            <Image
              src="/img/logo-dark.svg"
              alt="Tailwind Play"
              width={120}
              height={24}
              className="mb-11.5 h-6 w-auto not-dark:hidden"
            />

            {/* Tahap 5: isi teks + daftar fitur */}
            <div className="space-y-6">
              <p>
                An advanced online playground for Tailwind CSS, including
                support for things like:
              </p>
              <FeatureList />
              <p>
                Perfect for learning how the framework works, prototyping a new
                idea, or creating a demo to share online.
              </p>
            </div>

            {/* Tahap 6: pemisah. <hr> diganti Separator shadcn */}
            <Separator className="my-6 bg-(--pattern-fg)" />

            {/* Tahap 7: link docs. Button asChild + variant link,
                sehingga elemen aslinya tetap <a> (bagus untuk SEO & aksesibilitas) */}
            <p className="mb-3">Want to dig deeper into Tailwind?</p>
            <Button
              variant="link"
              className="h-auto p-0 font-semibold text-gray-950 underline decoration-sky-400 underline-offset-3 hover:decoration-2 dark:text-white"
              render={<a href="https://tailwindcss.com/docs" />}
            >
              Read the docs &rarr;
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tahap 8: kolom pattern kiri & kanan */}
      <PatternColumn side="left" />
      <PatternColumn side="right" />

      {/* Tahap 9: garis horizontal atas & bawah kartu */}
      <div
        aria-hidden="true"
        className="relative -bottom-px col-span-full col-start-1 row-start-2 h-px bg-(--pattern-fg)"
      />
      <div
        aria-hidden="true"
        className="relative -top-px col-span-full col-start-1 row-start-4 h-px bg-(--pattern-fg)"
      />
    </main>
  )
}
