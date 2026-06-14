import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-rule" />
      <Link className="footer-brand" to="/">TinyTreasures</Link>
      <p>Curated collectibles from independent sellers</p>
      <span>Est. 2024</span>
    </footer>
  )
}
