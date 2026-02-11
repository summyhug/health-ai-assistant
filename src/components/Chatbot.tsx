/**
 * Healthops Agent — prominent inline assistant with agentic demo behavior.
 * Full-width section below KPI cards. Parses commands and triggers dashboard actions.
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardContext } from '@/lib/dashboardContext'
import { serializeContextForPrompt } from '@/lib/dashboardContext'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: string // e.g. "Filtered to 4 West" — shows what the agent did
}

export interface ChatbotAction {
  type:
    | 'setUnitFilter'
    | 'setStatusFilter'
    | 'setShowOnlyBlocked'
    | 'setSearchQuery'
    | 'resetFilters'
    | 'openRoom'
    | 'switchTab'
    | 'showHelp'
    | 'reprioritizeEvs'
    | 'escalateMaintenance'
    | 'informStaff'
    | 'showToast'
  payload?: string
}

export type { DashboardContext } from '@/lib/dashboardContext'

export interface ChatbotProps {
  onAction: (action: ChatbotAction) => void
  dashboardContext?: DashboardContext | null
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const GROQ_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'filter_unit',
      description: 'Filter the room list by unit (4 West, 3 East, 5 North, or All units)',
      parameters: {
        type: 'object',
        properties: { unit: { type: 'string', enum: ['4 West', '3 East', '5 North', 'All units'] } },
        required: ['unit'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'filter_status',
      description: 'Filter rooms by status (Ready, Cleaning, Blocked, Unknown, or All statuses)',
      parameters: {
        type: 'object',
        properties: { status: { type: 'string', enum: ['Ready', 'Cleaning', 'Blocked', 'Unknown', 'All statuses'] } },
        required: ['status'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'filter_blocked_only',
      description: 'Show only blocked rooms',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_search',
      description: 'Search rooms by room ID or unit name',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search term' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reset_filters',
      description: 'Clear all filters and show all rooms',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reprioritize_evs',
      description: 'Reprioritize EVS cleaning crews to a specific unit',
      parameters: {
        type: 'object',
        properties: { unit: { type: 'string', enum: ['4 West', '3 East', '5 North'] } },
        required: ['unit'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'escalate_maintenance',
      description: 'Escalate maintenance to prioritize a unit',
      parameters: {
        type: 'object',
        properties: { unit: { type: 'string', enum: ['4 West', '3 East', '5 North'] } },
        required: ['unit'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'inform_staff',
      description: 'Inform staff to focus on cleaning a specific unit',
      parameters: {
        type: 'object',
        properties: { unit: { type: 'string', enum: ['4 West', '3 East', '5 North'] } },
        required: ['unit'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'show_toast',
      description: 'Show a notification toast to the user',
      parameters: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'open_room',
      description: 'Open the room details drawer for a specific room',
      parameters: {
        type: 'object',
        properties: { room_id: { type: 'string', description: 'Room ID e.g. 4W-412B' } },
        required: ['room_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'switch_tab',
      description: 'Switch to Alerts or Data Health tab',
      parameters: {
        type: 'object',
        properties: { tab: { type: 'string', enum: ['alerts', 'data-health'] } },
        required: ['tab'],
      },
    },
  },
]

function buildSystemPrompt(ctx: DashboardContext | null): string {
  const base = `You are the Healthops Agent, an AI assistant for a hospital Room Readiness dashboard. You can observe the dashboard, detect patterns, and take actions with user permission.

When you see concerning patterns (e.g. multiple blocked rooms in one unit, high-severity alerts, stale data, EVS backlog), describe them briefly and suggest an action. Use your tools to execute—the user will be asked to approve before changes are applied.

Be concise. When the user says "yes" or "go ahead" to approve, use the appropriate tool.`

  if (ctx) {
    return `${base}

CURRENT DASHBOARD STATE (refresh your view):
${serializeContextForPrompt(ctx)}

Analyze this state. If you see a pattern that warrants action, suggest it and use the tool when the user approves.`
  }
  return base
}

const HELP_MESSAGE = `I can coordinate operational actions. Try saying:

• "Move cleaning crews to 4 West" — reprioritize EVS
• "Escalate maintenance for 4 West" — prioritize hardware there
• "Inform staff to focus on 4 West" — notify cleaners to focus on 4W
• "Yes" or "Go ahead" — approve the suggested actions
• "Filter by 4 West" — view rooms in that unit
• "Open room 4W-412B" — view room details

Tell me what you'd like me to do.`

const GREETING = `We're seeing elevated demand in 4 West — 3 admissions pending. I can reprioritize cleaning crews there or escalate maintenance to prioritize 4W hardware. May I have permission to act? Reply "yes" or tell me which action you'd like.`

function parseCommand(text: string): ChatbotAction | null {
  const lower = text.trim().toLowerCase()
  if (!lower) return null

  // Operational actions — move crews, escalate maintenance, inform staff
  if (
    /(?:move|reprioritize|redirect|send)\s+(?:cleaning\s+)?(?:crews?|evs)\s+(?:to|for)\s*(4 west|4w)/i.test(lower) ||
    /reprioritize\s+evs\s+(?:for|to)\s*(4 west|4w)/i.test(lower) ||
    /(?:focus|prioritize)\s+cleaning\s+(?:on|for)\s*(4 west|4w)/i.test(lower)
  ) {
    return { type: 'reprioritizeEvs', payload: '4 West' }
  }
  if (
    /(?:tell|notify|escalate)\s+maintenance\s+(?:to\s+)?(?:prioritize|focus)/i.test(lower) ||
    /prioritize\s+maintenance\s+(?:for|in)\s*(4 west|4w)/i.test(lower) ||
    /escalate\s+maintenance\s+(?:for|to)\s*(4 west|4w)/i.test(lower) ||
    /maintenance\s+(?:prioritize|focus)\s+(?:on\s+)?(4 west|4w)/i.test(lower)
  ) {
    return { type: 'escalateMaintenance', payload: '4 West' }
  }
  if (
    /inform\s+staff\s+(?:to\s+)?(?:focus|prioritize)/i.test(lower) ||
    /notify\s+staff\s+(?:to\s+)?(?:focus|clean)\s+(?:on\s+)?(4 west|4w)/i.test(lower) ||
    /(?:staff|crew)\s+(?:focus|prioritize)\s+(?:on\s+)?(4 west|4w)/i.test(lower)
  ) {
    return { type: 'informStaff', payload: '4 West' }
  }
  // Approve / yes — treat as reprioritize EVS (first suggested action)
  if (/^(yes|go ahead|approve|permission granted|do it|proceed)$/.test(lower)) {
    return { type: 'reprioritizeEvs', payload: '4 West' }
  }

  // Reset / clear
  if (
    /^(clear|reset|show all|remove filters)/.test(lower) ||
    lower.includes('clear filters')
  ) {
    return { type: 'resetFilters' }
  }

  // Unit filters: "filter by 4 west", "show 4 west", "4 west only"
  const unitMatch =
    lower.match(
      /(?:filter|show|view|display)\s*(?:by|for|)?\s*(4 west|3 east|5 north|all units)/i
    ) ||
    lower.match(/^(4 west|3 east|5 north|all units)\s*(?:only|rooms)?/i) ||
    lower.match(/^(4 west|3 east|5 north|all units)$/i)
  if (unitMatch) {
    const unit = unitMatch[1]
    const normalized =
      unit === '4 west'
        ? '4 West'
        : unit === '3 east'
          ? '3 East'
          : unit === '5 north'
            ? '5 North'
            : 'All units'
    return { type: 'setUnitFilter', payload: normalized }
  }

  // Blocked rooms
  if (
    /blocked|blocked only|show blocked|only blocked/.test(lower) ||
    lower === 'blocked rooms'
  ) {
    return { type: 'setShowOnlyBlocked', payload: 'true' }
  }

  // Ready rooms
  if (
    /ready|ready only|show ready|only ready|ready rooms/.test(lower)
  ) {
    return { type: 'setStatusFilter', payload: 'Ready' }
  }

  // Cleaning
  if (/cleaning|show cleaning|cleaning rooms/.test(lower)) {
    return { type: 'setStatusFilter', payload: 'Cleaning' }
  }

  // Search: "search for 412", "find 4W-412", "look up room 412"
  const searchMatch =
    lower.match(
      /(?:search|find|look up|look for)\s+(?:room\s+)?([\w-]+)/i
    ) || lower.match(/^room\s+([\w-]+)/i) || lower.match(/^([\w-]+)$/i)
  if (searchMatch) {
    const term = searchMatch[1]
    // Room IDs are like 4W-412B, 3E-215; short numbers like 412 might be partial
    if (term.length >= 2) {
      return { type: 'setSearchQuery', payload: term }
    }
  }

  // Open room: "open room 4W-412B", "show details for 4W-412B"
  const roomMatch =
    lower.match(
      /(?:open|show|view|details?)\s+(?:room\s+)?([\w-]+)/i
    ) || lower.match(/^room\s+([\w-]+)\s+(?:details?|info)/i)
  if (roomMatch) {
    const roomId = roomMatch[1]
    if (roomId.length >= 3) {
      return { type: 'openRoom', payload: roomId }
    }
  }

  // Switch tabs
  if (/data health|system health|integration/.test(lower)) {
    return { type: 'switchTab', payload: 'data-health' }
  }
  if (/alerts?/.test(lower)) {
    return { type: 'switchTab', payload: 'alerts' }
  }

  // Help
  if (
    /^(help|what can you do|how do you work|commands?)/.test(lower) ||
    lower.includes('what can you')
  ) {
    return { type: 'showHelp' }
  }

  return null
}

type GroqMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content?: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> }
  | { role: 'tool'; tool_call_id: string; content: string }

interface GroqResponse {
  content?: string
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>
}

async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  tools = GROQ_TOOLS
): Promise<GroqResponse> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 512,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq API error: ${res.status}`)
  }
  const data = await res.json()
  const msg = data.choices?.[0]?.message ?? {}
  return {
    content: msg.content?.trim(),
    tool_calls: msg.tool_calls,
  }
}

function toolCallToAction(
  name: string,
  args: Record<string, unknown>
): { action: ChatbotAction; description: string } | null {
  switch (name) {
    case 'filter_unit':
      return {
        action: { type: 'setUnitFilter', payload: args.unit as string },
        description: `Filter to ${args.unit}`,
      }
    case 'filter_status':
      return {
        action: { type: 'setStatusFilter', payload: args.status as string },
        description: `Filter to ${args.status} rooms`,
      }
    case 'filter_blocked_only':
      return {
        action: { type: 'setShowOnlyBlocked', payload: 'true' },
        description: 'Show only blocked rooms',
      }
    case 'set_search':
      return {
        action: { type: 'setSearchQuery', payload: args.query as string },
        description: `Search for "${args.query}"`,
      }
    case 'reset_filters':
      return {
        action: { type: 'resetFilters' },
        description: 'Clear all filters',
      }
    case 'reprioritize_evs':
      return {
        action: { type: 'reprioritizeEvs', payload: args.unit as string },
        description: `Reprioritize EVS to ${args.unit}`,
      }
    case 'escalate_maintenance':
      return {
        action: { type: 'escalateMaintenance', payload: args.unit as string },
        description: `Escalate maintenance for ${args.unit}`,
      }
    case 'inform_staff':
      return {
        action: { type: 'informStaff', payload: args.unit as string },
        description: `Inform staff to focus on ${args.unit}`,
      }
    case 'show_toast':
      return {
        action: { type: 'showToast', payload: args.message as string },
        description: `Show notification: "${args.message}"`,
      }
    case 'open_room':
      return {
        action: { type: 'openRoom', payload: args.room_id as string },
        description: `Open room ${args.room_id}`,
      }
    case 'switch_tab':
      return {
        action: { type: 'switchTab', payload: args.tab as string },
        description: `Switch to ${args.tab} tab`,
      }
    default:
      return null
  }
}

interface PendingAction {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
  description: string
  action: ChatbotAction
}

export function Chatbot({ onAction, dashboardContext }: ChatbotProps) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  const useGroq = Boolean(apiKey?.trim())

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialGreetingDone = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initial greeting: static when no Groq, or proactive analysis when Groq + context
  useEffect(() => {
    if (messages.length > 0) return
    if (!useGroq || !apiKey) {
      setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: GREETING }])
      return
    }
    if (!dashboardContext) {
      setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: GREETING }])
      return
    }
    if (initialGreetingDone.current) return
    initialGreetingDone.current = true
    setIsLoading(true)
    const systemPrompt = buildSystemPrompt(dashboardContext)
    const messagesForGroq: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: 'Analyze the dashboard state above. What patterns do you see? If something warrants action (e.g. blocked rooms in 4 West, high alerts), say so briefly and use the appropriate tool. The user will approve before changes apply.',
      },
    ]
    callGroq(apiKey, messagesForGroq)
      .then((res) => {
        if (res.tool_calls?.length) {
          const first = res.tool_calls[0]
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(first.function.arguments || '{}')
          } catch {}
          const mapped = toolCallToAction(first.function.name, args)
          if (mapped) {
            setPendingAction({
              toolCallId: first.id,
              toolName: first.function.name,
              args,
              description: mapped.description,
              action: mapped.action,
            })
            const suggestMsg = res.content
              ? res.content
              : `I've analyzed the dashboard. I'd like to ${mapped.description}. Please approve below.`
            setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: suggestMsg }])
          }
        }
        if (res.content && !res.tool_calls?.length) {
          setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: res.content }])
        } else if (!res.tool_calls?.length) {
          setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: GREETING }])
        }
      })
      .catch(() => {
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: GREETING }])
      })
      .finally(() => setIsLoading(false))
  }, [useGroq, apiKey, dashboardContext, messages.length])

  const addMessage = (role: 'user' | 'assistant', content: string, action?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        content,
        action,
      },
    ])
  }

  const getActionFeedback = (action: ChatbotAction): string => {
    switch (action.type) {
      case 'reprioritizeEvs':
        return `Reprioritized EVS cleaning crews to ${action.payload}. Staff notified.`
      case 'escalateMaintenance':
        return `Escalated maintenance to prioritize ${action.payload} hardware. Work orders reprioritized.`
      case 'informStaff':
        return `Staff informed to focus on cleaning ${action.payload}.`
      case 'setUnitFilter':
        return `Filtered rooms to ${action.payload}.`
      case 'setStatusFilter':
        return `Filtered to ${action.payload} rooms.`
      case 'setShowOnlyBlocked':
        return `Showing only blocked rooms.`
      case 'setSearchQuery':
        return `Searching for "${action.payload}".`
      case 'resetFilters':
        return `Cleared all filters.`
      case 'openRoom':
        return `Opening room ${action.payload}...`
      case 'switchTab':
        return `Switched to ${action.payload === 'data-health' ? 'Data Health' : 'Alerts'} tab.`
      case 'showHelp':
        return HELP_MESSAGE
      case 'showToast':
        return `Showed: ${action.payload}`
      default:
        return 'Done.'
    }
  }

  const runGroqLoop = async (
    apiKey: string,
    initialMessages: GroqMessage[],
    onToolCall: (
      tc: { id: string; name: string; args: Record<string, unknown> },
      content?: string
    ) => boolean
  ): Promise<string> => {
    let msgs: GroqMessage[] = [...initialMessages]
    let lastContent = ''
    for (let i = 0; i < 5; i++) {
      const res = await callGroq(apiKey, msgs)
      if (res.content) lastContent = res.content
      if (res.tool_calls?.length) {
        const first = res.tool_calls[0]
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(first.function.arguments || '{}')
        } catch {}
        const waitForUser = onToolCall(
          { id: first.id, name: first.function.name, args },
          res.content
        )
        if (waitForUser) return '' // Pending user approval
        msgs = [
          ...msgs,
          { role: 'assistant', content: res.content, tool_calls: res.tool_calls },
          { role: 'tool', tool_call_id: first.id, content: 'Action executed.' },
        ]
        continue
      }
      return lastContent || "I'm done."
    }
    return lastContent || "I'm done."
  }

  const executePendingAction = (approved: boolean) => {
    if (!pendingAction) return
    const { action } = pendingAction
    setPendingAction(null)
    if (approved) {
      onAction(action)
      addMessage('assistant', `Done. ${getActionFeedback(action)}`, 'Action applied')
    } else {
      addMessage('assistant', 'Understood. I won’t make that change.')
    }
  }

  const handleAllow = () => executePendingAction(true)
  const handleDeny = () => executePendingAction(false)

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    addMessage('user', text)
    setInputValue('')

    const action = parseCommand(text)
    if (action && !useGroq) {
      onAction(action)
      const feedback = getActionFeedback(action)
      addMessage('assistant', feedback, action.type !== 'showHelp' ? 'Action applied' : undefined)
      return
    }

    if (useGroq) {
      setIsLoading(true)
      try {
        const systemPrompt = buildSystemPrompt(dashboardContext ?? null)
        const chatHistory: GroqMessage[] = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) =>
            m.role === 'user'
              ? { role: 'user' as const, content: m.content }
              : { role: 'assistant' as const, content: m.content }
          ),
          { role: 'user', content: text },
        ]
        const reply = await runGroqLoop(
          apiKey!,
          chatHistory,
          (tc, content) => {
            const mapped = toolCallToAction(tc.name, tc.args)
            if (mapped) {
              setPendingAction({
                toolCallId: tc.id,
                toolName: tc.name,
                args: tc.args,
                description: mapped.description,
                action: mapped.action,
              })
              if (content) addMessage('assistant', content)
              return true
            }
            return false
          }
        )
        if (reply) {
          const actionBadge = action && action.type !== 'showHelp' ? 'Action applied' : undefined
          addMessage('assistant', reply, actionBadge)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to get response'
        addMessage(
          'assistant',
          `Sorry, I couldn't reach the AI: ${msg}. Try the demo commands below.`
        )
      } finally {
        setIsLoading(false)
      }
    } else if (action) {
      const feedback = getActionFeedback(action)
      addMessage('assistant', feedback, action.type !== 'showHelp' ? 'Action applied' : undefined)
    } else {
      addMessage(
        'assistant',
        "I didn't quite get that. Try 'Move cleaning crews to 4 West' or 'Escalate maintenance for 4 West'. Say 'help' for more options."
      )
    }
  }

  return (
    <section
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm"
      role="region"
      aria-label="Healthops Agent chat"
    >
      {/* Title — compact header above */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-primary/10 px-4 py-2">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-semibold text-text">Healthops Agent</span>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary-dark">
          Agentic
        </span>
      </div>

      {/* Chat area — full width */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Messages */}
        <div className="flex max-h-[180px] flex-1 flex-col overflow-y-auto p-3 sm:max-h-[140px] sm:p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'mb-3 flex sm:mb-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-lg px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-text'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.action && msg.role === 'assistant' && (
                  <p className="mt-1.5 text-xs font-medium text-primary-dark">
                    ✓ {msg.action}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Permission prompt — when AI wants to take action */}
        {pendingAction && (
          <div className="border-t border-slate-200 bg-primary/5 px-4 py-3">
            <p className="mb-2 text-sm font-medium text-text">
              Allow this action?
            </p>
            <p className="mb-3 text-sm text-text-muted">
              {pendingAction.description}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAllow}>
                Allow
              </Button>
              <Button size="sm" variant="outline" onClick={handleDeny}>
                Deny
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 border-t border-slate-200 p-3 sm:p-4">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Try: Move cleaning crews to 4 West..."
            className="min-w-0 flex-1"
            disabled={isLoading || !!pendingAction}
          />
          <Button
            size="icon"
            onClick={handleSend}
            aria-label="Send message"
            className="shrink-0"
            disabled={isLoading || !!pendingAction}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
