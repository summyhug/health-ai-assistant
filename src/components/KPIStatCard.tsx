import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { KPIMetric } from '@/types'
import { cn } from '@/lib/utils'

interface KPIStatCardProps {
  metric: KPIMetric
  className?: string
}

export function KPIStatCard({ metric, className }: KPIStatCardProps) {
  const TrendIcon =
    metric.trend === 'up'
      ? TrendingUp
      : metric.trend === 'down'
        ? TrendingDown
        : Minus
  const trendColor =
    metric.trend === 'up'
      ? 'text-accent'
      : metric.trend === 'down'
        ? 'text-danger'
        : 'text-text-muted'

  return (
    <Card className={cn('rounded-lg border-slate-200', className)}>
      <CardHeader className="pb-1 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {metric.label}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-text">
            {metric.value}
          </span>
          <TrendIcon className={cn('h-4 w-4', trendColor)} aria-hidden />
        </div>
        <p className="mt-1 text-xs text-text-muted">{metric.caption}</p>
      </CardContent>
    </Card>
  )
}
