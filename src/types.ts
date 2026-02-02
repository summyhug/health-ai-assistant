// Room readiness status and related types for AI Supervisor prototype.
// In production, these would align with Bed Mgmt / EVS / CMMS system enums.

export type ReadinessStatus = 'Ready' | 'Cleaning' | 'Blocked' | 'Unknown'

export type BlockerType =
  | 'HVAC work order'
  | 'Awaiting inspection'
  | 'EVS backlog'
  | 'Data stale'
  | 'Plumbing work order'
  | 'Maintenance hold'
  | 'Unknown (maintenance)'

export interface Room {
  id: string
  roomId: string
  unit: string
  status: ReadinessStatus
  readinessScore: number
  etaMinutes: number | null
  blockers: BlockerType[]
  whyPrioritized: string
  // For degraded mode: when a system is stale, some fields become unknown
  confidence?: number
}

export type AlertSeverity = 'high' | 'medium' | 'low' | 'info'

export interface Alert {
  id: string
  title: string
  severity: AlertSeverity
  recommendedStep: string
  roomId?: string
}

export type SystemName = 'Bed Mgmt' | 'EVS Tasks' | 'Maintenance CMMS' | 'Patient Flow'

export interface DataHealthItem {
  system: SystemName
  status: 'ok' | 'degraded' | 'stale'
  lastUpdated: string
  degradedReason?: string
}

export interface KPIMetric {
  label: string
  value: string | number
  trend: 'up' | 'down' | 'neutral'
  caption: string
}
