import type { ProductCondition } from '@/types'

interface ConditionBadgeProps {
  condition: ProductCondition
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  const className = `condition-badge condition-${condition
    .toLowerCase()
    .replaceAll(' ', '-')}`

  return <span className={className}>{condition}</span>
}
