// LimoFlight V4 — src/pages/WhiteLabel.jsx
import { useBrand } from '../context/BrandContext'

const COLORS  = ['#C9A84C', '#2A7FFF', '#D85A30', '#1D9E75', '#8B3F9E', '#D4537E']
const EMOJIS  = ['✈', '🚗', '🌟', '💎', '🛩', '👑']
const FONTS   = ['Playfair Display', 'DM Sans', 'Georgia', 'monospace']
const THEMES  = [
  { key: 'gold',  label: 'Gold Luxury',   color: '#C9A84C', border: '#C9A84C' },
  { key: 'blue',  label: 'Ocean Blue',    color: '#2A7FFF', border: '#2A7FFF' },
  { key: 'red',   label: 'Sunset Red',    color: '#D85A30', border: '#D85A30' },
  { key: 'green', label: 'Forest Green',  color: '#1D9E75', border: '#1D9E75' },
]

export default function WhiteLabel() {
  const { brand, setBrand, resetBrand } = useBrand()

  function save() {
    // setBrand already persists to localStorage
    alert(`✓ Branding saved! "${brand.name}" applied to all clients.`)
  }

  return (
    <div style={s.page}>
      <div style={s.grid2}>

        {/* ── LEFT: controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={s.card}>
            <div style={s.ct}>Brand identity</div>

            <div style={s.fg}>
              <label style={s.lbl}>Company name</label>
              <input style={s.inp} value={brand.name}
                onChange={e => setBrand(b => ({ ...b, name: e.target.value }))} />
            </div>

            <div style={s.fg}>
              <label style={s.lbl}>Tagline</label>
              <input style={s.inp} value={brand.tagline}
                onChange={e => setBrand(b => ({ ...b, tagline: e.target.value }))} />
            </div>

            <div style={s.fg}>
              <label style={s.lbl}>Logo symbol</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {EMOJIS.map(em => (
                  <div key={em} onClick={() => setBrand(b => ({ ...b, logo: em }))}
                    style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${brand.logo === em ? brand.color : 'rgba(201,168,76,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, background: brand.logo === em ? brand.color + '20' : '#1C1C27', transition: '.15s' }}>
                    {em}
                  </div>
                ))}
              </div>
            </div>

            <div style={s.fg}>
              <label style={s.lbl}>Primary color</label>
              <div style={{ display: 'flex', gap: 7, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setBrand(b => ({ ...b, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: 'pointer', border: `2px solid ${brand.color === c ? '#fff' : 'transparent'}`, outline: brand.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, transition: '.15s' }} />
                ))}
                <input type="color" value={brand.color}
                  onChange={e => setBrand(b => ({ ...b, color: e.target.value }))}
                  style={{ width: 28, height: 28, padding: 2, borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(201,168,76,.2)' }} />
              </div>
            </div>

            <div style={s.fg}>
              <label style={s.lbl}>Font family</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                {FONTS.map(f => (
                  <div key={f} onClick={() => setBrand(b => ({ ...b, font: f }))}
                    style={{ padding: '5px 10px', borderRadius: 20, fontSize: 10, cursor: 'pointer', border: `1px solid ${brand.font === f ? brand.color : 'rgba(201,168,76,.2)'}`, color: brand.font === f ? brand.color : '#6A6560', fontFamily: `'${f}', serif`, background: '#1C1C27', transition: '.15s' }}>
                    {f.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.ct}>Theme presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {THEMES.map(t => (
                <div key={t.key} onClick={() => setBrand(b => ({ ...b, color: t.color }))}
                  style={{ background: '#08080E', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', transition: '.15s' }}>
                  <div style={{ fontSize: 10, color: t.color, fontWeight: 500 }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={save} style={{ ...s.btn, flex: 1, justifyContent: 'center', background: brand.color, color: '#08080E', border: 'none', fontWeight: 500 }}>
              ✓ Save branding
            </button>
            <button onClick={resetBrand} style={{ ...s.btn, padding: '7px 12px' }}>
              ↺ Reset
            </button>
          </div>
        </div>

        {/* ── RIGHT: live preview ── */}
        <div style={s.card}>
          <div style={s.ct}>Live preview</div>
          <div style={{ background: '#08080E', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, overflow: 'hidden' }}>
            {/* Mock topbar */}
            <div style={{ padding: '8px 12px', background: '#111118', borderBottom: '1px solid rgba(201,168,76,.12)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontFamily: `'${brand.font}', serif`, fontSize: 14, color: brand.color }}>
                {brand.logo} {brand.name}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />)}
              </div>
            </div>
            {/* Mock content */}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#08080E' }}>
                  {brand.logo}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, fontFamily: `'${brand.font}', serif` }}>
                    Welcome to {brand.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#6A6560' }}>
                    {brand.tagline} · Los Angeles
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 12 }}>
                {['12 rides', '$3.8k', '4.9★'].map((v, i) => (
                  <div key={i} style={{ background: '#16161F', borderRadius: 8, padding: 9, textAlign: 'center', border: '1px solid rgba(201,168,76,.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: brand.color }}>{v}</div>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', padding: 9, borderRadius: 8, background: brand.color, color: '#08080E', fontFamily: `'${brand.font}', serif`, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Book a Ride
              </button>
              <div style={{ marginTop: 10, fontSize: 9, color: '#3A3830', textAlign: 'center' }}>
                Powered by {brand.name} · Fleet Plan
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

const s = {
  page:  { color: '#E8E4D9', fontFamily: "'DM Sans', sans-serif" },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
  card:  { background: '#16161F', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, padding: 13 },
  ct:    { fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: '#6A6560', marginBottom: 10 },
  fg:    { marginBottom: 10 },
  lbl:   { display: 'block', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#6A6560', marginBottom: 4 },
  inp:   { width: '100%', padding: '7px 10px', background: '#1C1C27', border: '1px solid rgba(201,168,76,.18)', borderRadius: 6, color: '#E8E4D9', fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  btn:   { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(201,168,76,.18)', background: '#1C1C27', color: '#E8E4D9', transition: '.15s' },
}
