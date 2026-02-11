/**
 * Dashboard context passed to the Healthops Agent so it can observe
 * patterns and suggest actions. Serialized for the AI.
 */

import type { Room, Alert, DataHealthItem, KPIMetric } from '@/types'

export interface DashboardContext {
  rooms: Array<{
    roomId: string
    unit: string
    status: string
    readinessScore: number
    etaMinutes: number | null
    blockers: string[]
    whyPrioritized: string
  }>
  alerts: Array<{
    title: string
    severity: string
    recommendedStep: string
    roomId?: string
  }>
  dataHealth: Array<{
    system: string
    status: string
    lastUpdated: string
    degradedReason?: string
  }>
  kpis: Array<{
    label: string
    value: string | number
    trend: string
    caption: string
  }>
  currentFilters: {
    unit: string
    status: string
    showOnlyBlocked: boolean
    searchQuery: string
  }
  activeTab: string
}

export function buildDashboardContext(
  rooms: Room[],
  alerts: Alert[],
  dataHealth: DataHealthItem[],
  kpis: KPIMetric[],
  filters: {
    unit: string
    status: string
    showOnlyBlocked: boolean
    searchQuery: string
  },
  activeTab: string
): DashboardContext {
  return {
    rooms: rooms.map((r) => ({
      roomId: r.roomId,
      unit: r.unit,
      status: r.status,
      readinessScore: r.readinessScore,
      etaMinutes: r.etaMinutes,
      blockers: r.blockers,
      whyPrioritized: r.whyPrioritized,
    })),
    alerts: alerts.map((a) => ({
      title: a.title,
      severity: a.severity,
      recommendedStep: a.recommendedStep,
      roomId: a.roomId,
    })),
    dataHealth: dataHealth.map((d) => ({
      system: d.system,
      status: d.status,
      lastUpdated: d.lastUpdated,
      degradedReason: d.degradedReason,
    })),
    kpis: kpis.map((k) => ({
      label: k.label,
      value: k.value,
      trend: k.trend,
      caption: k.caption,
    })),
    currentFilters: filters,
    activeTab,
  }
}

export function serializeContextForPrompt(ctx: DashboardContext): string {
  return JSON.stringify(ctx, null, 2)
}
