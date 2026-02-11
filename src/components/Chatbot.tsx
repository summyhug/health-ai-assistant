/**
 * Healthops Agent — prominent inline assistant with agentic demo behavior.
 * Full-width section below KPI cards. Parses commands and triggers dashboard actions.
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  payload?: string
}

export interface ChatbotProps {
  onAction: (action: ChatbotAction) => void
  /** Optional: when API key is set, could call real AI instead of default handlers */
  useRealAi?: boolean
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

export function Chatbot({ onAction, useRealAi = false }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: GREETING,
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


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
      default:
        return 'Done.'
    }
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return

    addMessage('user', text)
    setInputValue('')

    if (useRealAi) {
      // TODO: Call real AI API when API key is configured
      addMessage('assistant', 'Real AI integration coming soon. Try the demo commands!')
      return
    }

    const action = parseCommand(text)
    if (action) {
      onAction(action)
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

        {/* Input */}
        <div className="flex gap-2 border-t border-slate-200 p-3 sm:p-4">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Try: Move cleaning crews to 4 West..."
            className="min-w-0 flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            aria-label="Send message"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
