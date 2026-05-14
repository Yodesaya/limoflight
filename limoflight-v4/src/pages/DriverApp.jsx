// LimoFlight V4 — pages/DriverApp.jsx
import { useState } from 'react'
import { useBrand } from '../context/BrandContext'

export default function DriverApp() {
  const { brand } = useBrand()
  const [chatMsg, setChatMsg] = useState('')
  const [chatLog, setChatLog] = useState([
    { from: 'Dispatch', msg: 'Mike, LAX pickup at Gate 4 ready', color: brand.color },
    { from: 'Mike Torres', msg: 'On my way, 8 min ETA ✓', color: '#7AAAE0' },
    { from: 'Dispatch', msg: 'Sarah, reroute via Sunset Blvd', color: brand.color },
    { from: 'Sarah Kim', msg: 'Got it, rerouting now 👍', color: '#5DC48A' },
  ])

  const DRIVERS = [
    { init: 'MT', name: 'Mike Torres',  car: '#01 Lincoln MKT',       status: 'on-route',  pax: 8,  eta: '12 min', color: brand.color },
    { init: 'SK', name: 'Sarah Kim',    car: '#02 Cadillac Escalade',  status: 'on-route',  pax: 2,  eta: '6 min',  color: '#5DC48A' },
    { init: 'JL', name: 'James Lee',    car: '#03 Lincoln Navigator',  status: 'on-route',  pax: 6,  eta: '18 min', color: '#7AAAE0' },
    { init: 'AR', name: 'Ana Reyes',    car: '#04 Mercedes Sprinter',  status: 'on-route',  pax: 14, eta: '9 min',  color: '#AFA9EC' },
    { init: 'TW', name: 'Tom Walsh',    car: '#05 Cadillac CT6',       status: 'dispatched',pax: 0,  eta: '22 min', color: '#F0997B' },
  ]

  function sendChat() {
    if (!chatMsg.trim()) return
    setChatLog(l => [...l, { from: 'Dispatch', msg: chatMsg, color: brand.color }])
    setChatMsg('')
  }

  return (
    <div style={{ color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Phone mockup */}
        <div style={card}>
          <div style={ct}>Driver mobile app — preview</div>
          <div style={{ fontSize: 10, color: '#6A6560', marginBottom: 12 }}>Google Play exclusive · Auto-syncs with dashboard</div>
          <div style={{ width: 200, background: '#111118', border: '2px solid rgba(201,168,76,.2)', borderRadius: 28, padding: '10px 8px', margin: '0 auto' }}>
            <div style={{ width: 60, height: 10, background: '#08080E', borderRadius: 6, margin: '0 auto 8px' }} />
            <div style={{ background: '#08080E', borderRadius: 18, padding: 10 }}>
              <div style={{ textAlign: 'center', paddingBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: brand.color, color: '#08080E', fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>MT</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Mike Torres</div>
                <div style={{ fontSize: 9, color: '#5DC48A' }}>Lincoln MKT #01 · Online</div>
              </div>
              <div style={{ background: '#16161F', borderRadius: 10, padding: 10, marginBottom: 8, border: '1px solid rgba(201,168,76,.15)' }}>
                <div style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#6A6560', marginBottom: 5 }}>Active booking</div>
                {[['Customer','Capt. Williams'],['Pax','8 passengers'],['Destination','Beverly Hills'],['ETA',{ val: '12 min', gold: true }]].map(([l, v]) =>
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0' }}>
                    <span style={{ color: '#6A6560' }}>{l}</span>
                    <span style={{ color: typeof v === 'object' && v.gold ? brand.color : '#E8E4D9' }}>{typeof v === 'object' ? v.val : v}</span>
                  </div>
                )}
                <div style={{ height: 4, background: '#1C1C27', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: '45%', background: brand.color, borderRadius: 2 }} /></div>
              </div>
              {[{ label: '🗺 Navigate', bg: brand.color, tc: '#08080E' }, { label: '✓ Confirm pickup', bg: 'rgba(58,125,90,.15)', tc: '#5DC48A' }, { label: '⚠ SOS / Emergency', bg: 'rgba(139,51,51,.2)', tc: '#D47A7A' }].map(b => (
                <button key={b.label} style={{ width: '100%', padding: 7, borderRadius: 8, fontSize: 10, fontFamily: 'inherit', cursor: 'pointer', background: b.bg, color: b.tc, border: 'none', marginBottom: 5, fontWeight: 500 }}>{b.label}</button>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#3A3830', paddingTop: 5, borderTop: '1px solid rgba(201,168,76,.1)' }}>
                <span>🛰 GPS on</span><span>4G · 98% 🔋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: drivers + chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={card}>
            <div style={ct}>All drivers — live status</div>
            {DRIVERS.map(d => (
              <div key={d.init} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: d.color + '30', color: d.color, fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d.init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontSize: 9, color: '#6A6560' }}>{d.car} · {d.pax > 0 ? d.pax + ' pax' : 'empty'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: d.status === 'on-route' ? 'rgba(58,125,90,.15)' : 'rgba(201,168,76,.12)', color: d.status === 'on-route' ? '#5DC48A' : '#C9A84C', fontSize: 9, padding: '1px 7px', borderRadius: 10, marginBottom: 2 }}>{d.status}</div>
                  <div style={{ fontSize: 9, color: d.color }}>ETA {d.eta}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={ct}>Dispatch chat</div>
            <div style={{ background: '#1C1C27', borderRadius: 8, padding: 8, height: 120, overflowY: 'auto', fontSize: 10, display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
              {chatLog.map((m, i) => <div key={i}><span style={{ color: m.color, fontWeight: 500 }}>{m.from}:</span> {m.msg}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Send dispatch message..." value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} style={{ padding: '7px 12px', borderRadius: 7, background: brand.color, color: '#08080E', border: 'none', cursor: 'pointer', fontSize: 12 }}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// shared style tokens
const inp  = { width: '100%', padding: '7px 10px', background: '#1C1C27', border: '1px solid rgba(201,168,76,.18)', borderRadius: 6, color: '#E8E4D9', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' }
