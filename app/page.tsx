import { LandingMotion } from '@/components/landing/LandingMotion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { ProductMock } from '@/components/landing/ProductMock';
import { Stats } from '@/components/landing/Stats';
import { LiveDemo } from '@/components/landing/LiveDemo';
import { Training } from '@/components/landing/Training';
import { Features } from '@/components/landing/Features';
import { DashboardSection } from '@/components/landing/DashboardSection';
import { BeforeAfter } from '@/components/landing/BeforeAfter';
import { Pricing } from '@/components/landing/Pricing';
import { Faq } from '@/components/landing/Faq';
import { LandingFooter } from '@/components/landing/LandingFooter';

// Roda antes da primeira pintura: marca a raiz para o CSS esconder os blocos que o animejs
// vai revelar (só sem prefers-reduced-motion). Se a animação não assumir em 4s, libera tudo.
const ANIM_GATE = `(function(){var r=document.currentScript.parentElement;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;r.setAttribute('data-anim','');setTimeout(function(){if(!r.dataset.ready)r.removeAttribute('data-anim')},4000)})()`;

export default function Home() {
  return (
    <div data-landing suppressHydrationWarning className="dark overflow-x-clip bg-[#05060a] text-white">
      <script dangerouslySetInnerHTML={{ __html: ANIM_GATE }} />
      <LandingMotion />
      <LandingHeader />
      <main>
        <Hero />
        <ProductMock />
        <Stats />
        <LiveDemo />
        <Training />
        <Features />
        <DashboardSection />
        <BeforeAfter />
        <Pricing />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
}
