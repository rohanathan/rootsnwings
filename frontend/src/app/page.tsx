/*
================================================================================
File: src/app/page.tsx (No changes needed from last time)
================================================================================
This file remains clean. It acts as a simple container for our components.
The data fetching will happen inside the FeaturedMentors component.
*/
import HeroSection from '@/components/HeroSection';
import FeaturedMentors from '@/components/FeaturedMentors';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturedMentors />
    </div>
  );
}