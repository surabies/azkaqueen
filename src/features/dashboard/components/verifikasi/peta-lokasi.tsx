"use client"

// features/dashboard/components/verifikasi/peta-lokasi.tsx — peta mini lokasi
// rumah pelanggan di panel verifikasi. MapLibre + raster OSM (tanpa API key;
// untuk traffic produksi tinggi ganti penyedia tile sendiri).
//
// Sumber koordinat: Pelanggan.geoLat/geoLong (Float biasa).
import * as React from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { ArrowDown01Icon, Location01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

function PetaMini({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<maplibregl.Map | null>(null)

  React.useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [lng, lat],
      zoom: 15,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    })
    new maplibregl.Marker({ color: "var(--primary)" }).setLngLat([lng, lat]).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng])

  return <div ref={containerRef} className="h-36 w-full overflow-hidden rounded-lg border border-border" />
}

export function PetaLokasi({ lat, lng }: { lat: number | null | undefined; lng: number | null | undefined }) {
  // ~46168.x = placeholder Excel date serial di data legacy — anggap "tidak ada koordinat".
  const valid =
    typeof lat === "number" && typeof lng === "number" && lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141

  if (!valid) {
    return (
      <div className="flex items-center justify-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5">
        <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[11px] text-muted-foreground">Koordinat rumah pelanggan belum tersedia.</p>
      </div>
    )
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-accent">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 text-blue-600 dark:text-blue-400" aria-hidden />
          Lokasi rumah pelanggan
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {/* Peta baru dibuat saat panel dibuka (Collapsible unmount saat tertutup). */}
        <PetaMini lat={lat} lng={lng} />
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-[11px] font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          Buka di peta penuh ↗
        </a>
      </CollapsibleContent>
    </Collapsible>
  )
}