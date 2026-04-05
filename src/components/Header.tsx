import { Link } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-brand">
        RiskFlow
      </Link>
      <nav className="header-nav">
        <Link to="/flow-mapper">Flow Mapper</Link>
        <Link to="/api-status">API Status</Link>
      </nav>
    </header>
  )
}

export default Header
