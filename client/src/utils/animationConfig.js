/**
 * Centralized Animation Tokens & Configurations
 */
export const ANIMATION_TOKENS = {
  duration: {
    instant: 0.1,
    fast: 0.25,
    normal: 0.4,
    slow: 0.6,
    deliberate: 0.8
  },
  easing: {
    customEase: [0.22, 1, 0.36, 1], // Power3 out equivalent
    smooth: [0.16, 1, 0.3, 1],
    bounceSubtle: [0.34, 1.56, 0.64, 1],
    exit: [0.4, 0, 1, 1]
  },
  stagger: {
    fast: 0.05,
    normal: 0.08,
    relaxed: 0.15
  }
};

export const MOTION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: ANIMATION_TOKENS.duration.fast } },
    exit: { opacity: 0, transition: { duration: ANIMATION_TOKENS.duration.instant } }
  },
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: ANIMATION_TOKENS.duration.normal, ease: ANIMATION_TOKENS.easing.smooth } },
    exit: { opacity: 0, y: -10, transition: { duration: ANIMATION_TOKENS.duration.fast } }
  },
  modalScale: {
    initial: { opacity: 0, scale: 0.94, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: ANIMATION_TOKENS.duration.normal, ease: ANIMATION_TOKENS.easing.customEase } },
    exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: ANIMATION_TOKENS.duration.fast } }
  },
  drawerSlide: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: ANIMATION_TOKENS.duration.normal, ease: ANIMATION_TOKENS.easing.smooth } },
    exit: { opacity: 0, x: 40, transition: { duration: ANIMATION_TOKENS.duration.fast } }
  }
};
