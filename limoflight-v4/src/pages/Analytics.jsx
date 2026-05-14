// LimoFlight V4 — pages/Analytics.jsx
import { useEffect, useRef } from 'react'
import { useBrand } from '../context/BrandContext'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const INSIGHTS = [
  { icon: 'ti-trending-up', title: 'Peak window: Friday 7–11 PM', body: 'Pilots on layover peak Friday nights. Recommend surge pricing +15% and 3 extra vehicles. Projected uplift: +$1,200/week.' },
  { icon: 'ti-map-pin',     title: 'Top route: LAX → Beverly Hills', body: '34% of all rides. Adding a Sprinter for groups 8+ would reduce refusals by 22% and add $800/week.' },
  { icon: 'ti-users',       title: 'VIP segment growing fast', body: 'Pilots with 5+ rides = 31% of revenue. A "LimoGold" loyalty tier could increase retention by 40%.' },
]

const KPI = [
  { label: 'Fleet utilization',  val: 78,  target: 85,  unit: '%' },
  { label: 'On-time arrival',    val: 91,  target: 95,  unit: '%' },
  { label: 'Customer rating',    val: 96,  target: 95,  unit: '%' },
  { label: 'Revenue per driver', val: 480, target: 500, unit: '$' },
  { label: 'Venue commission',   val: 840, target: 1000,unit: '$' },
]

export default function Analytics() {
  const { brand } = useBrand()
  const forecastRef = useRef(null)
  const pieRef = useRef(null)
  const fcInstance = useRef(null)
  const pieInstance = useRef(null)

  useEffect(() => {
    buildForecast(); buildPie()
    return () => { fcInstance.current?.destroy(); pieInstance.current?.destroy() }
  }, [brand.color])

  function buildForecast() {
    fcInstance.current?.destroy()
    const ctx = forecastRef.current?.getContext('2d')
    if (!ctx) return
    const hist = [38200, 41000, 39500, 43800, 46200, 48200]
    const fore = [48200, 49800, 51200, 52400, 54000, 55800, 53200]
    fcInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].slice(0, hist.length + fore.length - 1),
        datasets: [
          { label: 'Actual', data: [...hist, ...Array(fore.length - 1).fill(null)], borderColor: brand.color, backgroundColor: brand.color + '22', fill: true, tension: 0.4, pointRadius: 2 },
          { label: 'AI Forecast', data: [...Array(hist.length - 1).fill(null), ...fore], borderColor: '#AFA9EC', borderDash: [5, 4], backgroundColor: 'rgba(83,74,183,.1)', fill: true, tension: 0.4, pointRadius: 2 },
        ],
      },
      options: { plugins: { legend: { labels: { color: '#6A6560', font: { size: 9 }, boxWidth: 10 } } }, scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6A6560', font: { size: 9 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#6A6560', font: { size: 9 }, callback: v => '$' + v.toLocaleString() } } } },
    })
  }

  function buildPie() {
    pieInstance.current?.destroy()
    const ctx = pieRef.current?.getContext('2d')
    if (!ctx) return
    pieInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Los Angeles', 'Las Vegas', 'New York', 'Miami', 'New Orleans'], datasets: [{ data: [38, 26, 20, 10, 6], backgroundColor: [brand.color, '#5DC48A', '#7AAAE0', '#AFA9EC', '#F0997B'], borderWidth: 0, hoverOffset: 4 }] },
      options: { plugins: { legend: { position: 'right', labels: { color: '#6A6560', font: { size: 9 }, boxWidth: 10, padding: 8 } } }, cutout: '65%' },
    })
  }

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={card}><div style={ct}>Revenue forecast — 12 months</div><canvas ref={forecastRef} height={130} /></div>
        <div style={card}><div style={ct}>Rides by city</div><canvas ref={pieRef} height={130} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={ct}>AI insights</div>
          {INSIGHTS.map((ins, i) => (
            <div key={i} style={{ background: 'rgba(83,74,183,.15)', border: '1px solid rgba(83,74,183,.25)', borderRadius: 9, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <i className={`ti ${ins.icon}`} style={{ fontSize: 14, color: '#AFA9EC' }} />
                <div style={{ fontSize: 11, fontWeight: 500, color: '#AFA9EC' }}>{ins.title}</div>
              </div>
              <div style={{ fontSize: 10, color: '#6A6560', lineHeight: 1.6 }}>{ins.body}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={ct}>KPI performance</div>
          {KPI.map((k, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: '#6A6560' }}>{k.label}</span>
                <span style={{ color: k.val >= k.target ? '#5DC48A' : '#C9A84C', fontWeight: 500 }}>
                  {k.unit === '$' ? '$' + k.val : k.val + k.unit} <span style={{ color: '#6A6560', fontSize: 9 }}>/ {k.unit === '$' ? '$' + k.target : k.target + k.unit}</span>
                </span>
              </div>
              <div style={{ height: 4, background: '#1C1C27', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: k.val >= k.target ? '#5DC48A' : '#C9A84C', width: Math.min(Math.round(k.val / k.target * 100), 100) + '%', transition: 'width .5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

