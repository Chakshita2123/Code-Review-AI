'use client';

import dynamic from 'next/dynamic';
import { Footer } from '@/components/layout/Footer';
import { FAQ } from '@/components/landing/FAQ';
import { Features } from '@/components/landing/Features';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Navbar } from '@/components/landing/Navbar';
import { ReportPreview } from '@/components/landing/ReportPreview';
import { StatsBar } from '@/components/landing/StatsBar';
import { Testimonials } from '@/components/landing/Testimonials';

// Load ParticleField client-side only — it uses canvas + window APIs
const ParticleField = dynamic(
  () => import('@/components/landing/ParticleField').then((mod) => ({ default: mod.ParticleField })),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="relative min-h-screen text-white">
      {/* Particle field: fixed, full-viewport, behind all content (z-1) */}
      <ParticleField />

      {/* All sections render above the particle canvas (z-10) */}
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Features />
      <ReportPreview />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
