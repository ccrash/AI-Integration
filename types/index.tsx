export type Role = 'user' | 'model'

export type Msg = {
  role: Role,
  content: string
}

export type ChatMessage = {
  id: string
  role: Role
  content: string
  createdAt: number
}

export type Conversation = {
  id: string
  title: string | null            // first user message or 'Empty chat'
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}