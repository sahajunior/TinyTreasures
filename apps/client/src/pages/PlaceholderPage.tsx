import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  eyebrow: string
  title: string
  description: string
}

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-intro">{description}</p>
      <Link className="button button-primary" to="/products">
        Browse collection
      </Link>
    </section>
  )
}
