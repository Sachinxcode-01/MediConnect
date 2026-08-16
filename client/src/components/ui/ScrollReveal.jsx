import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

export const ScrollReveal = ({
  children,
  className = '',
  y = 30,
  duration = 0.7,
  delay = 0,
  threshold = 0.15
}) => {
  const elementRef = useRef(null);

  useGSAP(() => {
    if (!elementRef.current) return;

    gsap.fromTo(
      elementRef.current,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: elementRef.current,
          start: `top ${100 - threshold * 100}%`,
          toggleActions: 'play none none none',
          once: true
        }
      }
    );
  }, { scope: elementRef });

  return (
    <div ref={elementRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
};

export default ScrollReveal;
