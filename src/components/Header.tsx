import { Link, NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-brand">
        RiskFlow
      </Link>
      <nav className="header-nav">
        <NavLink to="/flow-mapper">Flow Mapper</NavLink>
        <NavLink to="/api-status">API Status</NavLink>
      </nav>
    </header>
  )
}

export default Header
