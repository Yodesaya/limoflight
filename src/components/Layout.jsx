// LimoFlight V4 — src/components/Layout.jsx
import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBrand } from '../context/BrandContext'
import { useNotif } from '../context/NotifContext'

const NAV = [
  {
    section: 'Main',
    items: [
      { path: '/',           label: 'Dashboard',     icon: 'ti-layout-dashboard' },
      { path: '/booking',    label: 'New Booking',   icon: 'ti-calendar-plus' },
      { path: '/tracking',   label: 'Live Tracking', icon: 'ti-map-pin',          badge: '5' },
    ],
  },
  {
    section: 'Tools',
    items: [
      { path: '/face-ai',    label: 'Face AI',       icon: 'ti-scan' },
      { path: '/driver-app', label: 'Driver App',    icon: 'ti-device-mobile' },
      { path: '/capcut',     label: 'CapCut AI',     icon: 'ti-video' },
    ],
  },
  {
    section: 'Business',
    items: [
      { path: '/opentable',  label: 'OpenTable',     icon: 'ti-building-store' },
      { path: '/analytics',  label: 'Analytics AI',  icon: 'ti-brain' },
      { path: '/whitelabel', label: 'White-label',   icon: 'ti-brush' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { path: '/billing',    label: 'Billing',       icon: 'ti-credit-card' },
      { path: '/security',   label: 'Security',      icon: 'ti-shield-check' },
    ],
  },
]

export default function Layout() {
  const { user, logout }                  = useAuth()
  const { brand }                         = useBrand()
  const { notifs, markRead, clearAll, unreadCount } = useNotif()
  const navigate                          = useNavigate()
  const { pathname }                      = useLocation()
  const [showNotifs, setShowNotifs]       = useState(false)
  const notifRef                          = useRef(null)

  // Close notification dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <div style={s.app}>
      {/* ── TOPBAR ── */}
      <div style={s.topbar}>
        <div style={{ ...s.logo, color: brand.color, fontFamily: `'${brand.font}', serif` }}>
          {brand.logo} {brand.name}
        </div>

        <div style={{ flex: 1 }} />

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            aria-label="Notifications"
            onClick={() => setShowNotifs(v => !v)}
            style={s.iconBtn}
          >
            <i className="ti ti-bell" style={{ fontSize: 15 }} aria-hidden="true" />
            {unreadCount > 0 && (
              <div style={s.badge}>{unreadCount}</div>
            )}
          </button>

          {showNotifs && (
            <div style={s.notifPanel}>
              <div style={s.notifHeader}>
                <span>Notifications</span>
                <span
                  style={{ fontSize: 10, color: '#6A6560', cursor: 'pointer' }}
                  onClick={clearAll}
                >
                  Mark all read
                </span>
              </div>
              {notifs.length === 0 && (
                <div style={{ padding: 16, fontSize: 11, color: '#6A6560', textAlign: 'center' }}>
                  No notifications
                </div>
              )}
              {notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    ...s.notifItem,
                    background: n.unread ? 'rgba(201,168,76,.03)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ ...s.notifIcon, color: n.color }}>
                      <i className={`ti ${n.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: n.unread ? '#E8E4D9' : '#6A6560', marginBottom: 1 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#6A6560' }}>{n.body}</div>
                      <div style={{ fontSize: 9, color: '#3A3830', marginTop: 2 }}>{n.time}</div>
                    </div>
                    {n.unread && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: brand.color, flexShrink: 0, marginTop: 3 }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ ...s.avatar, background: brand.color }}>{initials}</div>
        <span style={{ fontSize: 11, color: '#6A6560' }}>{user?.full_name || 'Admin'}</span>
        <span style={s.planBadge}>{user?.plan || 'fleet'}</span>
        <button onClick={logout} style={s.logoutBtn}>Sign out</button>
      </div>

      {/* ── SIDEBAR ── */}
      <nav style={s.sidebar}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={s.navSection}>{section}</div>
            {items.map(item => {
              const active = pathname === item.path
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    ...s.navItem,
                    color:       active ? brand.color : '#6A6560',
                    background:  active ? `${brand.color}0F` : 'transparent',
                    borderLeft:  `2px solid ${active ? brand.color : 'transparent'}`,
                  }}
                >
                  <i className={`ti ${item.icon}`} style={{ fontSize: 14, width: 15, flexShrink: 0 }} aria-hidden="true" />
                  {item.label}
                  {item.badge && (
                    <span style={{ ...s.navBadge, background: `${brand.color}20`, color: brand.color }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  app: {
    display: 'grid',
    gridTemplateColumns: '196px 1fr',
    gridTemplateRows: '46px 1fr',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#08080E',
    color: '#E8E4D9',
  },
  topbar: {
    gridColumn: '1 / -1',
    background: '#111118',
    borderBottom: '1px solid rgba(201,168,76,.15)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    gap: 10,
    position: 'relative',
    zIndex: 20,
  },
  logo: {
    fontSize: 15,
    letterSpacing: '.5px',
    whiteSpace: 'nowrap',
    marginRight: 8,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: 7,
    background: '#1C1C27',
    border: '1px solid rgba(201,168,76,.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#E8E4D9', position: 'relative',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    width: 15, height: 15, borderRadius: '50%',
    background: '#D47A7A', color: '#fff',
    fontSize: 8, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  notifPanel: {
    position: 'absolute', top: 36, right: 0,
    width: 290,
    background: '#16161F',
    border: '1px solid rgba(201,168,76,.18)',
    borderRadius: 10,
    zIndex: 100,
    maxHeight: 400,
    overflowY: 'auto',
  },
  notifHeader: {
    padding: '9px 13px',
    borderBottom: '1px solid rgba(201,168,76,.12)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 11, fontWeight: 500,
  },
  notifItem: {
    padding: '9px 13px',
    borderBottom: '1px solid rgba(255,255,255,.04)',
    cursor: 'pointer',
    transition: 'background .12s',
  },
  notifIcon: {
    width: 24, height: 24, borderRadius: 6,
    background: '#1C1C27',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 26, height: 26, borderRadius: '50%',
    color: '#08080E', fontSize: 10, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  planBadge: {
    background: 'rgba(83,74,183,.2)', color: '#AFA9EC',
    fontSize: 9, padding: '1px 7px', borderRadius: 10,
  },
  logoutBtn: {
    fontSize: 10, color: '#6A6560',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px 6px',
  },
  sidebar: {
    background: '#111118',
    borderRight: '1px solid rgba(201,168,76,.15)',
    overflowY: 'auto',
    padding: '8px 0',
  },
  navSection: {
    fontSize: 8, letterSpacing: 1.5,
    textTransform: 'uppercase', color: '#3A3830',
    padding: '10px 12px 3px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '7px 12px', fontSize: 11,
    cursor: 'pointer', transition: 'all .13s',
  },
  navBadge: {
    marginLeft: 'auto',
    fontSize: 8, padding: '1px 5px', borderRadius: 8,
  },
  main: {
    overflowY: 'auto',
    background: '#08080E',
    padding: 14,
  },
}
