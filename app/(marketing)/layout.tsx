import Nav from "@/components/landing/Nav"
import Footer from "@/components/landing/Footer"
import TransitionWrapper from "./TransitionWrapper"

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
      <main className="flex-1">
        <TransitionWrapper>{children}</TransitionWrapper>
      </main>
      <Footer />
    </div>
  )
}
