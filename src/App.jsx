import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import IAMPlanner from './IAM-Planner'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="home-container">
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button className="home-btn" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/planner">
          <button style={{ background: '#388BFD', color: '#fff', fontSize: '1.2rem', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Open IAM Planner
          </button>
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/planner" element={<IAMPlanner />} />
    </Routes>
  )
}

export default App
