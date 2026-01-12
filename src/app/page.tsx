import GlassNavbar from '@/components/ui/GlassNavbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import SocialProof from '@/components/landing/SocialProof';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      <GlassNavbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <SocialProof />
      </main>
      <Footer />
    </>
  );
}
