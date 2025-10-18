import React, { useEffect, useRef } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import ChatInput from './chatInput'
import ChatMessage from './chatMessage'
import { useGeminiChat } from '../hooks/useGeminiChat'
import { useCurrentConversation } from '../store/chatStore'

export default function ChatPanel() {
  const scrollRef = useRef<ScrollView | null>(null)

  const { loading, error, send, cancel } = useGeminiChat({
    systemPrompt: 'You are chatting with Gemini.',
    setupPrompt: ''
  })

  const conv = useCurrentConversation()
  const messages = (conv?.messages ?? [])

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages.length])

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        ref={scrollRef}
        keyboardShouldPersistTaps='handled'
      >
        {messages.map(m => (
          <ChatMessage key={m.id} role={m.role} content={m.content} />
        ))}

        {error ? (
          <View style={{ marginTop: 6 }}>
            <Text style={{ color: '#b00020' }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <ChatInput
        disabled={loading}
        loading={loading}
        onSend={send}
        onCancel={cancel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chat: { flex: 1, backgroundColor: '#f8f8f8' },
  chatContent: { padding: 10 }
})
