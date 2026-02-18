import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Battery, Cpu, HardDrive, Wifi, Globe,
  Lock, Terminal, Zap, Smartphone, Search, X,
  Moon, Sun, ChevronRight, Radio, Shield, Code,
  Database, RefreshCw, AlertCircle, CheckCircle,
  Layers, Box, GitBranch, Antenna
} from 'lucide-react';

// ─── Theme System ──────────────────────────────────────────────────────────────
const themes = {
  dark: {
    bg: '#050a12',
    surface: 'rgba(255,255,255,0.04)',
    surfaceHover: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(99,210,255,0.4)',
    text: '#e8f4ff',
    textMuted: 'rgba(232,244,255,0.45)',
    accent: '#63d2ff',
    accentGlow: 'rgba(99,210,255,0.12)',
    accentAlt: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    glassBlur: 'blur(20px)',
  },
  light: {
    bg: '#eef2f7',
    surface: 'rgba(255,255,255,0.72)',
    surfaceHover: 'rgba(255,255,255,0.92)',
    border: 'rgba(0,0,0,0.08)',
    borderHover: 'rgba(37,99,235,0.45)',
    text: '#0f172a',
    textMuted: 'rgba(15,23,42,0.5)',
    accent: '#2563eb',
    accentGlow: 'rgba(37,99,235,0.1)',
    accentAlt: '#7c3aed',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    glassBlur: 'blur(20px)',
  }
};

// ─── Plugin Config ─────────────────────────────────────────────────────────────
const plugins = [
  { name: 'Network Scanner', icon: Globe, path: '/network', gradient: ['#0ea5e9', '#06b6d4'], status: 'active' },
  { name: 'Metasploit', icon: Zap, path: '/metasploit', gradient: ['#ef4444', '#f97316'], status: 'active' },
  { name: 'Reverse Eng.', icon: Code, path: '/reverse', gradient: ['#8b5cf6', '#ec4899'], status: 'active' },
  { name: 'WiFi Audit', icon: Wifi, path: '/wifi', gradient: ['#10b981', '#14b8a6'], status: 'idle' },
  { name: 'Web Tester', icon: Globe, path: '/web', gradient: ['#f59e0b', '#eab308'], status: 'idle' },
  { name: 'Script Runner', icon: Terminal, path: '/scripts', gradient: ['#6b7280', '#475569'], status: 'active' },
  { name: 'Root Assistant', icon: Smartphone, path: '/root', gradient: ['#6366f1', '#8b5cf6'], status: 'idle' },
  { name: 'Carrier Bypass', icon: Lock, path: '/carrier', gradient: ['#ec4899', '#f43f5e'], status: 'idle' },
  { name: 'FRP Removal', icon: Shield, path: '/frp', gradient: ['#f97316', '#ef4444'], status: 'idle' },
  { name: 'APK Analyzer', icon: Box, path: '/apk', gradient: ['#14b8a6', '#0ea5e9'], status: 'active' },
  { name: 'AI Agent', icon: Radio, path: '/ai', gradient: ['#a855f7', '#6366f1'], status: 'active' },
  { name: 'Backup', icon: Database, path: '/backup', gradient: ['#059669', '#10b981'], status: 'idle' },
];

const navItems = [
  ['Dashboard', '/'], ['Network', '/network'], ['Metasploit', '/metasploit'],
  ['Reverse Eng.', '/reverse'], ['WiFi', '/wifi'], ['Web Tester', '/web'],
  ['Scripts', '/scripts'], ['Root', '/root'], ['Carrier', '/carrier'],
  ['FRP', '/frp'], ['APK', '/apk'], ['AI Agent', '/ai'],
  ['Backup', '/backup'], ['Settings', '/settings'],
];

// ─── Live Stats Hook ───────────────────────────────────────────────────────────
function useStats() {
  const [stats, setStats] = useState({
    battery: 87, cpu: 34, memory: 61, network: 'T-Mobile 5G',
    ip: '192.168.1.42', uptime: '14h 32m', deviceName: 'Pixel 9 Pro',
    signal: 4, storage: 73,
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to real WebSocket when available
    let ws;
    try {
      ws = new WebSocket('ws://localhost:5000/socket.io/?EIO=4&transport=websocket');
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        try { const d = JSON.parse(e.data); if (d.battery !== undefined) setStats(d); } catch {}
      };
      ws.onclose = () => setConnected(false);
    } catch {}

    // Simulate realistic live data
    setConnected(true);
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 3)),
        battery: Math.max(10, Math.min(100, prev.battery - 0.04)),
      }));
    }, 2000);

    return () => { clearInterval(interval); if (ws) ws.close(); };
  }, []);

  return { stats, connected };
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatRing({ value, size = 58, stroke = 4.5, color, trackColor }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, raw, color, t }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? color + '50' : t.border}`,
        borderRadius: 18,
        padding: '18px 20px',
        backdropFilter: t.glassBlur,
        WebkitBackdropFilter: t.glassBlur,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 32px ${color}18` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at -10% 50%, ${color}12 0%, transparent 65%)`,
        pointerEvents: 'none', transition: 'opacity 0.3s',
        opacity: hovered ? 1 : 0.6,
      }} />
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <StatRing value={typeof raw === 'number' ? raw : 100} color={color} trackColor={`${color}18`} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10.5, color: t.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 5, fontWeight: 600,
        }}>{label}</div>
        <div style={{
          fontSize: 22, fontWeight: 700, color: t.text,
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1,
        }}>{value}</div>
      </div>
    </div>
  );
}

function PluginCard({ plugin, t, index }) {
  const [hovered, setHovered] = useState(false);
  const { icon: Icon, name, gradient, status } = plugin;
  const isActive = status === 'active';

  return (
    <div
      onClick={() => console.log(`Navigate to ${plugin.path}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 20,
        padding: '20px 18px',
        cursor: 'pointer',
        overflow: 'hidden',
        border: `1px solid ${hovered ? gradient[0] + '70' : t.border}`,
        background: hovered
          ? `linear-gradient(135deg, ${gradient[0]}1a, ${gradient[1]}12)`
          : t.surface,
        backdropFilter: t.glassBlur,
        WebkitBackdropFilter: t.glassBlur,
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 18px 44px ${gradient[0]}22` : 'none',
        animationName: 'fadeSlideIn',
        animationDuration: '0.4s',
        animationTimingFunction: 'ease',
        animationDelay: `${index * 0.04}s`,
        animationFillMode: 'both',
      }}
    >
      {/* Glowing blob */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 90, height: 90, borderRadius: '50%',
        background: `radial-gradient(circle, ${gradient[0]}28, transparent 70%)`,
        transition: 'opacity 0.3s',
        opacity: hovered ? 1 : 0.35,
        pointerEvents: 'none',
      }} />

      {/* Status indicator */}
      <div style={{
        position: 'absolute', top: 13, right: 13,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isActive ? '#34d399' : t.textMuted,
          boxShadow: isActive ? '0 0 10px #34d39990' : 'none',
          animation: isActive ? 'pulse 2.5s infinite' : 'none',
        }} />
      </div>

      {/* Icon pill */}
      <div style={{
        width: 46, height: 46, borderRadius: 13,
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        boxShadow: hovered
          ? `0 8px 24px ${gradient[0]}50`
          : `0 4px 14px ${gradient[0]}28`,
        transition: 'box-shadow 0.3s',
      }}>
        <Icon size={21} color="#fff" />
      </div>

      <div style={{
        fontSize: 14, fontWeight: 700, color: t.text,
        marginBottom: 5, lineHeight: 1.2,
      }}>{name}</div>

      <div style={{
        fontSize: 11, color: isActive ? '#34d399' : t.textMuted,
        display: 'flex', alignItems: 'center', gap: 5,
        textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: isActive ? '#34d399' : t.textMuted,
          flexShrink: 0,
        }} />
        {isActive ? 'Active' : 'Idle'}
      </div>

      {/* Arrow */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translate(0,0)' : 'translate(-4px,0)',
        transition: 'all 0.2s',
        color: gradient[0],
      }}>
        <ChevronRight size={15} />
      </div>
    </div>
  );
}

function SignalBars({ level, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 4.5, height: `${22 * i}%`,
          borderRadius: 2,
          background: i <= level ? color : `${color}28`,
          transition: 'background 0.4s',
        }} />
      ))}
    </div>
  );
}

function CommandPalette({ open, onClose, t }) {
  const [query, setQuery] = useState('');
  const filtered = navItems.filter(([name]) =>
    name.toLowerCase().includes(query.toLowerCase())
  );
  useEffect(() => { if (!open) setQuery(''); }, [open]);
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '14vh', animation: 'fadeSlideIn 0.15s ease',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: t.bg === '#050a12'
          ? 'rgba(8,16,28,0.97)' : 'rgba(255,255,255,0.97)',
        border: `1px solid ${t.border}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: `0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px ${t.accent}25`,
      }} onClick={e => e.stopPropagation()}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', borderBottom: `1px solid ${t.border}`,
        }}>
          <Search size={15} color={t.textMuted} />
          <input
            autoFocus value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            placeholder="Jump to module..."
            style={{
              flex: 1, background: 'transparent',
              border: 'none', outline: 'none',
              color: t.text, fontSize: 15,
              fontFamily: "'Syne', sans-serif",
            }}
          />
          <kbd style={{
            padding: '2px 7px', borderRadius: 6, fontSize: 11,
            background: t.surface, border: `1px solid ${t.border}`,
            color: t.textMuted, fontFamily: "'JetBrains Mono', monospace",
          }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0
            ? <div style={{ padding: '20px', textAlign: 'center', color: t.textMuted, fontSize: 13 }}>
                No modules found
              </div>
            : filtered.map(([name, path]) => (
              <div key={path}
                style={{
                  padding: '11px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: `1px solid ${t.border}`,
                  color: t.text, fontSize: 14, transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => { console.log('Navigate:', path); onClose(); }}
              >
                <span style={{ fontWeight: 500 }}>{name}</span>
                <ChevronRight size={14} color={t.textMuted} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isDark, setIsDark] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const t = themes[isDark ? 'dark' : 'light'];
  const { stats, connected } = useStats();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredPlugins = activeTab === 'all' ? plugins
    : plugins.filter(p => p.status === activeTab);

  const battColor = stats.battery > 60 ? t.success : stats.battery > 25 ? t.warning : t.danger;
  const cpuColor = stats.cpu < 50 ? t.success : stats.cpu < 75 ? t.warning : t.danger;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
          .plugin-grid { grid-template-columns: 1fr 1fr !important; }
          .nav-links { display: none !important; }
          .header-search span { display: none !important; }
        }
        @media (max-width: 400px) {
          .stat-grid { grid-template-columns: 1fr !important; }
          .plugin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: t.bg, transition: 'background 0.4s' }}>
        {isDark ? <>
          <div style={{
            position: 'absolute', top: '-15%', left: '-8%',
            width: '55vw', height: '55vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,210,255,0.055) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-12%', right: '-6%',
            width: '45vw', height: '45vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.055) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '40%', left: '35%',
            width: '30vw', height: '30vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
        </> : <>
          <div style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: '50vw', height: '50vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-8%', left: '-5%',
            width: '40vw', height: '40vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%)',
          }} />
        </>}
      </div>

      <div style={{
        fontFamily: "'Syne', sans-serif",
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        color: t.text,
        paddingBottom: 48,
        transition: 'color 0.3s',
      }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 200,
          borderBottom: `1px solid ${t.border}`,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          background: isDark ? 'rgba(5,10,18,0.82)' : 'rgba(238,242,247,0.82)',
          transition: 'background 0.3s',
        }}>
          <div style={{
            maxWidth: 1400, margin: '0 auto',
            display: 'flex', alignItems: 'center',
            height: 62, padding: '0 24px', gap: 18,
          }}>
            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `linear-gradient(135deg, ${t.accent}, ${t.accentAlt})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 14px ${t.accent}40`,
              }}>
                <GitBranch size={15} color="#fff" />
              </div>
              <span style={{
                fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.025em', color: t.text,
              }}>
                KN3AUX<span style={{ color: t.accent }}>.</span>CODE
              </span>
            </div>

            {/* Nav */}
            <nav className="nav-links" style={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }}>
              {['Dashboard', 'Network', 'Metasploit', 'WiFi', 'Scripts', 'AI Agent'].map((item, i) => (
                <button key={item} style={{
                  background: i === 0 ? t.accentGlow : 'transparent',
                  border: `1px solid ${i === 0 ? t.accent + '35' : 'transparent'}`,
                  borderRadius: 8, padding: '5px 11px',
                  fontSize: 13, fontWeight: 600,
                  color: i === 0 ? t.accent : t.textMuted,
                  cursor: 'pointer', transition: 'all 0.18s',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { if (i !== 0) { e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.surface; } }}
                  onMouseLeave={e => { if (i !== 0) { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; } }}
                >{item}</button>
              ))}
            </nav>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <button
                className="header-search"
                onClick={() => setCmdOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 10, padding: '6px 12px',
                  color: t.textMuted, cursor: 'pointer', fontSize: 13,
                  transition: 'all 0.18s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderHover; e.currentTarget.style.color = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
              >
                <Search size={14} />
                <span>Search</span>
                <kbd style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 4,
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                  border: `1px solid ${t.border}`,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>⌘K</kbd>
              </button>

              {/* WS badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600,
                color: connected ? t.success : t.danger,
                background: connected ? `${t.success}14` : `${t.danger}14`,
                border: `1px solid ${connected ? t.success + '30' : t.danger + '30'}`,
                borderRadius: 7, padding: '4px 9px',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: connected ? t.success : t.danger,
                  boxShadow: connected ? `0 0 7px ${t.success}` : 'none',
                  animation: connected ? 'pulse 2s infinite' : 'none',
                  flexShrink: 0,
                }} />
                {connected ? 'Live' : 'Off'}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setIsDark(d => !d)}
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: t.surface, border: `1px solid ${t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: t.textMuted,
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderHover; e.currentTarget.style.color = t.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 24px' }}>

          {/* Hero */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 28,
            flexWrap: 'wrap', gap: 14,
            animation: 'fadeSlideIn 0.4s ease both',
          }}>
            <div>
              <h1 style={{
                fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
                color: t.text, lineHeight: 1.2,
              }}>
                System <span style={{ color: t.accent }}>Overview</span>
              </h1>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, marginTop: 7,
                flexWrap: 'wrap',
              }}>
                <Smartphone size={12} color={t.textMuted} />
                <span style={{
                  fontSize: 12.5, color: t.textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {stats.deviceName} &nbsp;·&nbsp; {stats.ip} &nbsp;·&nbsp; ↑{stats.uptime}
                </span>
              </div>
            </div>

            {/* Network badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 14, padding: '11px 16px',
              backdropFilter: t.glassBlur, WebkitBackdropFilter: t.glassBlur,
            }}>
              <SignalBars level={stats.signal} color={t.success} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{stats.network}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Connected</div>
              </div>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: t.success, boxShadow: `0 0 9px ${t.success}`,
                animation: 'pulse 2s infinite',
              }} />
            </div>
          </div>

          {/* Stats */}
          <div
            className="stat-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12, marginBottom: 28,
            }}
          >
            <StatCard icon={Battery} label="Battery" value={`${Math.round(stats.battery)}%`} raw={stats.battery} color={battColor} t={t} />
            <StatCard icon={Cpu} label="CPU Usage" value={`${Math.round(stats.cpu)}%`} raw={stats.cpu} color={cpuColor} t={t} />
            <StatCard icon={HardDrive} label="Memory" value={`${Math.round(stats.memory)}%`} raw={stats.memory} color={t.accent} t={t} />
            <StatCard icon={Database} label="Storage" value={`${stats.storage}%`} raw={stats.storage} color={t.accentAlt} t={t} />
          </div>

          {/* Module header + tabs */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 18,
            flexWrap: 'wrap', gap: 12,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: t.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              Modules
              <span style={{
                fontSize: 11.5, fontWeight: 700,
                color: t.textMuted,
                background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: 6, padding: '2px 8px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {filteredPlugins.length}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'active', 'idle'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '5px 14px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.18s',
                  fontFamily: 'inherit', textTransform: 'capitalize',
                  background: activeTab === tab ? t.accent : t.surface,
                  border: `1px solid ${activeTab === tab ? t.accent : t.border}`,
                  color: activeTab === tab ? (isDark ? '#000d1a' : '#fff') : t.textMuted,
                  boxShadow: activeTab === tab ? `0 4px 14px ${t.accent}35` : 'none',
                }}>{tab}</button>
              ))}
            </div>
          </div>

          {/* Plugin grid */}
          <div
            className="plugin-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
              gap: 12, marginBottom: 36,
            }}
          >
            {filteredPlugins.map((p, i) => (
              <PluginCard key={p.name} plugin={p} t={t} index={i} />
            ))}
          </div>

          {/* Status bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 14, padding: '12px 20px',
            backdropFilter: t.glassBlur, WebkitBackdropFilter: t.glassBlur,
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textMuted }}>
                <CheckCircle size={13} color={t.success} />
                <span><b style={{ color: t.success }}>{plugins.filter(p => p.status === 'active').length}</b> modules active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textMuted }}>
                <AlertCircle size={13} color={t.warning} />
                <span><b style={{ color: t.warning }}>{plugins.filter(p => p.status === 'idle').length}</b> idle</span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: t.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <RefreshCw size={11} style={{ animation: 'spin 4s linear infinite', opacity: 0.6 }} />
              <span>Refreshing every 2s</span>
            </div>
          </div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} t={t} />
    </>
  );
}
