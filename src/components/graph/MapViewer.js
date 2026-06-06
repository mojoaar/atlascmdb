'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapViewer.module.css';

const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://carto.com/">CARTO</a>';

function isDarkMode() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

const MARKER_ICONS = {
  Country: '#1b5e20',
  'Data Center': '#c62828',
  Office: '#1565c0',
  default: '#6a1b9a',
};

function createIcon(color) {
  if (typeof window === 'undefined') return null;
  const L = require('leaflet');
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
}

export default function MapViewer({ markers = [], center, zoom = 5, height = 300, compact = false }) {
  const [mounted, setMounted] = useState(false);
  const [icons, setIcons] = useState(null);
  const [dark, setDark] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(isDarkMode());
    setIcons({
      Country: createIcon(MARKER_ICONS.Country),
      'Data Center': createIcon(MARKER_ICONS['Data Center']),
      Office: createIcon(MARKER_ICONS.Office),
      default: createIcon(MARKER_ICONS.default),
    });
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>Loading map...</div>;
  }

  const defaultCenter = center || (markers[0] ? [markers[0].latitude, markers[0].longitude] : [56.0, 10.0]);
  const mapHeight = expanded ? '70vh' : (compact ? height : '100%');

  return (
    <div className={compact && !expanded ? styles.compact : styles.viewer} style={{ position: 'relative', ...(expanded ? { height: mapHeight } : {}) }}>
      <button
        onClick={() => setExpanded(e => !e)}
        title={expanded ? 'Collapse map' : 'Expand map'}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 1000,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '4px 8px', cursor: 'pointer',
          fontSize: '0.75rem', color: 'var(--foreground)', lineHeight: 1,
        }}
      >
        {expanded ? '⊟' : '⊞'}
      </button>
      <MapContainer
        key={expanded ? 'expanded' : 'compact'}
        center={defaultCenter}
        zoom={zoom}
        className={styles.map}
        style={{ height: mapHeight, minHeight: expanded ? '50vh' : undefined }}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={dark ? 'dark' : 'light'}
          attribution={dark ? DARK_ATTR : LIGHT_ATTR}
          url={dark ? DARK_TILES : LIGHT_TILES}
        />
        {markers.map((m, i) => {
          const icon = icons?.[m.type] || icons?.default;
          return (
            <Marker
              key={m.id || i}
              position={[m.latitude, m.longitude]}
              icon={icon}
            >
              <Popup>
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong>{m.name}</strong>
                  {m.type && <div style={{ color: 'var(--muted-foreground)', marginTop: 2 }}>{m.type}</div>}
                  {m.description && <div style={{ marginTop: 4, color: 'var(--foreground)' }}>{m.description}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
