import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, MapPin, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAddCityMutation, useDeleteCityMutation } from '@hooks';
import type { City } from '@types';

export interface AdminCityManagerProps {
  cities: City[];
  token: string;
  onCityAdded?: (city: City) => void;
  onCityDeleted?: (cityId: number) => void;
  onLogout: () => void;
}

export const AdminCityManager: React.FC<AdminCityManagerProps> = ({
  cities,
  token,
  onCityAdded,
  onCityDeleted,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');

  // Add City Form State
  const [cityName, setCityName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // List search & deletion
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const addMutation = useAddCityMutation();
  const deleteMutation = useDeleteCityMutation();

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.toLowerCase().trim();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.countryCode.toLowerCase().includes(q)
    );
  }, [cities, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);

    const latVal = parseFloat(latitude);
    const lonVal = parseFloat(longitude);

    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setFormStatus({ type: 'error', message: 'Latitude must be a valid number between -90 and 90.' });
      return;
    }
    if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      setFormStatus({ type: 'error', message: 'Longitude must be a valid number between -180 and 180.' });
      return;
    }

    addMutation.mutate(
      {
        cityData: {
          name: cityName.trim(),
          countryCode: countryCode.trim().toUpperCase(),
          latitude: latVal,
          longitude: lonVal,
        },
        token,
      },
      {
        onSuccess: (newCity) => {
          setFormStatus({ type: 'success', message: `City "${newCity.name}" tracked successfully.` });
          setCityName('');
          setCountryCode('');
          setLatitude('');
          setLongitude('');
          if (onCityAdded) onCityAdded(newCity);
        },
        onError: (err: any) => {
          if (err.response?.status === 401) {
            onLogout();
          } else {
            const msg =
              err.response?.data?.detail ||
              err.response?.data?.message ||
              'Failed to register city. Please check coordinates and city name.';
            setFormStatus({ type: 'error', message: msg });
          }
        },
      }
    );
  };

  const handleDelete = (city: City) => {
    if (
      !window.confirm(
        `Are you sure you want to stop tracking "${city.name}"? This will evict its cache and remove it from active monitoring.`
      )
    ) {
      return;
    }

    setDeletingId(city.id);
    deleteMutation.mutate(
      { cityId: city.id, token },
      {
        onSuccess: () => {
          if (onCityDeleted) onCityDeleted(city.id);
          setDeletingId(null);
        },
        onError: (err: any) => {
          if (err.response?.status === 401) {
            onLogout();
          }
          setDeletingId(null);
        },
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tab Selectors */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: activeTab === 'add' ? 700 : 500,
            borderRadius: '9px',
            background: activeTab === 'add' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
            color: activeTab === 'add' ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
            border: activeTab === 'add' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={14} />
          <span>Register City</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('list')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: activeTab === 'list' ? 700 : 500,
            borderRadius: '9px',
            background: activeTab === 'list' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
            color: activeTab === 'list' ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
            border: activeTab === 'list' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <MapPin size={14} />
          <span>Active Targets ({cities.length})</span>
        </button>
      </div>

      {/* Tab: Register City */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formStatus && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background:
                  formStatus.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border:
                  formStatus.type === 'success'
                    ? '1px solid rgba(52, 211, 153, 0.4)'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                color: formStatus.type === 'success' ? '#6ee7b7' : '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {formStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{formStatus.message}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
                City Name
              </label>
              <input
                type="text"
                placeholder="e.g. Kyoto"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
                ISO Code
              </label>
              <input
                type="text"
                placeholder="JP"
                maxLength={2}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  fontSize: '13px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="any"
                placeholder="35.0116"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="any"
                placeholder="135.7681"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addMutation.isPending}
            style={{
              marginTop: '8px',
              padding: '11px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: addMutation.isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            {addMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Registering Target...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add Tracked Target</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab: Manage Cities */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="rgba(255, 255, 255, 0.45)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search targets by name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '9px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Responsive List Container */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredCities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                No cities matched query.
              </div>
            ) : (
              <>
                {/* Desktop View: Full Structured Table */}
                <table className="admin-desktop-table">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', textAlign: 'left', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '8px 10px' }}>Target City</th>
                      <th style={{ padding: '8px 10px' }}>Country</th>
                      <th style={{ padding: '8px 10px' }}>Coordinates</th>
                      <th style={{ padding: '8px 10px' }}>Status</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCities.map((city) => (
                      <tr
                        key={city.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '9px 10px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {city.name}
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'rgba(255, 255, 255, 0.8)',
                            }}
                          >
                            {city.countryCode}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontVariantNumeric: 'tabular-nums' }}>
                          {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(city)}
                            disabled={deletingId === city.id}
                            title={`Evict and delete ${city.name}`}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              cursor: deletingId === city.id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {deletingId === city.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View: Stacked Touch-Friendly Card List (Eliminates horizontal scrolling) */}
                <div className="admin-mobile-cards">
                  {filteredCities.map((city) => (
                    <div
                      key={city.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{city.name}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'rgba(255, 255, 255, 0.8)',
                            }}
                          >
                            {city.countryCode}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                          Active
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontVariantNumeric: 'tabular-nums' }}>
                        Coordinates: {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(city)}
                        disabled={deletingId === city.id}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          touchAction: 'manipulation',
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#f87171',
                          borderRadius: '8px',
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: deletingId === city.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        {deletingId === city.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Stop Tracking & Evict Cache</span>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCityManager;
