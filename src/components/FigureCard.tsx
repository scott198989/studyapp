import type { FigureAsset } from '../types/study'

interface FigureCardProps {
  figure: FigureAsset
}

export function FigureCard({ figure }: FigureCardProps) {
  return (
    <figure className="figure-card">
      <img src={figure.src} alt={figure.alt} />
      <figcaption>{figure.caption}</figcaption>
    </figure>
  )
}
