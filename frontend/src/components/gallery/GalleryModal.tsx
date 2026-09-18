import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, durations, CALM_EASE } from '@design-system/motion';
import { X, Layers, Sparkles } from 'lucide-react';
import ComponentGallery from './ComponentGallery';
import SceneGallery from './SceneGallery';

export interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ui' | 'scenes';
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'ui',
}) => {
  const [activeTab, setActiveTab] = useState<'ui' | 'scenes'>(initialTab);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 24px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.fast, ease: CALM_EASE }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-panel-modal"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 210,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
              overflow: 'hidden',
            }}
          >
            {/* Header with Brand & Tab Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(15, 23, 42, 0.4)',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={18} color="#fff" />
                </div>
                <div>
                  <h2
                    id="gallery-modal-title"
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      margin: 0,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    WeatherPulse Design System Showcase
                  </h2>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Phase 15 Component & Scene Gallery
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '3px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('ui')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: activeTab === 'ui' ? '#38bdf8' : 'transparent',
                    color: activeTab === 'ui' ? '#0f172a' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'ui' ? 700 : 500,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Layers size={14} />
                  <span>UI Primitives</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('scenes')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: activeTab === 'scenes' ? '#38bdf8' : 'transparent',
                    color: activeTab === 'scenes' ? '#0f172a' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'scenes' ? 700 : 500,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Sparkles size={14} />
                  <span>3D Weather Scenes</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Gallery"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Gallery Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'clamp(16px, 3vw, 28px)',
              }}
            >
              {activeTab === 'ui' ? <ComponentGallery /> : <SceneGallery />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GalleryModal;
