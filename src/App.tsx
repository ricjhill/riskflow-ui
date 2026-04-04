import { lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import ApiStatus from '@/components/ApiStatus'
import './App.css'

const FlowMapper = lazy(() => import('@/features/flow-mapper/FlowMapper'))

function Home() {
  return (
    <section id="center">
      <h1>RiskFlow UI</h1>
      <p>Upload bordereaux files, review AI-suggested column mappings, and finalise.</p>
      <nav>
        <Link to="/flow-mapper">Flow Mapper</Link>
        {' | '}
        <Link to="/api-status">API Status</Link>
      </nav>
    </section>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/flow-mapper"
        element={
          <Suspense fallback={<p>Loading…</p>}>
            <FlowMapper />
          </Suspense>
        }
      />
      <Route path="/api-status" element={<ApiStatus />} />
    </Routes>
  )
}

export default App
