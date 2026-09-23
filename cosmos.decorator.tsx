import type { ReactNode } from "react"
export default function Decorator({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 20 }}>
      {children}
    </div>
  )
}
