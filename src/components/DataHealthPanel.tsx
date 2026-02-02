import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { DataHealthItem } from '@/types'
import { cn } from '@/lib/utils'

interface DataHealthPanelProps {
  items: DataHealthItem[]
  onToggleStale?: (system: DataHealthItem['system']) => void
  /** Which system to show a "simulate stale" toggle for (e.g. Maintenance CMMS) */
  staleToggleSystem?: DataHealthItem['system']
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

export function DataHealthPanel({
  items,
  onToggleStale,
  staleToggleSystem = 'Maintenance CMMS',
}: DataHealthPanelProps) {
  return (
    <Card className="rounded-lg border-slate-200">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-text">Data Health</h3>
        <p className="text-xs text-text-muted">
          System freshness. When a source is stale, recommendations become more
          conservative and some blockers show as Unknown.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.system}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  item.status === 'ok' && 'bg-accent',
                  item.status === 'degraded' && 'bg-warning',
                  item.status === 'stale' && 'bg-danger'
                )}
                aria-hidden
              />
              <div>
                <p className="font-medium text-text">{item.system}</p>
                <p className="text-xs text-text-muted">
                  Last updated: {formatTime(item.lastUpdated)}
                </p>
                {item.degradedReason && (
                  <p className="mt-1 text-xs text-warning">
                    {item.degradedReason}
                  </p>
                )}
              </div>
            </div>
            {item.system === staleToggleSystem && onToggleStale && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Simulate stale</span>
                <Switch
                  checked={item.status === 'stale'}
                  onCheckedChange={() => onToggleStale(item.system)}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
