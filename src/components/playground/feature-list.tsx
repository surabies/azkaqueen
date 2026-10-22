import { CheckIcon } from "./check-icon"

// Data dipisah dari tampilan: untuk menambah/mengubah item cukup edit array ini.
// ReactNode dipakai supaya item bisa berisi teks + elemen <code>.
const features: React.ReactNode[] = [
  <>
    Customizing your theme with <Code>@theme</Code>
  </>,
  <>
    Adding custom utilities with <Code>@utility</Code>
  </>,
  <>
    Adding custom variants with <Code>@variant</Code>
  </>,
  "Code completion with instant preview",
]

// Komponen kecil untuk tag <code> yang berulang
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono font-medium text-gray-950 dark:text-white">
      {children}
    </code>
  )
}

export function FeatureList() {
  return (
    <ul className="space-y-3">
      {features.map((feature, i) => (
        // key memakai index karena list ini statis (tidak berubah urutan)
        <li key={i} className="flex">
          <CheckIcon />
          <p className="ml-3">{feature}</p>
        </li>
      ))}
    </ul>
  )
}
