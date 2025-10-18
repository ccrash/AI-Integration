import { create } from 'zustand'
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ChatMessage, Conversation, Msg, Role } from '../types'

type ChatState = {
  conversations: Record<string, Conversation>
  order: string[]
  currentId: string | null
  createConversation: () => string
  switchConversation: (id: string) => void
  ensureConversation: () => string
  addMessage: (msg: Msg) => ChatMessage
  replaceMessages: (msgs: ChatMessage[]) => void
  resetCurrent: () => void
  getCurrent: () => Conversation | null
}

const nano = () => Math.random().toString(36).slice(2, 10)

export const useChatStore = create<ChatState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        conversations: {},
        order: [],
        currentId: null,

        createConversation: () => {
          const id = nano()
          set((state: ChatState) => {
            const now = Date.now()
            const conversations = {
              ...state.conversations,
              [id]: { id, title: null, messages: [], createdAt: now, updatedAt: now } // title null on new chat
            }
            const order = [id, ...state.order.filter(x => x !== id)]
            return { conversations, order, currentId: id }
          })
          return id
        },

        switchConversation: (id) => {
          set((state: ChatState) => {
            const exists = !!state.conversations[id]
            const now = Date.now()
            const conversations = exists
              ? state.conversations
              : {
                  ...state.conversations,
                  [id]: { id, title: null, messages: [], createdAt: now, updatedAt: now }
                }
            const order = [id, ...state.order.filter(x => x !== id)]
            return { conversations, order, currentId: id }
          })
        },

        ensureConversation: () => {
          const cid = get().currentId
          if (cid) return cid
          return get().createConversation()
        },

        addMessage: (msg: Msg) => {
          const id = nano()
          const createdAt = Date.now()
          const cid = get().currentId ?? get().createConversation()

          const message: ChatMessage = { id, createdAt, ...msg }

          set((state: ChatState) => {
            const existing = state.conversations[cid] ?? {
              id: cid,
              title: null as string | null,
              messages: [],
              createdAt,
              updatedAt: createdAt
            }

            const messages = [...existing.messages, message]

            // first user message sets the title
            const title =
              existing.title === null && msg.role === 'user'
                ? msg.content
                : existing.title

            const conversations = {
              ...state.conversations,
              [cid]: { ...existing, title, messages, updatedAt: createdAt }
            }
            const order = [cid, ...state.order.filter(x => x !== cid)]
            return { conversations, order, currentId: cid }
          })

          return message
        },

        replaceMessages: (msgs) => {
          set((state: ChatState) => {
            const cid = state.currentId
            if (!cid) return state

            const existing = state.conversations[cid]
            const now = Date.now()

            if (!existing) {
              const conversations = {
                ...state.conversations,
                [cid]: { id: cid, title: null, messages: msgs, createdAt: now, updatedAt: now }
              }
              // if title is null and first message is user, set title to that content
              const first = msgs[0]
              if (first && conversations[cid].title === null && first.role === 'user') {
                conversations[cid] = { ...conversations[cid], title: first.content }
              }
              return { conversations }
            }

            let nextTitle = existing.title
            if (nextTitle === null && msgs.length && msgs[0].role === 'user') {
              nextTitle = msgs[0].content
            }

            const conversations = {
              ...state.conversations,
              [cid]: { ...existing, title: nextTitle, messages: msgs, updatedAt: now }
            }
            return { conversations }
          })
        },

        resetCurrent: () => {
          const cid = get().currentId
          if (!cid) return
          set((state: ChatState) => {
            const conv = state.conversations[cid]
            if (!conv) return state
            const conversations = {
              ...state.conversations,
              [cid]: { ...conv, title: null, messages: [], updatedAt: Date.now() }
            }
            return { conversations }
          })
        },

        getCurrent: () => {
          const { currentId, conversations } = get()
          return currentId ? conversations[currentId] ?? null : null
        }
      }),
      {
        name: 'chat-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (s) => ({
          conversations: s.conversations,
          order: s.order,
          currentId: s.currentId
        })
      }
    )
  )
)

export const useCurrentConversation = () => {
  const getCurrent = useChatStore((state) => state.getCurrent)
  return getCurrent()
}

export default useChatStore
