import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, ChevronDown, X, MapPin, Check } from 'lucide-react';

/**
 * CityDropdown: Accessible, searchable glassmorphic combobox for selecting cities.
 * Positioned on top-right to prevent covering the central weather presentation.
 * Anchors the floating list to the right (right: 0) and includes keyboard navigation.
 */
export default function CityDropdown({
  cities = [],
  selectedCity = '',
  onSelectCity,
  featuredCities = ['Tokyo', 'London', 'New York', 'Paris', 'Dubai', 'Sydney', 'Singapore', 'Berlin'],
  loading = false,
  showPills = false,
  align = 'right',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities by search term
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return cities;
    const query = searchTerm.toLowerCase().trim();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(query) || c.countryCode.toLowerCase().includes(query)
    );
  }, [cities, searchTerm]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredCities.length ? prev + 1 : 0));
      scrollHighlightedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCities.length - 1));
      scrollHighlightedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCities[highlightedIndex]) {
        handleSelect(filteredCities[highlightedIndex].name);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const scrollHighlightedIntoView = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        const items = listRef.current.querySelectorAll('.city-option-item');
        if (items[highlightedIndex]) {
          items[highlightedIndex].scrollIntoView({ block: 'nearest' });
        }
      }
    });
  };

  const handleSelect = (cityName) => {
    if (onSelectCity) {
      onSelectCity(cityName);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Searchable Combobox Input */}
      <div ref={dropdownRef} style={{ position: 'relative', width: '100%', minWidth: '220px', maxWidth: '300px' }}>
        <div
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: isOpen ? '1px solid rgba(56, 189, 248, 0.7)' : '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: isOpen
              ? '0 0 16px rgba(56, 189, 248, 0.3), var(--glass-border-inner)'
              : 'var(--glass-shadow-sm), var(--glass-border-inner)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'text',
          }}
        >
          <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="Select or search city"
            placeholder={
              selectedCity
                ? `${selectedCity}...`
                : `Search ${cities.length} cities...`
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '500',
              fontFamily: 'var(--font-sans)',
              width: '100%',
            }}
          />
          {searchTerm ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <ChevronDown
              size={14}
              color="var(--text-muted)"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {/* Floating Dropdown Results Menu - Positioned to the right to never cover central weather */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={listRef}
              role="listbox"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scale: 0.98 }}
              transition={{ duration: shouldReduceMotion ? 0.05 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: '100%',
                right: align === 'right' ? 0 : 'auto',
                left: align === 'left' ? 0 : 'auto',
                width: '340px',
                maxHeight: '400px',
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(56, 189, 248, 0.15)',
                overflowY: 'auto',
                zIndex: 999,
                padding: '8px',
              }}
            >
              {/* Header Info */}
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Tracked Cities ({filteredCities.length})</span>
                <span>1-Click Weather</span>
              </div>

              {/* Quick Featured Hubs inside Dropdown */}
              {featuredCities && featuredCities.length > 0 && !searchTerm && (
                <div style={{ padding: '8px 6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Popular Hubs:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {featuredCities.map((hub) => {
                      const isActive = selectedCity.toLowerCase() === hub.toLowerCase();
                      return (
                        <button
                          key={hub}
                          type="button"
                          onClick={() => handleSelect(hub)}
                          style={{
                            background: isActive
                              ? 'rgba(56, 189, 248, 0.35)'
                              : 'rgba(255, 255, 255, 0.08)',
                            border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: isActive ? '600' : '400',
                            cursor: 'pointer',
                          }}
                        >
                          {hub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredCities.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  No tracked cities match "{searchTerm}"
                </div>
              ) : (
                filteredCities.map((c, idx) => {
                  const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={c.id || c.name}
                      role="option"
                      aria-selected={isSelected}
                      className="city-option-item"
                      onClick={() => handleSelect(c.name)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isSelected
                          ? 'rgba(56, 189, 248, 0.22)'
                          : isHighlighted
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'transparent',
                        color: isSelected ? '#38bdf8' : 'var(--text-primary)',
                        transition: 'background 0.12s ease',
                        fontSize: '13px',
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin
                          size={13}
                          color={isSelected ? '#38bdf8' : 'var(--text-muted)'}
                          style={{ flexShrink: 0 }}
                        />
                        <span>{c.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isSelected
                              ? 'rgba(56, 189, 248, 0.3)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {c.countryCode}
                        </span>
                        {isSelected && <Check size={13} color="#38bdf8" />}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Optional pill strip */}
      {showPills && featuredCities && featuredCities.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {featuredCities.map((hub) => {
            const isActive = selectedCity.toLowerCase() === hub.toLowerCase();
            return (
              <button
                key={hub}
                type="button"
                onClick={() => handleSelect(hub)}
                disabled={loading}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.45) 100%)'
                    : 'rgba(255, 255, 255, 0.07)',
                  border: isActive
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {hub}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
