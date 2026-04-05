import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <section className="not-found">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/">Go home</Link>
    </section>
  )
}

export default NotFound
