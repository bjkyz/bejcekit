import type { PropsWithChildren } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'

const loadMotionFeatures = () => import('./motion-features').then((module) => module.default)

/**
 * One motion language for the whole site. Components may choose whether they
 * animate, but they do not invent their own spring or easing every time.
 */
export default function MotionProvider({ children }: PropsWithChildren) {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
