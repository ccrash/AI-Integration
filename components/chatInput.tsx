import React, { useState } from 'react'
import { ActivityIndicator, Button, StyleSheet, TextInput, View } from 'react-native'

type Props = {
  onSend: (text: string) => void
  onCancel?: () => void
  disabled?: boolean
  loading?: boolean
}

export default function ChatInput({ onSend, onCancel, disabled, loading }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder='Type your message...'
        editable={!disabled}
        onSubmitEditing={submit}
        returnKeyType='send'
      />
      <View style={styles.buttonContainer}>
        <Button
          color={'#5A67D8'}
          title={loading ? 'Cancel' : 'Send'}
          onPress={loading ? onCancel : submit}
          disabled={disabled && !loading}
        />
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size='small' color='#fff' />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff'
  },
  buttonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    minWidth: 70,
    backgroundColor: '#FFFFFF'
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)'
  }
})
