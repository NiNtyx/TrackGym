import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  padding?: string;
  rounded?: string;
}

export function GlassCard({ children, padding = 'p-4', rounded = 'rounded-2xl', className = '', ...props }: GlassCardProps) {
  return (
    <motion.div
      className={`glass ${padding} ${rounded} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SolidCard({ children, padding = 'p-4', rounded = 'rounded-2xl', className = '', ...props }: GlassCardProps) {
  return (
    <motion.div
      className={`bg-secondary ${padding} ${rounded} ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
