import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useChatStore, useCurrentConversation } from './chatStore'
import { Conversation, ChatMessage } from '../types'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}))

describe('chatStore', () => {
  beforeEach(() => {
    act(() => {
      useChatStore.setState({
        conversations: {},
        order: [],
        currentId: null
      })
    })
    jest.clearAllMocks()
  })

  describe('createConversation', () => {
    it('creates a new conversation and sets it as current', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
      })

      expect(conversationId).toBeDefined()
      expect(result.current.currentId).toBe(conversationId)
      expect(result.current.conversations[conversationId]).toBeDefined()
      expect(result.current.conversations[conversationId].title).toBeNull()
      expect(result.current.conversations[conversationId].messages).toEqual([])
    })

    it('adds conversations to order array without duplicates', () => {
      const { result } = renderHook(() => useChatStore())

      let id1 = ''
      let id2 = ''

      act(() => {
        id1 = result.current.createConversation()
        id2 = result.current.createConversation()
      })

      expect(result.current.order[0]).toBe(id2)
      expect(result.current.order[1]).toBe(id1)
      expect(result.current.order).toHaveLength(2)
    })
  })

  describe('switchConversation', () => {
    it('switches to existing conversation', () => {
      const { result } = renderHook(() => useChatStore())

      let id1 = ''
      let id2 = ''

      act(() => {
        id1 = result.current.createConversation()
        id2 = result.current.createConversation()
        result.current.switchConversation(id1)
      })

      expect(result.current.currentId).toBe(id1)
      expect(result.current.order[0]).toBe(id1)
    })

    it('creates conversation if it does not exist', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.switchConversation('new-id')
      })

      expect(result.current.conversations['new-id']).toBeDefined()
      expect(result.current.currentId).toBe('new-id')
    })
  })

  describe('ensureConversation', () => {
    it('returns current id if exists, creates new if not', () => {
      const { result } = renderHook(() => useChatStore())

      let firstId = ''
      let secondId = ''

      act(() => {
        firstId = result.current.ensureConversation()
        secondId = result.current.ensureConversation()
      })

      expect(firstId).toBe(secondId)
      expect(result.current.currentId).toBe(firstId)
    })
  })

  describe('addMessage', () => {
    it('adds message to current conversation', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''
      let message: ChatMessage | null = { id: '', role: 'user', content: '', createdAt: 0 }

      act(() => {
        conversationId = result.current.createConversation()
        message = result.current.addMessage({ role: 'user', content: 'Hello' })
      })

      const conversation = result.current.conversations[conversationId]
      expect(conversation.messages).toHaveLength(1)
      expect(conversation.messages[0].content).toBe('Hello')
      expect(message?.id).toBeDefined()
      expect(message?.createdAt).toBeDefined()
    })

    it('sets title to first user message content', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
        result.current.addMessage({ role: 'user', content: 'First message' })
        result.current.addMessage({ role: 'user', content: 'Second message' })
      })

      expect(result.current.conversations[conversationId].title).toBe('First message')
    })

    it('does not set title for non-user messages', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
        result.current.addMessage({ role: 'model', content: 'AI response' })
      })

      expect(result.current.conversations[conversationId].title).toBeNull()
    })

    it('creates conversation if none exists', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.addMessage({ role: 'user', content: 'Hello' })
      })

      expect(result.current.currentId).toBeDefined()
      expect(Object.keys(result.current.conversations)).toHaveLength(1)
    })
  })

  describe('replaceMessages', () => {
    it('replaces messages in current conversation', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
        result.current.addMessage({ role: 'user', content: 'Old message' })
        result.current.replaceMessages([
          { id: '1', role: 'user', content: 'New message 1', createdAt: Date.now() },
          { id: '2', role: 'model', content: 'New message 2', createdAt: Date.now() }
        ])
      })

      const conversation = result.current.conversations[conversationId]
      expect(conversation.messages).toHaveLength(2)
      expect(conversation.messages[0].content).toBe('New message 1')
      expect(conversation.messages[1].content).toBe('New message 2')
    })

    it('sets title from first user message if title is null', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
        result.current.replaceMessages([
          { id: '1', role: 'user', content: 'Title from replace', createdAt: Date.now() }
        ])
      })

      expect(result.current.conversations[conversationId].title).toBe('Title from replace')
    })

    it('does not override existing title', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
        result.current.addMessage({ role: 'user', content: 'Original title' })
        result.current.replaceMessages([
          { id: '1', role: 'user', content: 'New content', createdAt: Date.now() }
        ])
      })

      expect(result.current.conversations[conversationId].title).toBe('Original title')
    })
  })

  describe('resetCurrent', () => {
    it('clears messages and title from current conversation', () => {
      const { result } = renderHook(() => useChatStore())

      let conversationId = ''
      let originalCreatedAt = 0

      act(() => {
        conversationId = result.current.createConversation()
      })

      originalCreatedAt = result.current.conversations[conversationId].createdAt

      act(() => {
        result.current.addMessage({ role: 'user', content: 'Test message' })
        result.current.resetCurrent()
      })

      const conversation = result.current.conversations[conversationId]
      expect(conversation.title).toBeNull()
      expect(conversation.messages).toEqual([])
      expect(conversation.id).toBe(conversationId)
      expect(conversation.createdAt).toBe(originalCreatedAt)
    })

    it('does nothing if no current conversation', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.resetCurrent()
      })

      expect(Object.keys(result.current.conversations)).toHaveLength(0)
    })
  })

  describe('getCurrent', () => {
    it('returns current conversation or null', () => {
      const { result } = renderHook(() => useChatStore())

      expect(result.current.getCurrent()).toBeNull()

      let conversationId = ''

      act(() => {
        conversationId = result.current.createConversation()
      })

      const current = result.current.getCurrent()
      expect(current?.id).toBe(conversationId)
    })
  })

  describe('useCurrentConversation', () => {
    it('returns current conversation', () => {
      act(() => {
        useChatStore.getState().createConversation()
        useChatStore.getState().addMessage({ role: 'user', content: 'Test' })
      })

      const { result } = renderHook(() => useCurrentConversation())

      expect(result.current).toBeDefined()
      expect(result.current?.messages).toHaveLength(1)
    })

    it('returns null when no conversation exists', () => {
      const { result } = renderHook(() => useCurrentConversation())

      expect(result.current).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('generates unique ids', () => {
      const { result } = renderHook(() => useChatStore())

      const ids = new Set<string>()

      act(() => {
        for (let i = 0; i < 10; i++) {
          ids.add(result.current.createConversation())
        }
      })

      expect(ids.size).toBe(10)
    })
  })
})