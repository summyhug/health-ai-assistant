import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Alert } from '@/types'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface AlertsPanelProps {
  alerts: Alert[]
  onRecommendedStep?: (alert: Alert) => void
}

const severityStyles: Record<Alert['severity'], string> = {
  high: 'bg-danger/15 text-danger border-danger/30',
  medium: 'bg-warning/15 text-amber-700 border-warning/30',
  low: 'bg-slate-100 text-text-muted',
  info: 'bg-primary/10 text-primary-dark',
}

export function AlertsPanel({
  alerts,
  onRecommendedStep,
}: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card className="rounded-lg border-slate-200">
        <CardHeader>
          <h3 className="font-semibold text-text">Alerts</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">No active alerts.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-lg border-slate-200">
      <CardHeader className="pb-2">
        <h3 className="flex items-center gap-2 font-semibold text-text">
          <AlertCircle className="h-4 w-4 text-primary" />
          Alerts
        </h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border border-slate-200 bg-surface p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text">{alert.title}</p>
                <Badge
                  className={cn(
                    'mt-1 border',
                    severityStyles[alert.severity]
                  )}
                >
                  {alert.severity}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => onRecommendedStep?.(alert)}
            >
              {alert.recommendedStep}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
