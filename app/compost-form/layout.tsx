'use client';

import { Inter } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';

const inter = Inter({ subsets: ['latin'] });

export default function CompostFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`bg-earthyLIGHTGreen ${inter.className} text-black w-screen`} style={{ 
      minHeight: '100vh',
      overscrollBehaviorY: 'contain'
    }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ minHeight: '100vh', overscrollBehaviorY: 'contain' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

