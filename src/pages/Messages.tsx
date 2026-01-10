import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, getDocs, addDoc, where, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import Avatar from '../components/Avatar'

interface Message {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserRole: 'admin' | 'user'
  toUserId: string
  subject: string
  content: string
  read: boolean
  createdAt: Date
  readAt?: Date
}

function Messages() {
  const { currentUser, userName } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replying, setReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [successMessage, setSuccessMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadMessages()
    }
  }, [currentUser])

  const loadMessages = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('toUserId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const messagesData: Message[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        messagesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate()
        } as Message)
      })
      
      setMessages(messagesData)
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        // Index not found, try without orderBy
        try {
          const messagesRef = collection(db, 'messages')
          const q = query(messagesRef, where('toUserId', '==', currentUser.uid))
          const querySnapshot = await getDocs(q)
          const messagesData: Message[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            messagesData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              readAt: data.readAt?.toDate()
            } as Message)
          })
          messagesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          setMessages(messagesData)
        } catch (err2) {
          console.error('Error loading messages:', err2)
          setMessages([])
        }
      } else {
        console.error('Error loading messages:', error)
        setMessages([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    setReplying(false)
    setReplyContent('')

    // Mark as read if unread
    if (!message.read) {
      try {
        await updateDoc(doc(db, 'messages', message.id), {
          read: true,
          readAt: Timestamp.now()
        })
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, read: true, readAt: new Date() } : m
        ))
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    }
  }

  const handleReply = async () => {
    if (!currentUser || !selectedMessage || !replyContent.trim()) return

    try {
      setSending(true)
      
      // Get current user name from Firestore
      let fromUserName = userName || currentUser.email || 'User'
      try {
        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          fromUserName = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || fromUserName
        }
      } catch (err) {
        // Use default name if can't fetch
      }
      
      // Create reply message (admin receives it)
      await addDoc(collection(db, 'messages'), {
        fromUserId: currentUser.uid,
        fromUserName: fromUserName,
        fromUserRole: 'user',
        toUserId: selectedMessage.fromUserId, // Reply to the admin who sent the original message
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent.trim(),
        read: false,
        createdAt: Timestamp.now(),
        replyToMessageId: selectedMessage.id
      })

      setSuccessMessage({ type: 'success', text: 'Reply sent successfully!' })
      setReplying(false)
      setReplyContent('')
      setTimeout(() => setSuccessMessage(null), 3000)
      loadMessages() // Reload to refresh message list
    } catch (error) {
      console.error('Error sending reply:', error)
      setSuccessMessage({ type: 'error', text: 'Failed to send reply. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
        <div className="max-w-5xl mx-auto bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg">
          <p className="text-text-dark text-center">Please sign in to view your messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">Messages</h1>
        <p className="text-lg text-text-light">View and respond to messages from admins</p>
        {unreadCount > 0 && (
          <div className="inline-block mt-4 py-2 px-4 bg-[#f5d89c] text-[#8b6914] rounded-full font-semibold text-sm">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto bg-gradient-to-br from-white via-primary/5 to-sky/10 rounded-2xl shadow-custom-lg overflow-hidden flex flex-col h-[calc(100vh-250px)] max-h-[800px] border border-border">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/15 via-sky/10 to-nature-green/10">
          <h2 className="text-text-dark text-2xl font-semibold">Inbox</h2>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-white/50">
            <p className="text-text-light">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white/50">
            <p className="text-text-light">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
            {/* Message List - Left Sidebar */}
            <div className="md:w-[380px] w-full border-r border-b md:border-b-0 border-border bg-gradient-to-b from-sky/10 to-white flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary/20 to-sky/10">
                <div className="text-sm font-medium text-text-dark">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</div>
              </div>
              <div className="flex-1 overflow-y-auto bg-white/60">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-4 border-b border-border/60 cursor-pointer transition-colors duration-200 ${
                      selectedMessage?.id === msg.id 
                        ? 'bg-gradient-to-r from-primary/15 to-sky/10 border-l-4 border-l-primary shadow-sm' 
                        : 'hover:bg-gradient-to-r hover:from-sky/10 hover:to-nature-green/5'
                    } ${
                      !msg.read ? 'bg-gradient-to-r from-sky/20 to-white' : 'bg-white/80'
                    }`}
                    onClick={() => handleSelectMessage(msg)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        displayName={msg.fromUserName}
                        size={32}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className={`text-sm font-semibold truncate ${!msg.read ? 'text-text-dark' : 'text-text-dark/80'}`}>
                            {msg.fromUserName}
                          </div>
                          {!msg.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <div className={`text-sm mb-1 truncate ${!msg.read ? 'font-medium text-text-dark' : 'text-text-light'}`}>
                          {msg.subject}
                        </div>
                        <div className="text-xs text-text-light">
                          {msg.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Display - Right Panel */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white via-bg-light to-sky/5">
              {selectedMessage ? (
                <>
                  <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="md:hidden mb-3 text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                    >
                      <span>←</span> Back to messages
                    </button>
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar
                        displayName={selectedMessage.fromUserName}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold text-text-dark mb-2 break-words">{selectedMessage.subject}</h3>
                        <div className="text-xs md:text-sm text-text-light">
                          <span className="font-medium text-text-dark">{selectedMessage.fromUserName}</span>
                          <span className="mx-2">•</span>
                          <span className="break-words">{selectedMessage.createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedMessage.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white/70">
                    <div className="prose max-w-none bg-white/80 p-6 rounded-lg border border-border/50 shadow-sm">
                      <div className="text-text-dark leading-relaxed whitespace-pre-wrap text-sm md:text-[15px]">
                        {selectedMessage.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-4 last:mb-0">{line || '\u00A0'}</p>
                        ))}
                      </div>
                    </div>
                    
                    {selectedMessage.fromUserRole === 'admin' && (
                      <div className="mt-8 pt-8 border-t-2 border-border">
                        {!replying ? (
                          <button
                            className="py-3 px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom"
                            onClick={() => setReplying(true)}
                          >
                            Reply
                          </button>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <textarea
                              className="w-full p-4 border-2 border-border rounded-lg text-base font-inherit resize-y min-h-[150px] transition-[border-color] duration-300 focus:outline-none focus:border-primary"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Type your reply..."
                              rows={6}
                            />
                            {successMessage && (
                              <div className={`p-4 rounded-lg mb-4 ${
                                successMessage.type === 'success' 
                                  ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]' 
                                  : 'bg-[#fce4ec] text-[#c2185b] border border-[#f8bbd0]'
                              }`}>
                                {successMessage.text}
                              </div>
                            )}
                            <div className="flex gap-4 justify-end md:flex-col">
                              <button
                                className="py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:border-text-dark hover:bg-text-light hover:text-white md:w-full"
                                onClick={() => {
                                  setReplying(false)
                                  setReplyContent('')
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                className="py-3 px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
                                onClick={handleReply}
                                disabled={sending || !replyContent.trim()}
                              >
                                {sending ? 'Sending...' : 'Send Reply'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 bg-white/50">
                      <div className="text-center">
                        <p className="text-text-light text-lg mb-2">Select a message to view</p>
                        <p className="text-text-light text-sm">Choose a message from the list to read its contents</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
  )
}

export default Messages

