import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Role } from '../types'

type Props = {
  role: Role
  content: string
}

export default function ChatMessage({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <View style={isUser ? styles.userMessageContainer : styles.aiMessageContainer}>
      <Text style={isUser ? styles.user : styles.ai}>
        <Text style={styles.roleLabel}>{isUser ? 'You: ' : 'Gemini: '}</Text>
        {content}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  roleLabel: {
    fontWeight: 'bold'
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginVertical: 4
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    marginVertical: 4
  },
  user: {
    maxWidth: '80%',
    backgroundColor: '#5A67D8',
    color: 'white',
    padding: 10,
    borderRadius: 15,
    borderBottomRightRadius: 4
  },
  ai: {
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    color: '#333',
    padding: 10,
    borderRadius: 15,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  }
})
