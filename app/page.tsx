'use client'
import { useState, useCallback } from 'react'
import Nav from '@/components/Nav'
import CoffeeTrans from '@/components/CoffeeTrans'
import BottomSurprise from '@/components/BottomSurprise'
import Footer from '@/components/Footer'
import Home from '@/components/sections/Home'
import Maj from '@/components/sections/Maj'
import Myslienky from '@/components/sections/Myslienky'
import Citam from '@/components/sections/Citam'
import Cestovanie from '@/components/sections/Cestovanie'
import Projekty from '@/components/sections/Projekty'
import OMne from '@/components/sections/OMne'

export type SectionId = 'home' | 'maj' | 'myslienky' | 'citam' | 'cestovanie' | 'projekty' | 'o-mne'

const SECTIONS: Record<SectionId, React.ComponentType<{ go: (id: SectionId) => void }>> = {
  home: Home,
  maj: Maj,
  myslienky: Myslienky,
  citam: Citam,
  cestovanie: Cestovanie,
  projekty: Projekty,
  'o-mne': OMne,
}

export default function HomePage() {
  const [active, setActive] = useState<SectionId>('home')
  const [transitioning, setTransitioning] = useState(false)
  const [transTarget, setTransTarget] = useState<SectionId | null>(null)

  const go = useCallback((target: SectionId) => {
    if (target === active || transitioning) return
    setTransTarget(target)
    setTransitioning(true)
  }, [active, transitioning])

  const finishTransition = useCallback(() => {
    if (!transTarget) return
    setActive(transTarget)
    setTransitioning(false)
    setTransTarget(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [transTarget])

  const Section = SECTIONS[active]

  return (
    <>
      {transitioning && <CoffeeTrans onDone={finishTransition} />}

      {/* Reveal panel fixed under page */}
      <div className="fixed bottom-0 left-0 right-0 h-screen z-0">
        <BottomSurprise />
      </div>

      {/* Main scrollable content — sits above reveal */}
      <div className="relative z-[1] bg-[#fafaf8] flex flex-col min-h-screen">
        <Nav active={active} go={go} />
        <main className="flex-1">
          <Section go={go} />
        </main>
        <Footer />
      </div>
      {/* Scroll spacer outside the bg div so fixed panel shows through */}
      <div className="relative z-[1] h-screen" />
    </>
  )
}
