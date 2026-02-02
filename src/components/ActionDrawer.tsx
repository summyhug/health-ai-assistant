import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Room } from '@/types'
import { cn } from '@/lib/utils'

interface ActionDrawerProps {
  room: Room | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (action: string) => void
  requireConfirmation: boolean
  onRequireConfirmationChange: (value: boolean) => void
}

const RECOMMENDED_ACTIONS = [
  { id: 'notify-bed-manager', label: 'Notify Bed Manager' },
  { id: 'create-maintenance-hold', label: 'Create Maintenance Hold' },
  { id: 'escalate-maintenance', label: 'Escalate to Maintenance' },
  { id: 'reprioritize-evs', label: 'Reprioritize EVS' },
] as const

const SIGNALS_USED = [
  'Discharge time',
  'EVS queue position',
  'Open work order (CMMS)',
  'Bed management assignment',
  'Patient flow ETA',
]

export function ActionDrawer({
  room,
  open,
  onOpenChange,
  onAction,
  requireConfirmation,
  onRequireConfirmationChange,
}: ActionDrawerProps) {
  const confidence = room?.confidence ?? 0
  const lowConfidence = confidence < 0.75

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        {room && (
          <>
            <SheetHeader>
              <SheetTitle>
                Room {room.roomId} — Recommended Actions
              </SheetTitle>
              <SheetDescription>
                Current state and suggested next steps. High-risk actions
                require human confirmation.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-6 py-4">
              <section>
                <h4 className="text-sm font-semibold text-text">Summary</h4>
                <p className="mt-1 text-sm text-text-muted">
                  Status: <Badge variant="default" className="ml-1">{room.status}</Badge>
                  {' · '}
                  Readiness: {room.readinessScore}%. {room.whyPrioritized}
                </p>
                {room.blockers.length > 0 && (
                  <p className="mt-2 text-sm text-text-muted">
                    Blockers: {room.blockers.join(', ')}
                  </p>
                )}
              </section>
              <Separator />
              <section>
                <h4 className="text-sm font-semibold text-text">
                  Recommended actions
                </h4>
                <div className="mt-2 flex flex-col gap-2">
                  {RECOMMENDED_ACTIONS.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => onAction(action.label)}
                      disabled={lowConfidence}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </section>
              <Separator />
              <section>
                <h4 className="text-sm font-semibold text-text">Safety</h4>
                <p className="mt-1 text-sm text-text-muted">
                  Autonomy level: Recommend only
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-text">Require confirmation</span>
                  <Switch
                    checked={requireConfirmation}
                    onCheckedChange={onRequireConfirmationChange}
                  />
                </div>
              </section>
              <Separator />
              <section>
                <h4 className="text-sm font-semibold text-text">
                  Explainability
                </h4>
                <p className="mt-1 text-xs text-text-muted">
                  Signals used by the AI to generate recommendations.
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
                  {SIGNALS_USED.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help text-sm text-text-muted">
                          Confidence
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Model confidence (0–1) for this room’s state. Below 0.75
                        we disable automated actions and surface a warning.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span
                    className={cn(
                      'font-medium',
                      lowConfidence ? 'text-warning' : 'text-text'
                    )}
                  >
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
                {lowConfidence && (
                  <p className="mt-2 text-xs text-warning">
                    Confidence below 0.75 — automated actions disabled. Verify
                    data and retry or take manual action.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
