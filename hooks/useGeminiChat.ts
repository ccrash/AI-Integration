import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useChatStore from '../store/chatStore'
import { Role, Msg } from '../types'

type GenerationConfig = {
  temperature?: number
  topP?: number
  topK?: number
  maxOutputTokens?: number
}

type UseGeminiChatOptions = {
  apiKeyProp?: string
  modelName?: string
  generationConfig?: GenerationConfig
  safetySettings?: any[]
  systemPrompt?: string
  setupPrompt?: string
}

type UseGeminiChat = {
  messages: Msg[]         // directly from store (includes system/setup messages)
  loading: boolean
  error: string | null
  send: (text: string) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useGeminiChat(options: UseGeminiChatOptions = {}): UseGeminiChat {
  const {
    apiKeyProp,
    modelName = 'gemini-2.5-flash-preview-05-20',
    generationConfig,
    safetySettings,
    systemPrompt,
    setupPrompt
  } = options

  const ensureConversation = useChatStore(s => s.ensureConversation)
  const addMessage        = useChatStore(s => s.addMessage)
  const replaceMessages   = useChatStore(s => s.replaceMessages)
  const resetCurrent      = useChatStore(s => s.resetCurrent)
  const current           = useChatStore(s => (s.currentId ? s.conversations[s.currentId] ?? null : null))

  // expose store messages directly; UI can choose to not render role==='system'
  const messages: Msg[] = useMemo(() => {
    if (!current?.messages) return []
    return current.messages.map(m => ({ role: m.role as Role, content: m.content }))
  }, [current?.messages])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const apiKey = apiKeyProp ?? process.env?.GEMINI_API_KEY ?? ''
  const apiUrl = useMemo(
    () => `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    [modelName, apiKey]
  )

  // seed system/setup messages exactly once per empty conversation
  useEffect(() => {
    if (!current) return
    if (current.messages.length > 0) return
    const seeds: Msg[] = []
    if (systemPrompt) seeds.push({ role: 'model', content: systemPrompt })
    if (setupPrompt)  seeds.push({ role: 'model', content: setupPrompt })
    if (seeds.length) {
      // add both in order; no title is set because they are not 'user'
      replaceMessages(seeds.map((m, i) => ({
        id: `${Date.now()}-${i}`,
        role: m.role as Role,
        content: m.content,
        createdAt: Date.now() + i
      })) as any)
    }
  }, [current, replaceMessages, systemPrompt, setupPrompt])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }, [])

  const reset = useCallback(() => {
    resetCurrent()
    setError(null)
  }, [resetCurrent])

  const toParts = (text: string) => [{ text }]

  const send = useCallback(async (text: string) => {
    const content = text.trim()
    if (!content) return

    setError(null)
    setLoading(true)

    ensureConversation()

    // 1) store the user message (this will set the title if it's the first user message)
    addMessage({ role: 'user', content })

    try {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      // 2) build request directly from store messages (system/user → user, assistant/ai → model)
      const conv = useChatStore.getState().getCurrent()
      const history = (conv?.messages ?? []).map(m => ({
        role: m.role as Role,
        parts: toParts(m.content)
      }))

      // ensure the latest user message is at the end (it will be)
      const body = {
        contents: history,
        generationConfig,
        safetySettings
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || `Gemini request failed with ${res.status}`)
      }

      const json = await res.json()
      const candidate = json?.candidates?.[0]
      let reply = ''
      if (candidate?.content?.parts?.length) {
        reply = candidate.content.parts.map((p: any) => p.text).filter(Boolean).join('\n\n')
      } else if (json?.error?.message) {
        reply = json.error.message
      } else {
        reply = 'No candidates returned'
      }

      // 3) store model reply
      addMessage({ role: 'model', content: reply })

    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Request cancelled')
      } else {
        const msg = e?.message || 'Something went wrong'
        setError(msg)
        addMessage({ role: 'model', content: msg })
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [addMessage, apiUrl, ensureConversation, generationConfig, safetySettings])

  return { messages, loading, error, send, cancel, reset }
}
