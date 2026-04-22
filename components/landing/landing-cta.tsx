import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarbedWireLine } from "@/components/barbed-wire"
import { HireWireLogo } from "@/components/hirewire-logo"
import { ArrowRight } from "lucide-react"

function AblohStripeCorner({ position }: { position: "top-left" | "bottom-right" }) {
  const isTopLeft = position === "top-left"
  return (
    <div
      className={`absolute w-36 h-36 pointer-events-none ${
        isTopLeft ? "top-0 left-0" : "bottom-0 right-0"
      }`}
      style={{ opacity: 0.18 }}
    >
      <svg viewBox="0 0 144 144" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {[-60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160].map((offset) => (
          <line key={offset} x1={offset} y1={0} x2={offset + 144} y2={144} stroke="#ffffff" strokeWidth="10" />
        ))}
      </svg>
    </div>
  )
}

export function LandingCta() {
  return (
    <section className="relative overflow-hidden">
      <BarbedWireLine intensity="medium" />

      {/* Supreme Red bottom block — mirrors the hero */}
      <div className="relative overflow-hidden" style={{ backgroundColor: "#7B1212" }}>
        <AblohStripeCorner position="top-left" />
        <AblohStripeCorner position="bottom-right" />

        {/* Subtle inner vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)" }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-32 flex flex-col items-center text-center">

          {/* Logo */}
          <div className="w-full max-w-[200px] md:max-w-[260px] mb-8">
            <HireWireLogo variant="light" size="lg" />
          </div>

          {/* Divider */}
          <div className="w-24 h-px bg-white/20 mb-10" />

          <h2 className="font-serif text-white text-4xl md:text-5xl font-medium tracking-tight text-balance max-w-xl mx-auto mb-5 leading-[1.1]">
            Apply with evidence.<br />Not optimism.
          </h2>

          <p className="text-white/60 max-w-md mx-auto mb-10 leading-relaxed text-balance">
            Join job seekers who stopped spray-and-praying and started applying with real insight into their fit.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-10 font-semibold"
              style={{ backgroundColor: "#ffffff", color: "#7B1212", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
              asChild
            >
              <Link href="/signup">
                Start free today
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <p className="text-white/30 text-xs mt-6 font-mono tracking-widest uppercase">
            Free plan available. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
