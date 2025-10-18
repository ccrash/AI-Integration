import React, { useEffect } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../App'
import { useChatStore } from '../store/chatStore'
import ChatPanel from '../components/chatPanel'

type Nav = StackNavigationProp<RootStackParamList>

export default function MainScreen() {
  const navigation = useNavigation<Nav>()
  const ensureConversation = useChatStore(s => s.ensureConversation)

  // Always have at least one active conversation
  useEffect(() => {
    ensureConversation()
  }, [ensureConversation])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style='light' />
      <View style={styles.header}>
        <Text style={styles.headerText}>Simple Gemini Chat</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.headerLink}>History</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ChatPanel/>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5A67D8' },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#5A67D8',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  headerText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  headerLink: { color: '#FFFFFF', fontWeight: '600' }
})
