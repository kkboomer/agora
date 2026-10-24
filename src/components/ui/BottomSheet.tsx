'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /** Sheet height as a share of the phone screen, e.g. '70%'. */
  height?: string;
  title: ReactNode;
  children: ReactNode;
}

/** Slide-up sheet inside the phone frame. Close with ×, the dimmed area, Esc, or by dragging the header down. */
export default function BottomSheet({ open, onClose, label, height = '70%', title, children }: Props) {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="sheet-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            key="sheet"
            className="bottom-sheet"
            style={{ height }}
            role="dialog"
            aria-label={label}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <header className="reviews-head" onPointerDown={(e) => controls.start(e)}>
              <span className="grabber" />
              <div className="reviews-title">
                {title}
                <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Close"><Icon name="x" size={18} /></button>
              </div>
            </header>
            {children}
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
