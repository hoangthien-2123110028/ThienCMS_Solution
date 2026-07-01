import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getChatMessages, sendChatMessage, getUnreadChatCount, markChatAsRead } from '../api';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';

export default function ChatBubble() {
  const { customer, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getChatMessages(customer.id);
      setMessages(data);
    } catch {
      // silent
    }
  }, [customer]);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getUnreadChatCount(customer.id);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent
    }
  }, [customer]);

  // Poll unread count every 5s when chat is closed
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchUnread();
    const id = setInterval(fetchUnread, 5000);
    return () => clearInterval(id);
  }, [isLoggedIn, fetchUnread]);

  // When chat opens: load messages, mark as read, start polling
  useEffect(() => {
    if (isOpen && customer) {
      fetchMessages();
      markChatAsRead(customer.id).then(() => setUnreadCount(0)).catch(() => {});

      intervalRef.current = setInterval(() => {
        fetchMessages();
        markChatAsRead(customer.id).then(() => setUnreadCount(0)).catch(() => {});
      }, 5000);

      return () => clearInterval(intervalRef.current);
    }
  }, [isOpen, customer, fetchMessages]);

  // Auto scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !customer || sending) return;

    setSending(true);
    try {
      const newMsg = await sendChatMessage(customer.id, input.trim());
      setMessages(prev => [...prev, newMsg]);
      setInput('');
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Don't render if not logged in
  if (!isLoggedIn) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className="chat-bubble-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với NamTech"
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                <FiMessageCircle size={18} />
              </div>
              <div>
                <div className="chat-header-title">Chat với NamTech</div>
                <div className="chat-header-status">
                  <span className="chat-status-dot"></span> Online
                </div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <FiMessageCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Chào bạn! 👋</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Hãy gửi tin nhắn để được hỗ trợ.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-msg ${msg.isFromAdmin ? 'chat-msg-admin' : 'chat-msg-customer'}`}
                >
                  <div className="chat-msg-bubble">
                    <div className="chat-msg-content">{msg.content}</div>
                    <div className="chat-msg-time">{formatTime(msg.sentAt)}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || sending}
            >
              <FiSend size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
