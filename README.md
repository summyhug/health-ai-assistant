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

The Health logo lives at **`public/health-logo.png`**. To replace it, drop in a new image (or update the `src` in `src/App.tsx` if you use a different path).

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

## Deploy to Vercel

The repo is ready to deploy. You don’t need GitHub for the first deploy.

1. **Log in to Vercel** (once per machine):
   ```bash
   npx vercel login
   ```
   Follow the prompts (email or GitHub).

2. **Deploy** from the project root:
   ```bash
   npx vercel
   ```
   First run will ask to link a Vercel project; accept the defaults. You’ll get a URL like `https://health-xxx.vercel.app`.

3. **Production deploy** (optional):
   ```bash
   npx vercel --prod
   ```

### Add GitHub later (optional)

To get a repo and turn on “push to deploy”:

1. Create a **new empty repo** on GitHub (e.g. `health-ai-supervisor`). Don’t add a README or .gitignore.
2. In this project folder, add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/health-ai-supervisor.git
   git branch -M main
   git push -u origin main
   ```
3. In the [Vercel dashboard](https://vercel.com/dashboard), open your project → **Settings** → **Git** and connect the GitHub repo. Future pushes to `main` will auto-deploy.
