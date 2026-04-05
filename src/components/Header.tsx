import { Link } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-brand">
        RiskFlow
      </Link>
    </header>
  )
}

export default Header
