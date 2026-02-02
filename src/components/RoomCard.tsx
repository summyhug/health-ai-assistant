import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Room } from '@/types'
import { ChevronRight } from 'lucide-react'

interface RoomCardProps {
  room: Room
  onActionsClick: (room: Room) => void
}

const statusVariant = (
  s: Room['status']
): 'ready' | 'cleaning' | 'blocked' | 'unknown' => {
  switch (s) {
    case 'Ready':
      return 'ready'
    case 'Cleaning':
      return 'cleaning'
    case 'Blocked':
      return 'blocked'
    default:
      return 'unknown'
  }
}

export function RoomCard({ room, onActionsClick }: RoomCardProps) {
  return (
    <Card className="rounded-lg border-slate-200 transition-shadow hover:shadow-md">
      <CardHeader className="pb-2 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-text">{room.roomId}</span>
            <span className="ml-2 text-sm text-text-muted">{room.unit}</span>
          </div>
          <Badge variant={statusVariant(room.status)}>{room.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div>
          <div className="flex items-center justify-between text-xs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-text-muted">
                    Readiness score
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Composite score (0–100) from EVS, maintenance, and bed
                  management signals. Higher = closer to ready for admission.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-medium text-text">{room.readinessScore}%</span>
          </div>
          <Progress value={room.readinessScore} className="mt-1 h-2" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text-muted">ETA:</span>
          <span className="font-medium text-text">
            {room.etaMinutes != null
              ? `${room.etaMinutes} min`
              : '—'}
          </span>
          {room.blockers.length > 0 && (
            <>
              <span className="text-text-muted">·</span>
              {room.blockers.map((b) => (
                <Badge
                  key={b}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {b}
                </Badge>
              ))}
            </>
          )}
        </div>
        <p className="text-xs text-text-muted">{room.whyPrioritized}</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between rounded-md"
          onClick={() => onActionsClick(room)}
        >
          Actions
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
