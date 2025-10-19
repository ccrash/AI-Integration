import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { useNavigation } from '@react-navigation/native'
import MainScreen from './mainScreen'
import { useChatStore } from '../store/chatStore'

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}))

jest.mock('../store/chatStore', () => ({
  useChatStore: jest.fn()
}))

jest.mock('../components/chatPanel', () => {
  const { Text } = require('react-native')
  return function ChatPanel() {
    return <Text testID="chat-panel">ChatPanel</Text>
  }
})

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native')
    return <View {...props}>{children}</View>
  }
}))

const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>
const mockUseChatStore = jest.mocked(useChatStore)

describe('MainScreen', () => {
  const mockNavigate = jest.fn()
  const mockEnsureConversation = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNavigation.mockReturnValue({
      navigate: mockNavigate
    } as any)
    mockUseChatStore.mockImplementation((selector: any) =>
      selector({ ensureConversation: mockEnsureConversation })
    )
  })

  it('renders correctly with all main elements', () => {
    render(<MainScreen />)

    expect(screen.getByText('Simple Gemini Chat')).toBeTruthy()
    expect(screen.getByText('History')).toBeTruthy()
    expect(screen.getByTestId('chat-panel')).toBeTruthy()
  })

  it('calls ensureConversation on mount', () => {
    render(<MainScreen />)

    expect(mockEnsureConversation).toHaveBeenCalledTimes(1)
  })

  it('navigates to History screen when History link is pressed', () => {
    render(<MainScreen />)

    const historyButton = screen.getByText('History')
    fireEvent.press(historyButton)

    expect(mockNavigate).toHaveBeenCalledWith('History')
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('retrieves ensureConversation from chat store', () => {
    render(<MainScreen />)

    expect(mockUseChatStore).toHaveBeenCalled()
  })

  it('applies correct styles to container', () => {
    const { getByText } = render(<MainScreen />)
    const header = getByText('Simple Gemini Chat').parent?.parent

    expect(header).toHaveStyle({
      backgroundColor: '#5A67D8'
    })
  })

  it('renders ChatPanel component', () => {
    render(<MainScreen />)

    const chatPanel = screen.getByTestId('chat-panel')
    expect(chatPanel).toBeTruthy()
  })

  it('header displays correct title text', () => {
    render(<MainScreen />)

    const title = screen.getByText('Simple Gemini Chat')
    expect(title).toBeTruthy()
  })

  it('ensures conversation is maintained through store selector', () => {
    const mockSelector = jest.fn((selector: any) =>
      selector({ ensureConversation: mockEnsureConversation })
    )
    mockUseChatStore.mockImplementation(mockSelector)

    render(<MainScreen />)

    expect(mockSelector).toHaveBeenCalled()
    expect(mockEnsureConversation).toHaveBeenCalled()
  })
})