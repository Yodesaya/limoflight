// LimoFlight V4 — src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Contexts
import { AuthProvider, useAuth }  from './context/AuthContext'
import { NotificationProvider }   from './context/NotifContext'
import { BrandProvider }          from './context/BrandContext'

// Guards & Layout
import SubscriptionGuard          from './guards/SubscriptionGuard'
import Layout                     from './components/Layout'

// Pages — each in its own file
import Login                      from './pages/Login'
import Dashboard                  from './pages/Dashboard'
import Booking                    from './pages/Booking'
import Tracking                   from './pages/Tracking'
import DriverApp                  from './pages/DriverApp'
import Analytics                  from './pages/Analytics'
import WhiteLabel                 from './pages/WhiteLabel'

// Pages exported from OpenTable.jsx (kept together to share style tokens)
import OpenTable, {
  Billing,
  Security,
  FaceAI,
  CapCutAI,
}                                 from './pages/OpenTable'

import './styles/brand.css'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrandProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — nested inside Layout */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <SubscriptionGuard>
                      <Layout />
                    </SubscriptionGuard>
                  </PrivateRoute>
                }
              >
                <Route index             element={<Dashboard />} />
                <Route path="booking"    element={<Booking />} />
                <Route path="tracking"   element={<Tracking />} />
                <Route path="face-ai"    element={<FaceAI />} />
                <Route path="driver-app" element={<DriverApp />} />
                <Route path="capcut"     element={<CapCutAI />} />
                <Route path="opentable"  element={<OpenTable />} />
                <Route path="analytics"  element={<Analytics />} />
                <Route path="whitelabel" element={<WhiteLabel />} />
                <Route path="billing"    element={<Billing />} />
                <Route path="security"   element={<Security />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </BrandProvider>
    </AuthProvider>
  )
}
