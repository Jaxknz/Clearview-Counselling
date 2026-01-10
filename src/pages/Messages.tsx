import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, getDocs, addDoc, where, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import Avatar from '../components/Avatar'
import './Messages.css'

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
      <div className="messages-container">
        <div className="messages-content">
          <p>Please sign in to view your messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
        <p>View and respond to messages from admins</p>
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="messages-content">
        <div className="messages-sidebar">
          <h2>Inbox ({messages.length})</h2>
          {loading ? (
            <p className="loading-messages">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="no-messages">No messages yet</p>
          ) : (
            <div className="messages-list">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-item ${!msg.read ? 'unread' : ''} ${selectedMessage?.id === msg.id ? 'selected' : ''}`}
                  onClick={() => handleSelectMessage(msg)}
                >
                  <div className="message-item-header">
                    <Avatar
                      displayName={msg.fromUserName}
                      size={40}
                    />
                    <div className="message-item-info">
                      <div className="message-sender">{msg.fromUserName}</div>
                      <div className="message-subject">{msg.subject}</div>
                      <div className="message-date">
                        {msg.createdAt.toLocaleDateString()} {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!msg.read && <div className="unread-indicator" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="messages-main">
          {selectedMessage ? (
            <div className="message-view">
              <div className="message-view-header">
                <div className="message-view-sender">
                  <Avatar
                    displayName={selectedMessage.fromUserName}
                    size={50}
                  />
                  <div>
                    <h3>{selectedMessage.fromUserName}</h3>
                    <p className="message-view-date">
                      {selectedMessage.createdAt.toLocaleDateString()} at {selectedMessage.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="message-view-subject">
                <strong>Subject:</strong> {selectedMessage.subject}
              </div>
              <div className="message-view-content">
                {selectedMessage.content.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
              
              {selectedMessage.fromUserRole === 'admin' && (
                <div className="message-actions">
                  {!replying ? (
                    <button
                      className="reply-button"
                      onClick={() => setReplying(true)}
                    >
                      Reply
                    </button>
                  ) : (
                    <div className="reply-section">
                      <textarea
                        className="reply-textarea"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply..."
                        rows={6}
                      />
                      {successMessage && (
                        <div className={`message ${successMessage.type === 'success' ? 'message-success' : 'message-error'}`}>
                          {successMessage.text}
                        </div>
                      )}
                      <div className="reply-actions">
                        <button
                          className="cancel-reply-button"
                          onClick={() => {
                            setReplying(false)
                            setReplyContent('')
                            setMessage(null)
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="send-reply-button"
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
          ) : (
            <div className="no-selection">
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages

