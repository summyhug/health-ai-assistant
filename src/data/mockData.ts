import type { Room, Alert, DataHealthItem, KPIMetric } from '@/types'

// Mock rooms: 2 Ready, 2 Cleaning, 2 Blocked, 1 Unknown (data stale)
export const mockRooms: Room[] = [
  {
    id: '1',
    roomId: '4W-412B',
    unit: '4 West',
    status: 'Blocked',
    readinessScore: 35,
    etaMinutes: 45,
    blockers: ['HVAC work order', 'Awaiting inspection'],
    whyPrioritized: 'Admission pending; HVAC blocking turnover.',
    confidence: 0.88,
  },
  {
    id: '2',
    roomId: '4W-408A',
    unit: '4 West',
    status: 'Cleaning',
    readinessScore: 72,
    etaMinutes: 18,
    blockers: ['EVS backlog'],
    whyPrioritized: 'EVS queue backed up; patient expected in 25 min.',
    confidence: 0.92,
  },
  {
    id: '3',
    roomId: '3E-215',
    unit: '3 East',
    status: 'Blocked',
    readinessScore: 20,
    etaMinutes: null,
    blockers: ['Plumbing work order', 'Maintenance hold'],
    whyPrioritized: 'SLA at risk; maintenance not yet dispatched.',
    confidence: 0.85,
  },
  {
    id: '4',
    roomId: '4W-401',
    unit: '4 West',
    status: 'Ready',
    readinessScore: 100,
    etaMinutes: 0,
    blockers: [],
    whyPrioritized: 'Ready for next admission.',
    confidence: 0.95,
  },
  {
    id: '5',
    roomId: '3E-208',
    unit: '3 East',
    status: 'Cleaning',
    readinessScore: 65,
    etaMinutes: 22,
    blockers: ['EVS backlog'],
    whyPrioritized: 'High-priority admission slot in 30 min.',
    confidence: 0.9,
  },
  {
    id: '6',
    roomId: '5N-512',
    unit: '5 North',
    status: 'Ready',
    readinessScore: 100,
    etaMinutes: 0,
    blockers: [],
    whyPrioritized: 'Available; low urgency.',
    confidence: 0.93,
  },
  {
    id: '7',
    roomId: '3E-220',
    unit: '3 East',
    status: 'Unknown',
    readinessScore: 0,
    etaMinutes: null,
    blockers: ['Data stale'],
    whyPrioritized: 'Integration stale; manual verification recommended.',
    confidence: 0.42,
  },
]

// Alerts derived from room and system state
export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    title: 'Assigned-but-not-ready',
    severity: 'high',
    recommendedStep: 'Review 4W-412B — admission pending',
    roomId: '4W-412B',
  },
  {
    id: 'a2',
    title: 'SLA breached (EVS)',
    severity: 'high',
    recommendedStep: 'Escalate EVS for 4W-408A',
    roomId: '4W-408A',
  },
  {
    id: 'a3',
    title: 'SLA breached (Maintenance)',
    severity: 'high',
    recommendedStep: 'Dispatch maintenance for 3E-215',
    roomId: '3E-215',
  },
  {
    id: 'a4',
    title: 'Data stale / Integration down',
    severity: 'medium',
    recommendedStep: 'Check 3E-220 manually; verify integration',
    roomId: '3E-220',
  },
]

// Data health — toggling "Maintenance CMMS" to stale demonstrates degraded mode
export const getInitialDataHealth = (): DataHealthItem[] => [
  { system: 'Bed Mgmt', status: 'ok', lastUpdated: '2025-02-02T10:02:00Z' },
  { system: 'EVS Tasks', status: 'ok', lastUpdated: '2025-02-02T10:01:30Z' },
  {
    system: 'Maintenance CMMS',
    status: 'ok',
    lastUpdated: '2025-02-02T09:58:00Z',
  },
  { system: 'Patient Flow', status: 'ok', lastUpdated: '2025-02-02T10:00:15Z' },
]

// KPI strip values (today)
export const mockKPIs: KPIMetric[] = [
  {
    label: 'False-ready assignments (today)',
    value: 2,
    trend: 'down',
    caption: 'vs 5 yesterday',
  },
  {
    label: 'Admission delays due to readiness',
    value: 3,
    trend: 'neutral',
    caption: 'vs 3 yesterday',
  },
  {
    label: 'SLA breach detection time',
    value: '4.2 min',
    trend: 'down',
    caption: 'avg time to flag',
  },
  {
    label: 'AI recommendation acceptance rate',
    value: '78%',
    trend: 'up',
    caption: 'last 7 days',
  },
]
