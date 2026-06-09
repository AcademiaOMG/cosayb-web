import Nav from "@/components/landing/Nav"
import Footer from "@/components/landing/Footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
