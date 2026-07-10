// src/pages/Messages.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Image, Spinner, Form, Alert
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI, productAPI } from '../service/api';
import Toast from '../components/Toast';
import { 
  MessageCircle, 
  Send, 
  Store,
  Check,
  ChevronLeft,
  Search,
  Package
} from 'lucide-react';

const Messages = ({ onMenuChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [autoChatData, setAutoChatData] = useState(null);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [autoChatProcessed, setAutoChatProcessed] = useState(false);
  const [isProcessingAutoChat, setIsProcessingAutoChat] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const messagesEndRef = useRef(null);
  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);
  const isAutoScrollEnabled = useRef(true);
  const chatDataCheckInterval = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now - msgDate;
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' menit lalu';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' jam lalu';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' hari lalu';
    return msgDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // === CEK CHAT DARI PRODUCT DETAIL ===
  useEffect(() => {
    const chatData = localStorage.getItem('chatSeller');
    if (chatData) {
      try {
        const data = JSON.parse(chatData);
        console.log('💬 Chat data from localStorage on mount:', data);
        setAutoChatData(data);
        localStorage.removeItem('chatSeller');
        setAutoChatProcessed(false);
      } catch (e) {
        console.error('Error parsing chat data:', e);
      }
    }
  }, []);

  // === INTERVAL UNTUK MENDETEKSI CHAT DATA BARU ===
  useEffect(() => {
    chatDataCheckInterval.current = setInterval(() => {
      const chatData = localStorage.getItem('chatSeller');
      if (chatData && !autoChatProcessed && !isProcessingAutoChat) {
        try {
          const data = JSON.parse(chatData);
          console.log('💬 New chat data detected via interval:', data);
          setAutoChatData(data);
          localStorage.removeItem('chatSeller');
          setAutoChatProcessed(false);
        } catch (e) {
          console.error('Error parsing chat data:', e);
        }
      }
    }, 300);
    
    return () => {
      if (chatDataCheckInterval.current) {
        clearInterval(chatDataCheckInterval.current);
      }
    };
  }, [autoChatProcessed, isProcessingAutoChat]);

  // Load conversations - ONLY ONCE on mount
  useEffect(() => {
    if (user && !selectedConversation) {
      loadConversations();
    }
  }, [user]);

  // === POLLING UNTUK PESAN BARU ===
  useEffect(() => {
    if (!user || !selectedConversation) return;

    // Polling setiap 5 detik untuk cek pesan baru
    const interval = setInterval(() => {
      if (selectedConversation && selectedConversation.partnerId !== 'unknown') {
        checkNewMessages();
      }
    }, 5000);

    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedConversation, user]);

  // === AUTO OPEN CHAT - FIXED ===
  useEffect(() => {
    if (autoChatData && conversations.length >= 0 && !autoChatProcessed && !selectedConversation && !isProcessingAutoChat) {
      console.log('🔄 Auto opening chat with:', autoChatData.sellerEmail);
      setIsProcessingAutoChat(true);
      setAutoChatProcessed(true);
      
      const found = conversations.find(c => c.partnerEmail === autoChatData.sellerEmail);
      
      if (found) {
        console.log('✅ Found existing conversation:', found);
        setSelectedConversation(found);
        loadMessages(found);
      } else {
        console.log('🆕 Creating new conversation');
        const newConv = {
          partnerId: autoChatData.sellerId || 'unknown',
          partnerEmail: autoChatData.sellerEmail,
          lastMessage: 'Mulai chat tentang produk...',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          productName: autoChatData.productName,
          productImage: autoChatData.productImage,
          isNewChat: true
        };
        
        setSelectedConversation(newConv);
        setMessages([]);
        setLoading(false);
        
        // Kirim pesan otomatis setelah delay
        setTimeout(() => {
          const productName = autoChatData.productName || 'produk';
          const autoMessage = `Halo, saya tertarik dengan "${productName}". Apakah masih tersedia?`;
          setNewMessage(autoMessage);
          
          setTimeout(() => {
            if (!isAutoSending && isMounted.current && selectedConversation) {
              sendMessageDirect(autoMessage, autoChatData);
            }
            setIsProcessingAutoChat(false);
          }, 500);
        }, 500);
      }
      
      setAutoChatData(null);
    }
  }, [conversations, autoChatData, autoChatProcessed, selectedConversation, isProcessingAutoChat]);

  // === TAMBAHAN: Auto focus ke input chat ===
  useEffect(() => {
    if (selectedConversation) {
      isAutoScrollEnabled.current = true;
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="pesan"]');
        if (textarea) {
          textarea.focus();
        }
      }, 400);
    }
  }, [selectedConversation]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation && selectedConversation.partnerId !== 'unknown' && !selectedConversation.isNewChat) {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        loadMessages(selectedConversation);
      } else {
        loadMessages(selectedConversation);
      }
    }
  }, [selectedConversation?.partnerId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && isAutoScrollEnabled.current) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages.length]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (chatDataCheckInterval.current) {
        clearInterval(chatDataCheckInterval.current);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // === CEK PESAN BARU ===
  const checkNewMessages = async () => {
    if (!selectedConversation || selectedConversation.partnerId === 'unknown') return;
    
    try {
      const newMessages = await messagesAPI.getMessages(user.uid, selectedConversation.partnerId);
      
      if (newMessages && newMessages.length > 0) {
        const lastMsg = newMessages[newMessages.length - 1];
        const currentLastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        
        if (!currentLastMsg || lastMsg.id !== currentLastMsg.id) {
          // Ada pesan baru
          setMessages(newMessages);
          
          // Tandai sebagai read jika pesan dari partner
          if (lastMsg.sender_id !== user.uid && !lastMsg.is_read) {
            await messagesAPI.markAsRead(user.uid, selectedConversation.partnerId);
            
            // Update unread count
            setSelectedConversation(prev => ({
              ...prev,
              unreadCount: 0
            }));
            
            // Update conversations
            setConversations(prev => 
              prev.map(c => 
                c.partnerId === selectedConversation.partnerId 
                  ? { ...c, unreadCount: 0 }
                  : c
              )
            );
          }
        }
      }
    } catch (err) {
      console.error('Error checking new messages:', err);
    }
  };

  const loadConversations = async () => {
    if (!user || !isMounted.current) return;
    
    setLoading(true);
    try {
      const data = await messagesAPI.getConversations(user.uid);
      
      if (isMounted.current) {
        setConversations(data || []);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      if (isMounted.current) {
        showToast('Gagal load percakapan: ' + err.message, 'error');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const loadMessages = async (conversation) => {
    if (!conversation || conversation.partnerId === 'unknown' || conversation.isNewChat || !isMounted.current) {
      setLoadingMessages(false);
      return;
    }

    isAutoScrollEnabled.current = false;
    setLoadingMessages(true);
    
    try {
      // Mark unread messages as read via backend
      await messagesAPI.markAsRead(user.uid, conversation.partnerId);

      const data = await messagesAPI.getMessages(user.uid, conversation.partnerId);

      if (isMounted.current) {
        setMessages(data || []);
        setSelectedConversation(prev => ({
          ...(prev || conversation),
          unreadCount: 0,
          isNewChat: false
        }));
        
        // Update conversations
        setConversations(prev => 
          prev.map(c => 
            c.partnerId === conversation.partnerId 
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
        
        setTimeout(() => {
          isAutoScrollEnabled.current = true;
          if (messagesEndRef.current && data && data.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      if (isMounted.current) {
        showToast('Gagal load pesan: ' + err.message, 'error');
      }
    } finally {
      if (isMounted.current) {
        setLoadingMessages(false);
      }
    }
  };

  // === SEND MESSAGE DIRECT (untuk auto chat) ===
  const sendMessageDirect = async (message, chatData) => {
    if (!message.trim() || !selectedConversation || isAutoSending || !isMounted.current) return;

    setIsAutoSending(true);
    setSending(true);
    
    try {
      let receiverId = selectedConversation.partnerId;
      const receiverEmail = selectedConversation.partnerEmail || chatData?.sellerEmail;

      if (receiverId === 'unknown' || !receiverId) {
        try {
          const userData = await usersAPI.getByEmail(receiverEmail);
          if (userData) {
            receiverId = userData.uid || userData.id;
            setSelectedConversation(prev => ({
              ...prev,
              partnerId: receiverId,
              isNewChat: false
            }));
          } else {
            showToast('❌ Penjual tidak ditemukan!', 'error');
            setIsAutoSending(false);
            setSending(false);
            return;
          }
        } catch (err) {
          showToast('❌ Penjual tidak ditemukan!', 'error');
          setIsAutoSending(false);
          setSending(false);
          return;
        }
      }

      const messageData = {
        sender_id: user.uid,
        sender_email: user.email,
        receiver_id: receiverId,
        receiver_email: receiverEmail,
        message: message.trim()
      };

      const sentMessage = await messagesAPI.send(messageData);

      setNewMessage('');
      
      if (sentMessage && isMounted.current) {
        setMessages(prev => [...prev, sentMessage]);
        isAutoScrollEnabled.current = true;
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 200);
      }

      if (isMounted.current) {
        setSelectedConversation(prev => ({
          ...prev,
          partnerId: receiverId,
          lastMessage: message.trim(),
          lastMessageTime: new Date().toISOString(),
          isNewChat: false
        }));
      }

      // Update conversations tanpa reload
      if (isMounted.current) {
        setConversations(prev => {
          const existing = prev.find(c => c.partnerId === receiverId);
          if (existing) {
            return prev.map(c => 
              c.partnerId === receiverId 
                ? { ...c, lastMessage: message.trim(), lastMessageTime: new Date().toISOString() }
                : c
            );
          }
          return [
            {
              partnerId: receiverId,
              partnerEmail: receiverEmail,
              lastMessage: message.trim(),
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
              productName: chatData?.productName
            },
            ...prev
          ];
        });
      }

      showToast('💬 Pesan terkirim!', 'success');

    } catch (err) {
      console.error('Error sending message:', err);
      if (isMounted.current) {
        showToast('❌ Gagal kirim pesan: ' + err.message, 'error');
      }
    } finally {
      if (isMounted.current) {
        setIsAutoSending(false);
        setSending(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending || !isMounted.current) return;

    setSending(true);
    try {
      let receiverId = selectedConversation.partnerId;
      const receiverEmail = selectedConversation.partnerEmail;

      if (receiverId === 'unknown') {
        try {
          const userData = await usersAPI.getByEmail(receiverEmail);
          if (userData) {
            receiverId = userData.uid || userData.id;
            setSelectedConversation(prev => ({
              ...prev,
              partnerId: receiverId,
              isNewChat: false
            }));
          } else {
            showToast('❌ Penjual tidak ditemukan!', 'error');
            setSending(false);
            return;
          }
        } catch (err) {
          showToast('❌ Penjual tidak ditemukan!', 'error');
          setSending(false);
          return;
        }
      }

      const messageData = {
        sender_id: user.uid,
        sender_email: user.email,
        receiver_id: receiverId,
        receiver_email: receiverEmail,
        message: newMessage.trim()
      };

      const sentMessage = await messagesAPI.send(messageData);

      const sentMessageText = newMessage.trim();
      setNewMessage('');
      
      if (sentMessage && isMounted.current) {
        setMessages(prev => [...prev, sentMessage]);
        isAutoScrollEnabled.current = true;
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 200);
      }

      if (isMounted.current) {
        setSelectedConversation(prev => ({
          ...prev,
          partnerId: receiverId,
          lastMessage: sentMessageText,
          lastMessageTime: new Date().toISOString(),
          isNewChat: false
        }));
      }

      // Update conversations
      if (isMounted.current) {
        setConversations(prev => {
          const existing = prev.find(c => c.partnerId === receiverId);
          if (existing) {
            return prev.map(c => 
              c.partnerId === receiverId 
                ? { ...c, lastMessage: sentMessageText, lastMessageTime: new Date().toISOString() }
                : c
            );
          }
          return [
            {
              partnerId: receiverId,
              partnerEmail: receiverEmail,
              lastMessage: sentMessageText,
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0
            },
            ...prev
          ];
        });
      }

    } catch (err) {
      console.error('Error sending message:', err);
      if (isMounted.current) {
        showToast('❌ Gagal kirim pesan: ' + err.message, 'error');
      }
    } finally {
      if (isMounted.current) {
        setSending(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToProducts = () => {
    if (onMenuChange) {
      onMenuChange('products');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.partnerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // === CHAT DETAIL VIEW ===
  if (selectedConversation) {
    const isNewChat = selectedConversation.isNewChat;
    const productName = selectedConversation.productName || 'produk';
    
    return (
      <Container fluid className="px-0 px-sm-3 px-md-4 py-3" style={{ height: 'calc(100vh - 120px)' }}>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        
        <Card className="border-0 shadow mb-2" style={{ background: '#141a24', borderRadius: '12px' }}>
          <Card.Body className="p-2 p-sm-3">
            <div className="d-flex align-items-center gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                  isInitialLoad.current = true;
                  isAutoScrollEnabled.current = true;
                  loadConversations();
                }}
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <Store size={18} className="text-light" />
              </div>
              <div className="flex-grow-1">
                <div className="text-light fw-bold small">
                  {selectedConversation.partnerEmail?.split('@')[0] || 'Penjual'}
                </div>
                <div className="text-muted small">
                  {isNewChat && <Badge bg="warning" className="me-1">Chat Baru</Badge>}
                  {selectedConversation.unreadCount > 0 && (
                    <Badge bg="danger">{selectedConversation.unreadCount} baru</Badge>
                  )}
                  {selectedConversation.productName && (
                    <span className="text-muted small ms-1">• {selectedConversation.productName}</span>
                  )}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow flex-grow-1" style={{ 
          background: '#141a24', 
          borderRadius: '12px',
          height: 'calc(100% - 100px)',
          overflow: 'hidden'
        }}>
          <Card.Body className="p-3" style={{ overflowY: 'auto', height: '100%' }}>
            {loadingMessages ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" variant="warning" size="sm" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-5">
                <MessageCircle size={48} className="text-muted mb-3" />
                <p className="text-light">Belum ada pesan</p>
                <p className="text-muted small">Kirim pesan pertama Anda</p>
                {isNewChat && (
                  <Alert variant="info" className="mt-3 bg-dark border-warning">
                    <Package size={16} className="me-2 text-warning" />
                    Anda sedang chat tentang <strong className="text-warning">"{productName}"</strong>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user.uid;
                  const showDate = idx === 0 || 
                    new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1]?.created_at).toDateString();

                  return (
                    <div key={msg.id || idx}>
                      {showDate && (
                        <div className="text-center my-2">
                          <small className="text-muted" style={{ fontSize: '10px' }}>
                            {new Date(msg.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </small>
                        </div>
                      )}
                      <div className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div 
                          className={`p-2 rounded-3 ${isMine ? 'bg-warning text-dark' : 'bg-secondary text-light'}`}
                          style={{ maxWidth: '80%', wordWrap: 'break-word' }}
                        >
                          <div style={{ fontSize: '14px' }}>{msg.message}</div>
                          <div className={`small mt-1 ${isMine ? 'text-dark-50' : 'text-muted'}`} style={{ fontSize: '10px' }}>
                            {formatDate(msg.created_at)}
                            {isMine && msg.is_read && <Check size={12} className="ms-1" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* === FORM CHAT - ALWAYS VISIBLE === */}
        <div className="mt-2">
          <Form.Group className="d-flex gap-2">
            <Form.Control
              as="textarea"
              rows={1}
              placeholder={isNewChat ? "Tulis pesan pertama Anda..." : "Ketik pesan..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-dark text-light border-secondary flex-grow-1"
              style={{ borderRadius: '20px', resize: 'none', height: '45px' }}
              disabled={sending}
              autoFocus={!!selectedConversation}
            />
            <Button 
              variant="warning" 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-3"
              style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0 }}
            >
              {sending ? <Spinner animation="border" size="sm" /> : <Send size={18} />}
            </Button>
          </Form.Group>
          {isNewChat && (
            <div className="text-muted small mt-1 ms-2">
              💡 Kirim pesan pertama untuk memulai chat
            </div>
          )}
        </div>
      </Container>
    );
  }

  // === MAIN INBOX VIEW ===
  return (
    <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-light fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}>
            💬 Pesan
          </h4>
          <p className="text-muted small mb-0">
            {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} pesan belum dibaca
          </p>
        </div>
        <Button variant="outline-light" size="sm" onClick={loadConversations}>
          ⟳ Refresh
        </Button>
      </div>

      <Form.Group className="mb-3">
        <div className="position-relative">
          <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <Form.Control
            type="text"
            placeholder="Cari percakapan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-dark text-light border-secondary"
            style={{ paddingLeft: '40px', borderRadius: '12px' }}
          />
        </div>
      </Form.Group>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="warning" size="sm" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card className="border-0 shadow text-center py-4 py-sm-5" style={{ background: '#141a24', borderRadius: '16px' }}>
          <Card.Body>
            <div style={{ fontSize: 'clamp(48px, 10vw, 80px)' }}>💬</div>
            <h4 className="text-light mt-3">
              {searchQuery ? 'Tidak ada percakapan' : 'Belum Ada Pesan'}
            </h4>
            <p className="text-muted small">
              {searchQuery ? 'Coba cari dengan kata kunci lain' : 'Mulai percakapan dengan mengklik Chat di produk'}
            </p>
            {!searchQuery && (
              <Button variant="warning" className="mt-2" onClick={goToProducts} size="sm">
                <Package size={16} className="me-2" />
                Lihat Produk
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filteredConversations.map((conv) => (
            <Card 
              key={conv.partnerId}
              className="border-0 shadow cursor-pointer"
              style={{ 
                background: '#141a24', 
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                borderLeft: (conv.unreadCount || 0) > 0 ? '4px solid #ff9100' : '4px solid transparent'
              }}
              onClick={() => {
                setSelectedConversation(conv);
                setMessages([]);
                isInitialLoad.current = true;
                isAutoScrollEnabled.current = false;
                if (conv.partnerId !== 'unknown') {
                  loadMessages(conv);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 145, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                    <Store size={24} className="text-light" />
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-light fw-bold text-truncate">
                        {conv.partnerEmail?.split('@')[0] || 'Penjual'}
                      </div>
                      <div className="text-muted small flex-shrink-0" style={{ fontSize: '10px' }}>
                        {formatDate(conv.lastMessageTime)}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted small text-truncate" style={{ maxWidth: '70%' }}>
                        {conv.lastMessage || 'Mulai chat...'}
                      </div>
                      {(conv.unreadCount || 0) > 0 && (
                        <Badge bg="danger" className="flex-shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      <style>
        {`
          .cursor-pointer { cursor: pointer; }
          .text-dark-50 { color: rgba(0, 0, 0, 0.5) !important; }
        `}
      </style>
    </Container>
  );
};

export default Messages;