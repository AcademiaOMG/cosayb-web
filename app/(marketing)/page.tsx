import Hero from "@/components/landing/Hero"
import Problema from "@/components/landing/Problema"
import ComoFunciona from "@/components/landing/ComoFunciona"
import Modulos from "@/components/landing/Modulos"
import AppMockup from "@/components/landing/AppMockup"
import Pricing from "@/components/landing/Pricing"
import CTAFinal from "@/components/landing/CTAFinal"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problema />
      <ComoFunciona />
      <Modulos />
      <AppMockup />
      <Pricing />
      <CTAFinal />
    </>
  )
}
