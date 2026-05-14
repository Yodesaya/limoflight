// LimoFlight V4 — pages/Tracking.jsx
import { useEffect, useRef, useState } from 'react'
import { initLiveMap, startLiveTracking, stopLiveTracking, getETA } from '../api/maps'
import { useBrand } from '../context/BrandContext'

export default function Tracking() {
  const { brand } = useBrand()
  const mapRef = useRef(null)
  const [vehicles, setVehicles] = useState([
    { id: 'v1', code: '#01', model: 'Lincoln MKT',        driver: 'Mike Torres',  pax: 8,  status: 'on-route',  eta: 12, color: '#C9A84C' },
    { id: 'v2', code: '#02', model: 'Cadillac Escalade',   driver: 'Sarah Kim',    pax: 2,  status: 'on-route',  eta: 6,  color: '#5DC48A' },
    { id: 'v3', code: '#03', model: 'Lincoln Navigator',   driver: 'James Lee',    pax: 6,  status: 'on-route',  eta: 18, color: '#7AAAE0' },
    { id: 'v4', code: '#04', model: 'Mercedes Sprinter',   driver: 'Ana Reyes',    pax: 14, status: 'on-route',  eta: 9,  color: '#AFA9EC' },
    { id: 'v5', code: '#05', model: 'Cadillac CT6',        driver: 'Tom Walsh',    pax: 4,  status: 'dispatched',eta: 22, color: '#F0997B' },
  ])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let map
    async function init() {
      map = await initLiveMap(mapRef.current)
      startLiveTracking(update => {
        setVehicles(prev => prev.map(v => v.id === update.vehicleId ? { ...v, ...update } : v))
      })
    }
    if (mapRef.current) init()
    return () => stopLiveTracking()
  }, [])

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
        {[{ l: 'On route', v: 4, c: '#5DC48A' }, { l: 'Dispatched', v: 1, c: '#C9A84C' }, { l: 'Passengers', v: 34, c: '#E8E4D9' }, { l: 'Avg ETA', v: '9 min', c: '#E8E4D9' }].map((st, i) =>
          <div key={i} style={{ background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 9, padding: '10px 13px' }}>
            <div style={{ fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6A6560', marginBottom: 3 }}>{st.l}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: st.c }}>{st.v}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, height: 420 }}>
        {/* Sidebar */}
        <div style={{ background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(201,168,76,.12)', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6A6560' }}>Live fleet</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {vehicles.map(v => (
              <div key={v.id} onClick={() => setSelected(v)} style={{ background: selected?.id === v.id ? 'rgba(201,168,76,.06)' : '#1C1C27', border: `1px solid ${selected?.id === v.id ? v.color : 'rgba(201,168,76,.15)'}`, borderRadius: 8, padding: 9, marginBottom: 6, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{v.code} {v.model.split(' ')[0]}</div>
                </div>
                <div style={{ fontSize: 9, color: '#6A6560' }}>{v.driver}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9 }}>
                  <span style={{ color: v.status === 'on-route' ? '#5DC48A' : '#C9A84C' }}>{v.status}</span>
                  <span style={{ color: v.color }}>ETA {v.eta}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Map */}
        <div style={{ background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(22,22,31,.95)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 20, padding: '4px 10px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5DC48A', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
            Live tracking
          </div>
          {selected && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(22,22,31,.97)', borderTop: '1px solid rgba(201,168,76,.15)', padding: 12 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                {[['Vehicle', `${selected.code} ${selected.model}`], ['Driver', selected.driver], ['Passengers', `${selected.pax} pax`], ['ETA', `${selected.eta} min`]].map(([l, v]) =>
                  <div key={l}><div style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#6A6560', marginBottom: 2 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div></div>
                )}
                <button style={{ marginLeft: 'auto', fontSize: 11, cursor: 'pointer', background: 'transparent', border: 'none', color: '#6A6560' }} onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
