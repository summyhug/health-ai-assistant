# Health — AI Supervisor (Room Readiness Command Center)

Fast UI prototype for the **AI Supervisor** product. Single-page dashboard showing room readiness, KPIs, alerts, data health, and recommended actions.

## Tech

- **React 18** + **TypeScript** (Vite)
- **TailwindCSS** + **shadcn-style UI** (Card, Badge, Button, Tabs, Sheet, Tooltip, Progress, Separator, Switch, Input)
- **Mock data only** — no backend

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Logo

A placeholder **`public/health-logo.svg`** (teal “H”) is included. Replace it with your Health logo: add **`public/health-logo.png`** (or replace the SVG) and update the `src` in `src/App.tsx` if needed.

## Integration notes

See the comment block at the top of **`src/App.tsx`** for where real integrations and agent orchestration would plug in:

- **Header search** → Bed Mgmt / room search API or agent
- **KPIs** → Analytics/warehouse or real-time aggregation
- **Now Queue** → Orchestration layer (agent/scheduler) consuming Bed Mgmt, EVS, CMMS, Patient Flow
- **Alerts** → Rules engine or agent from same sources
- **Data Health** → Actual integration health (e.g. last sync)
- **Action Drawer** → Workflow API or agent tool calls (notify Bed Manager, CMMS hold, escalate EVS/Maintenance)
- **Pilot Mode** → Feature flag or user/session setting for recommend-only vs automated actions

## Build

```bash
npm run build
npm run preview
```
