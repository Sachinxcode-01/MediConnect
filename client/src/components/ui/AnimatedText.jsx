import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion } from 'framer-motion';

export const AnimatedText = ({
  text,
  className = '',
  animation = 'words', // 'words' | 'fade' | 'blur' | 'slide'
  delay = 0,
  stagger = 0.04,
  as: Component = 'div'
}) => {
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!containerRef.current || animation === 'fade') return;

    if (animation === 'words' || animation === 'slide') {
      const elements = containerRef.current.querySelectorAll('.anim-word');
      if (elements.length > 0) {
        gsap.fromTo(
          elements,
          {
            opacity: 0,
            y: animation === 'slide' ? 24 : 12,
            filter: animation === 'blur' ? 'blur(8px)' : 'none'
          },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.6,
            delay,
            stagger,
            ease: 'power3.out'
          }
        );
      }
    }
  }, { scope: containerRef, dependencies: [text, animation, delay] });

  if (animation === 'fade') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={className}
      >
        {text}
      </motion.div>
    );
  }

  const words = text ? text.split(' ') : [];

  return (
    <Component ref={containerRef} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] align-top">
          <span className="anim-word inline-block will-change-transform">
            {word}
          </span>
        </span>
      ))}
    </Component>
  );
};

export default AnimatedText;
