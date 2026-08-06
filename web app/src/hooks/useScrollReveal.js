import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared GSAP ScrollTrigger reveal hook.
 * @param {React.RefObject} ref  - container ref to select targets inside
 * @param {string}          selector - CSS selector for animated elements
 * @param {object}          from   - GSAP `from` vars
 * @param {object}          to     - GSAP `to` vars
 * @param {object}          opts   - ScrollTrigger options override
 */
export function useScrollReveal(ref, selector, from, to, opts = {}) {
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll(selector);
    if (!els.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(els, from, {
        ...to,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 82%',
          toggleActions: 'play none none none',
          ...opts,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);
}
