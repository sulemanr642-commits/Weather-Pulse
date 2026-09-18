import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, ShieldCheck } from 'lucide-react';
import AdminLogin from './AdminLogin';
import AdminCityManager from './AdminCityManager';
import { useUIStore } from '@store';
import { durations, CALM_EASE } from '@design-system';
import type { City, LoginResponse } from '@types';

export interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  onCityAdded?: (city: City) => void;
  onCityDeleted?: (cityId: number) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  cities,
  onCityAdded,
  onCityDeleted,
}) => {
  const adminToken = useUIStore((s) => s.adminToken);
  const adminUsername = useUIStore((s) => s.adminUsername);
  const setAdminAuth = useUIStore((s) => s.setAdminAuth);
  const clearAdminAuth = useUIStore((s) => s.clearAdminAuth);

  const handleLoginSuccess = (data: LoginResponse) => {
    setAdminAuth(data.token, data.username);
  };

  const handleLogout = () => {
    clearAdminAuth();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 11, 26, 0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: durations.fast, ease: CALM_EASE }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '540px',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '22px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.18)',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: adminToken
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(30, 58, 138, 0.5) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} color={adminToken ? '#34d399' : '#38bdf8'} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                  Admin Control Plane
                </h2>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {adminToken ? `Authenticated as @${adminUsername || 'admin'}` : 'Secured Operator Terminal'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {adminToken && (
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out administrator"
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            {!adminToken ? (
              <AdminLogin onSuccess={handleLoginSuccess} />
            ) : (
              <AdminCityManager
                cities={cities}
                token={adminToken}
                onCityAdded={onCityAdded}
                onCityDeleted={onCityDeleted}
                onLogout={handleLogout}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminPanelModal;
