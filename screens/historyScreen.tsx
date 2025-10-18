import React from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../App'
import { useChatStore } from '../store/chatStore'
import { Conversation } from '../types'

type Nav = StackNavigationProp<RootStackParamList>

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { conversations, order, switchConversation, createConversation } = useChatStore()

  const data = order.map(id => conversations[id]).filter(Boolean)

  const handleNewChat = () => {
    const id = createConversation()
    switchConversation(id)
    navigation.navigate('Main')
  }

  const handleClearStorage = async () => {
    // Clear persisted storage and reset in-memory state
    await useChatStore.persist?.clearStorage?.()
    useChatStore.setState({ conversations: {}, order: [], currentId: null })
  }

  const renderItem = ({ item }: ListRenderItemInfo<Conversation>) => {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          switchConversation(item.id)
          navigation.navigate('Main')
        }}
      >
        <Text style={styles.title} numberOfLines={1}>
          {item.title ?? 'Empty chat'}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.messages[0]?.content ?? 'No messages yet'}
        </Text>
      </TouchableOpacity>
    )
  }

  const ListHeader = (
    <View style={styles.headerActions}>
      <TouchableOpacity onPress={handleNewChat} style={[styles.actionBtn, styles.primaryBtn]}>
        <Text style={styles.actionBtnText}>New Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleClearStorage} style={[styles.actionBtn, styles.dangerBtn]}>
        <Text style={styles.actionBtnText}>Clear Storage</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={c => c.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.listContent,
          data.length ? undefined : styles.emptyWrap
        ]}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  listContent: { paddingVertical: 12 },
  headerActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 10
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  primaryBtn: { backgroundColor: '#5A67D8' },
  dangerBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '600' },

  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF'
  },
  sep: { height: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sub: { marginTop: 4, color: '#6B7280' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#6B7280' }
})
