// LimoFlight V4 — pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useBrand } from '../context/BrandContext'
import { useNotif } from '../context/NotifContext'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { brand } = useBrand()
  const { addNotif } = useNotif()
  const navigate = useNavigate()
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  const [stats, setStats] = useState({ rides: 12, revenue: 3840, pilots: 47, fleet: '5/8' })
  const [bookings, setBookings] = useState([])
  const [modules, setModules] = useState({ faceLastMatch: 'Capt. Williams · 94%', reelCount: 3, venueBookings: 7 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
    const iv = setInterval(loadDashboard, 30_000) // refresh every 30s
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (chartRef.current) buildChart()
    return () => chartInstance.current?.destroy()
  }, [brand.color])

  async function loadDashboard() {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/api/analytics/stats/today`),
        axios.get(`${API}/api/booking?limit=5&status=active,confirmed`),
      ])
      setStats(statsRes.data)
      setBookings(bookingsRes.data)
    } catch {
      // Use demo data if API not connected yet
    } finally {
      setLoading(false)
    }
  }

  function buildChart() {
    if (chartInstance.current) chartInstance.current.destroy()
    const ctx = chartRef.current.getContext('2d')
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [2800, 3200, 2600, 3900, 4800, 5200, 3840],
          borderColor: brand.color,
          backgroundColor: brand.color + '22',
          fill: true, tension: 0.4,
          pointRadius: 3, pointBackgroundColor: brand.color,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6A6560', font: { size: 9 } } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6A6560', font: { size: 9 }, callback: v => '$' + v.toLocaleString() } },
        },
        animation: { duration: 600 },
      },
    })
  }

  const demoBookings = [
    { id: 1, customerName: 'Capt. Williams', pax: 8, route: 'LAX → Beverly Hills', time: '2:30 PM', status: 'active' },
    { id: 2, customerName: 'F/O Chen', pax: 2, route: 'Hotel → Jazz District', time: '4:00 PM', status: 'confirmed' },
    { id: 3, customerName: 'Crew Delta 47', pax: 12, route: 'Airport → French Quarter', time: '6:30 PM', status: 'scheduled' },
    { id: 4, customerName: 'Capt. Rodriguez', pax: 1, route: 'Hotel → Dinner & Show', time: '7:15 PM', status: 'scheduled' },
  ]

  return (
    <div style={s.page}>
      {/* STAT CARDS */}
      <div style={s.statsRow}>
        {[
          { label: 'Today rides', value: stats.rides, sub: '↑ 3 from yesterday' },
          { label: 'Revenue', value: '$' + stats.revenue?.toLocaleString(), sub: '4 pending' },
          { label: 'Active pilots', value: stats.pilots, sub: 'On layover' },
          { label: 'Fleet online', value: stats.fleet, sub: '2 maintenance' },
        ].map((st, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statLabel}>{st.label}</div>
            <div style={{ ...s.statValue, color: brand.color }}>{st.value}</div>
            <div style={s.statSub}>{st.sub}</div>
          </div>
        ))}
      </div>

      {/* MODULE SHORTCUTS */}
      <div style={s.grid3}>
        {[
          { icon: '🔍', title: 'Face AI', sub: '6 profiles · engine online', detail: `Last match: ${modules.faceLastMatch}`, badge: '✓ Online', badgeColor: '#3A7D5A', path: '/face-ai' },
          { icon: '🏆', title: 'Fleet Plan', sub: 'All features unlocked', detail: 'Renews Jun 9 · $149/mo · Google Play', badge: 'Fleet', badgeColor: '#534AB7', path: '/billing' },
          { icon: '🎬', title: 'CapCut AI', sub: `${modules.reelCount} reels ready`, detail: 'Beverly Hills Tour · 47 sec · 4K', badge: 'AI Active', badgeColor: '#534AB7', path: '/capcut' },
        ].map((m, i) => (
          <div key={i} style={{ ...s.moduleCard, cursor: 'pointer' }} onClick={() => navigate(m.path)}>
            <div style={s.moduleHead}>
              <div style={s.moduleIcon}>{m.icon}</div>
              <div>
                <div style={s.moduleTitle}>{m.title}</div>
                <div style={{ fontSize: 10, color: '#5DC48A' }}>{m.sub}</div>
              </div>
              <div style={{ ...s.badge, background: m.badgeColor + '30', color: m.badgeColor, marginLeft: 'auto' }}>
                {m.badge}
              </div>
            </div>
            <div style={s.divider} />
            <div style={{ fontSize: 10, color: '#6A6560' }}>{m.detail}</div>
          </div>
        ))}
      </div>

      {/* CHART + BOOKINGS */}
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardTitle}>Revenue trend — 7 days</div>
          <canvas ref={chartRef} height={120} />
        </div>
        <div style={s.card}>
          <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Today's bookings
            <button style={{ ...s.btnSmall, background: brand.color, color: '#08080E', border: 'none' }}
              onClick={() => navigate('/booking')}>+ New</button>
          </div>
          {demoBookings.map(b => (
            <div key={b.id} style={s.bookingRow}>
              <div style={s.bookingIcon}>✈</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{b.customerName} × {b.pax}</div>
                <div style={{ fontSize: 10, color: '#6A6560' }}>{b.route}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: brand.color }}>{b.time}</div>
                <div style={{ ...s.badge, background: b.status === 'active' ? 'rgba(58,125,90,.15)' : 'rgba(42,74,122,.2)', color: b.status === 'active' ? '#5DC48A' : '#7AAAE0', marginTop: 2 }}>
                  {b.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { padding: 0, color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 },
  statCard: { background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 9, padding: '10px 13px' },
  statLabel: { fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6A6560', marginBottom: 3 },
  statValue: { fontFamily: "'Playfair Display', serif", fontSize: 22 },
  statSub: { fontSize: 9, color: '#6A6560', marginTop: 2 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 },
  moduleCard: { background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: 12 },
  moduleHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  moduleIcon: { width: 34, height: 34, borderRadius: 8, background: '#1C1C27', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  moduleTitle: { fontSize: 12, fontWeight: 500 },
  card: { background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: 12 },
  cardTitle: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: '#6A6560', marginBottom: 10 },
  divider: { height: 1, background: 'rgba(201,168,76,.12)', margin: '8px 0' },
  badge: { display: 'inline-flex', padding: '1px 7px', borderRadius: 20, fontSize: 9, fontWeight: 500 },
  bookingRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' },
  bookingIcon: { width: 28, height: 28, borderRadius: 7, background: '#1C1C27', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnSmall: { padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'inherit', cursor: 'pointer' },
}
