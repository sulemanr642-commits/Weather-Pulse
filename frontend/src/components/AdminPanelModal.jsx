import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  Plus, 
  Trash2, 
  Search, 
  LogOut, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { loginAdmin, addAdminCity, deleteAdminCity } from '../services/api';

export default function AdminPanelModal({ 
  isOpen, 
  onClose, 
  cities, 
  onCityAdded, 
  onCityDeleted,
  token: externalToken,
  onTokenChange
}) {
  // In-memory token storage (React state only, never localStorage to limit token exposure)
  const [token, setToken] = useState(externalToken || '');
  const [adminUsername, setAdminUsername] = useState('');

  // Sync if external token changes
  useEffect(() => {
    if (externalToken !== undefined) {
      setToken(externalToken);
    }
  }, [externalToken]);

  // Login form state
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Active admin tab: 'add' | 'list'
  const [activeTab, setActiveTab] = useState('add');

  // Add city form state
  const [newCityName, setNewCityName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLon, setNewLon] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addStatus, setAddStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // City list search and deletion state
  const [listSearch, setListSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);

  const filteredModalCities = useMemo(() => {
    if (!listSearch.trim()) return cities;
    const q = listSearch.toLowerCase().trim();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.countryCode.toLowerCase().includes(q)
    );
  }, [cities, listSearch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const data = await loginAdmin(loginUser.trim(), loginPass);
      const jwt = data.token;
      // Store strictly in memory
      setToken(jwt);
      setAdminUsername(data.username || loginUser.trim());
      if (onTokenChange) onTokenChange(jwt, data.username || loginUser.trim());
      setLoginPass('');
    } catch (err) {
      console.error('Admin login error:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Invalid username or password.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear strictly in memory
    setToken('');
    setAdminUsername('');
    if (onTokenChange) onTokenChange('', '');
    setAddStatus(null);
    setDeleteStatus(null);
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddStatus(null);

    const latVal = parseFloat(newLat);
    const lonVal = parseFloat(newLon);

    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setAddStatus({ type: 'error', message: 'Latitude must be a valid number between -90 and 90.' });
      setAddLoading(false);
      return;
    }
    if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      setAddStatus({ type: 'error', message: 'Longitude must be a valid number between -180 and 180.' });
      setAddLoading(false);
      return;
    }

    try {
      const created = await addAdminCity({
        name: newCityName.trim(),
        countryCode: newCountryCode.trim().toUpperCase(),
        latitude: latVal,
        longitude: lonVal,
      }, token);

      setAddStatus({ type: 'success', message: `City "${created.name}" registered successfully.` });
      setNewCityName('');
      setNewCountryCode('');
      setNewLat('');
      setNewLon('');
      if (onCityAdded) onCityAdded(created);
    } catch (err) {
      console.error('Failed to add city:', err);
      if (err.response?.status === 401) {
        handleLogout();
        setLoginError('Your session expired. Please sign in again.');
      } else {
        const msg = err.response?.data?.detail || 'Failed to add city. Please check coordinates and city name.';
        setAddStatus({ type: 'error', message: msg });
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteCity = async (city) => {
    if (!window.confirm(`Are you sure you want to stop tracking "${city.name}"? This will evict its cache and remove it from the database.`)) {
      return;
    }

    setDeletingId(city.id);
    setDeleteStatus(null);

    try {
      await deleteAdminCity(city.id, token);
      setDeleteStatus({ type: 'success', message: `"${city.name}" removed successfully.` });
      if (onCityDeleted) onCityDeleted(city.id);
    } catch (err) {
      console.error('Failed to delete city:', err);
      if (err.response?.status === 401) {
        handleLogout();
        setLoginError('Your session expired. Please sign in again.');
      } else {
        const msg = err.response?.data?.detail || 'Failed to delete city.';
        setDeleteStatus({ type: 'error', message: msg });
      }
    } finally {
      setDeletingId(null);
    }
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 11, 26, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.92) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
            color: '#fff',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}>
                <ShieldCheck size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Admin Console</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Manage Tracked Meteorological Cities
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {!token ? (
              /* LOGIN VIEW */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Lock size={26} color="#38bdf8" />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Administrative Access Required</h4>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Sign in with administrator credentials to add or remove cities.
                  </p>
                </div>

                {loginError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '13px',
                    marginBottom: '20px'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Username
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '10px',
                      padding: '10px 14px'
                    }}>
                      <User size={16} color="var(--text-muted)" />
                      <input
                        type="text"
                        required
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        placeholder="Admin username"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '14px',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Password
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '10px',
                      padding: '10px 14px'
                    }}>
                      <Lock size={16} color="var(--text-muted)" />
                      <input
                        type="password"
                        required
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="Enter password"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '14px',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '1px solid #38bdf8',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: loginLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    {loginLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    {loginLoading ? 'Authenticating...' : 'Sign In to Admin Panel'}
                  </button>
                </form>

                <div style={{
                  marginTop: '20px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}>
                  Credentials: <strong style={{ color: '#38bdf8' }}>admin</strong> / <strong style={{ color: '#38bdf8' }}>AdminSecret123!</strong>
                </div>
              </div>
            ) : (
              /* AUTHENTICATED ADMIN DASHBOARD */
              <div>
                {/* Admin Status Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                    <span>Administrator: <strong style={{ color: '#38bdf8' }}>{adminUsername}</strong></span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>

                {/* Navigation Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                  <button
                    onClick={() => setActiveTab('add')}
                    style={{
                      background: activeTab === 'add' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      border: activeTab === 'add' ? '1px solid #38bdf8' : '1px solid transparent',
                      borderRadius: '8px',
                      color: activeTab === 'add' ? '#38bdf8' : 'var(--text-secondary)',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} /> Add City
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    style={{
                      background: activeTab === 'list' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      border: activeTab === 'list' ? '1px solid #38bdf8' : '1px solid transparent',
                      borderRadius: '8px',
                      color: activeTab === 'list' ? '#38bdf8' : 'var(--text-secondary)',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MapPin size={14} /> Tracked Cities ({cities.length})
                  </button>
                </div>

                {/* TAB 1: ADD CITY */}
                {activeTab === 'add' && (
                  <div>
                    {addStatus && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: addStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: addStatus.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                        color: addStatus.type === 'success' ? '#34d399' : '#fca5a5',
                        fontSize: '13px',
                        marginBottom: '16px'
                      }}>
                        {addStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{addStatus.message}</span>
                      </div>
                    )}

                    <form onSubmit={handleAddCity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            City Name
                          </label>
                          <input
                            type="text"
                            required
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            placeholder="e.g. Reykjavik"
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              color: '#fff',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Country Code
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            value={newCountryCode}
                            onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                            placeholder="e.g. IS"
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              color: '#fff',
                              fontSize: '13px',
                              textTransform: 'uppercase',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Latitude (-90 to 90)
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newLat}
                            onChange={(e) => setNewLat(e.target.value)}
                            placeholder="e.g. 64.1466"
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              color: '#fff',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Longitude (-180 to 180)
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newLon}
                            onChange={(e) => setNewLon(e.target.value)}
                            placeholder="e.g. -21.9426"
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              color: '#fff',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={addLoading}
                        style={{
                          marginTop: '8px',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          border: '1px solid #38bdf8',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: addLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {addLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {addLoading ? 'Registering City...' : 'Register Tracked City'}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: CITIES LIST & REMOVAL */}
                {activeTab === 'list' && (
                  <div>
                    {deleteStatus && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: deleteStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: deleteStatus.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                        color: deleteStatus.type === 'success' ? '#34d399' : '#fca5a5',
                        fontSize: '12px',
                        marginBottom: '12px'
                      }}>
                        {deleteStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{deleteStatus.message}</span>
                      </div>
                    )}

                    {/* Search inside modal */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '14px'
                    }}>
                      <Search size={14} color="var(--text-muted)" />
                      <input
                        type="text"
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        placeholder="Search city to manage or delete..."
                        style={{
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '13px',
                          width: '100%'
                        }}
                      />
                    </div>

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {filteredModalCities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          No cities matching "{listSearch}"
                        </div>
                      ) : (
                        filteredModalCities.map((c) => (
                          <div
                            key={c.id || c.name}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</span>
                                <span style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  color: 'var(--text-secondary)'
                                }}>
                                  {c.countryCode}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Lat: {c.latitude ? Number(c.latitude).toFixed(4) : 'N/A'}, Lon: {c.longitude ? Number(c.longitude).toFixed(4) : 'N/A'}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteCity(c)}
                              disabled={deletingId === c.id}
                              title={`Delete ${c.name} and evict cache`}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                borderRadius: '6px',
                                color: '#fca5a5',
                                cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                                padding: '6px 10px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (deletingId !== c.id) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                if (deletingId !== c.id) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                              }}
                            >
                              {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              <span>Remove</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
