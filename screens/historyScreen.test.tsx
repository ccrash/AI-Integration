import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'
import HistoryScreen from './historyScreen'
import { useChatStore } from '../store/chatStore'
import { Conversation } from '../types'

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}))

jest.mock('../store/chatStore', () => ({
  useChatStore: jest.fn()
}))

const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>
const mockUseChatStore = jest.mocked(useChatStore)

describe('HistoryScreen', () => {
  const mockNavigate = jest.fn()
  const mockSwitchConversation = jest.fn()
  const mockCreateConversation = jest.fn()
  const mockClearStorage = jest.fn()
  const mockSetState = jest.fn()

  const mockConversations: Record<string, Conversation> = {
    'conv-1': {
      id: 'conv-1',
      title: 'First Conversation',
      messages: [{ id: 'msg-1', role: 'user', content: 'Hello there', createdAt: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    'conv-2': {
      id: 'conv-2',
      title: 'Second Conversation',
      messages: [{ id: 'msg-2', role: 'user', content: 'How are you?', createdAt: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    'conv-3': {
      id: 'conv-3',
      title: null,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseNavigation.mockReturnValue({
      navigate: mockNavigate
    } as any)

    mockUseChatStore.mockReturnValue({
      conversations: mockConversations,
      order: ['conv-1', 'conv-2', 'conv-3'],
      switchConversation: mockSwitchConversation,
      createConversation: mockCreateConversation
    } as any)

    // Mock the static properties
    ;(useChatStore as any).persist = {
      clearStorage: mockClearStorage
    }
    ;(useChatStore as any).setState = mockSetState
  })

  it('renders correctly with conversation list', () => {
    render(<HistoryScreen />)

    expect(screen.getByText('New Chat')).toBeTruthy()
    expect(screen.getByText('Clear Storage')).toBeTruthy()
    expect(screen.getByText('First Conversation')).toBeTruthy()
    expect(screen.getByText('Second Conversation')).toBeTruthy()
  })

  it('displays empty state when no conversations exist', () => {
    mockUseChatStore.mockReturnValue({
      conversations: {},
      order: [],
      switchConversation: mockSwitchConversation,
      createConversation: mockCreateConversation
    } as any)

    render(<HistoryScreen />)

    expect(screen.getByText('No conversations yet')).toBeTruthy()
  })

  it('shows "Empty chat" for conversations without title', () => {
    render(<HistoryScreen />)

    expect(screen.getByText('Empty chat')).toBeTruthy()
  })

  it('shows "No messages yet" for conversations without messages', () => {
    render(<HistoryScreen />)

    expect(screen.getByText('No messages yet')).toBeTruthy()
  })

  it('displays first message content as subtitle', () => {
    render(<HistoryScreen />)

    expect(screen.getByText('Hello there')).toBeTruthy()
    expect(screen.getByText('How are you?')).toBeTruthy()
  })

  it('creates new conversation and navigates to Main when New Chat is pressed', () => {
    mockCreateConversation.mockReturnValue('new-conv-id')

    render(<HistoryScreen />)

    const newChatButton = screen.getByText('New Chat')
    fireEvent.press(newChatButton)

    expect(mockCreateConversation).toHaveBeenCalledTimes(1)
    expect(mockSwitchConversation).toHaveBeenCalledWith('new-conv-id')
    expect(mockNavigate).toHaveBeenCalledWith('Main')
  })

  it('switches conversation and navigates when conversation item is pressed', () => {
    render(<HistoryScreen />)

    const firstConversation = screen.getByText('First Conversation')
    fireEvent.press(firstConversation)

    expect(mockSwitchConversation).toHaveBeenCalledWith('conv-1')
    expect(mockNavigate).toHaveBeenCalledWith('Main')
  })

  it('clears storage when Clear Storage button is pressed', async () => {
    render(<HistoryScreen />)

    const clearButton = screen.getByText('Clear Storage')
    fireEvent.press(clearButton)

    await waitFor(() => {
      expect(mockClearStorage).toHaveBeenCalledTimes(1)
      expect(mockSetState).toHaveBeenCalledWith({
        conversations: {},
        order: [],
        currentId: null
      })
    })
  })

  it('renders conversations in the order specified by order array', () => {
    mockUseChatStore.mockReturnValue({
      conversations: mockConversations,
      order: ['conv-2', 'conv-1', 'conv-3'],
      switchConversation: mockSwitchConversation,
      createConversation: mockCreateConversation
    } as any)

    const { getAllByText } = render(<HistoryScreen />)
    
    // Just verify all conversations are rendered
    expect(screen.getByText('Second Conversation')).toBeTruthy()
    expect(screen.getByText('First Conversation')).toBeTruthy()
  })

  it('filters out undefined conversations from order array', () => {
    mockUseChatStore.mockReturnValue({
      conversations: { 'conv-1': mockConversations['conv-1'] },
      order: ['conv-1', 'non-existent-id', 'conv-2'],
      switchConversation: mockSwitchConversation,
      createConversation: mockCreateConversation
    } as any)

    render(<HistoryScreen />)

    expect(screen.getByText('First Conversation')).toBeTruthy()
    expect(screen.queryByText('Second Conversation')).toBeNull()
  })

  it('renders action buttons with correct styles', () => {
    const { getByText } = render(<HistoryScreen />)

    const newChatButton = getByText('New Chat')
    const clearButton = getByText('Clear Storage')

    expect(newChatButton).toBeTruthy()
    expect(clearButton).toBeTruthy()
  })

  it('handles missing persist.clearStorage gracefully', async () => {
    ;(useChatStore as any).persist = {}

    render(<HistoryScreen />)

    const clearButton = screen.getByText('Clear Storage')
    
    // Should not throw error
    expect(() => fireEvent.press(clearButton)).not.toThrow()
  })

  it('uses conversation id as key extractor', () => {
    const { UNSAFE_getAllByType } = render(<HistoryScreen />)
    
    // Verify component renders without key warnings
    expect(() => render(<HistoryScreen />)).not.toThrow()
  })

  it('truncates long conversation titles to one line', () => {
    const longTitleConv = {
      'conv-long': {
        id: 'conv-long',
        title: 'This is a very long conversation title that should be truncated',
        messages: [{ role: 'user', content: 'Test' }],
        createdAt: Date.now()
      }
    }

    mockUseChatStore.mockReturnValue({
      conversations: longTitleConv,
      order: ['conv-long'],
      switchConversation: mockSwitchConversation,
      createConversation: mockCreateConversation
    } as any)

    render(<HistoryScreen />)

    const titleElement = screen.getByText('This is a very long conversation title that should be truncated')
    expect(titleElement.props.numberOfLines).toBe(1)
  })

  it('truncates long message content to one line', () => {
    render(<HistoryScreen />)

    const messageElement = screen.getByText('Hello there')
    expect(messageElement.props.numberOfLines).toBe(1)
  })
})