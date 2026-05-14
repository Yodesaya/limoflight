// LimoFlight V4 — src/context/NotifContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const NotifCtx = createContext(null)

/**
 * Notification shape:
 *   { id, type, title, body, icon, unread, time }
 *
 * type values: face_match | booking | gps_alert | billing | maintenance | whatsapp | capcut
 */
export function NotificationProvider({ children }) {
  const [notifs, setNotifs] = useState([
    {
      id: 1,
      type: 'face_match',
      title: 'Face match — Capt. Williams',
      body: '94% confidence · booking auto-filled',
      icon: 'ti-scan',
      color: '#5DC48A',
      unread: true,
      time: '2 min ago',
    },
    {
      id: 2,
      type: 'booking',
      title: 'Lincoln MKT #01 — arrived',
      body: 'Capt. Williams pickup confirmed at LAX Gate 4',
      icon: 'ti-map-pin',
      color: '#C9A84C',
      unread: true,
      time: '8 min ago',
    },
    {
      id: 3,
      type: 'capcut',
      title: 'CapCut reel ready',
      body: 'Beverly Hills Tour · 47 sec · 4K — ready to share',
      icon: 'ti-video',
      color: '#AFA9EC',
      unread: true,
      time: '15 min ago',
    },
    {
      id: 4,
      type: 'maintenance',
      title: 'Fleet maintenance due',
      body: 'Lincoln MKT #06 — service overdue by 200 mi',
      icon: 'ti-alert-triangle',
      color: '#D47A7A',
      unread: false,
      time: '1 hr ago',
    },
  ])

  const addNotif = useCallback((notif) => {
    const newNotif = {
      id:     Date.now(),
      icon:   'ti-bell',
      color:  '#C9A84C',
      unread: true,
      time:   'Just now',
      ...notif,
    }
    setNotifs(prev => [newNotif, ...prev].slice(0, 30)) // keep last 30
  }, [])

  const markRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }, [])

  const clearAll = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })))
  }, [])

  const removeNotif = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }, [])

  const unreadCount = notifs.filter(n => n.unread).length

  return (
    <NotifCtx.Provider value={{ notifs, addNotif, markRead, clearAll, removeNotif, unreadCount }}>
      {children}
    </NotifCtx.Provider>
  )
}

export function useNotif() {
  const ctx = useContext(NotifCtx)
  if (!ctx) throw new Error('useNotif must be used inside <NotificationProvider>')
  return ctx
}
