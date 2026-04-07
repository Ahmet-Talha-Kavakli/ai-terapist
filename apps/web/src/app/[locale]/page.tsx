import { useTranslations } from 'next-intl';
import { auth } from '@clerk/nextjs/server';
import { Navbar } from '@/features/landing/components/navbar';
import { HeroSection } from '@/features/landing/components/hero-section';
import { FeaturesSection } from '@/features/landing/components/features-section';
import { LandingFooter } from '@/features/landing/components/landing-footer';

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <Navbar isSignedIn={!!userId} />
      <HeroSection isSignedIn={!!userId} />
      <FeaturesSection />
      <LandingFooter />
    </main>
  );
}
