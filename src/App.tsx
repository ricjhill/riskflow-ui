import { Routes, Route } from 'react-router-dom'
import './App.css'

function Home() {
  return (
    <section id="center">
      <h1>RiskFlow UI</h1>
      <p>Upload bordereaux files, review AI-suggested column mappings, and finalise.</p>
    </section>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
