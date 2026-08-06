import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar      from './components/Navbar';
import Hero        from './components/Hero';
import Features    from './components/Features';
import HowItWorks  from './components/HowItWorks';
import Audiences   from './components/Audiences';
import TechStack   from './components/TechStack';
import Shortcuts   from './components/Shortcuts';
import Download    from './components/Download';
import Footer      from './components/Footer';

// Register GSAP plugins once at the app root
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    // Refresh ScrollTrigger after all sections mount
    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <Navbar />

      <main>
        <Hero />

        {/* White section */}
        <Features />

        {/* Black section separator */}
        <div className="section-rule--white" />

        {/* Black section */}
        <HowItWorks />

        {/* White section separator */}
        <div className="section-rule" />

        {/* White section */}
        <Audiences />

        {/* Tech ticker — black strip */}
        <TechStack />

        {/* White section */}
        <Shortcuts />

        {/* Black CTA */}
        <div className="section-rule--white" />
        <Download />
      </main>

      <Footer />
    </>
  );
}
