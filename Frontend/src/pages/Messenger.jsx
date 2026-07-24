import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { getFileUrl } from '../services/api';
import { 
  FiSearch, 
  FiMoreVertical, 
  FiSmile, 
  FiPaperclip, 
  FiSend,
  FiFileText,
  FiDownload,
  FiCheck,
  FiX,
  FiArrowLeft
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const Messenger = () => {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Deferred file state
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const userInfo = useSelector((state) => state.auth.user || {});
  const loggedInUserId = userInfo._id || userInfo.employeeId;

  // Initialize Socket
  useEffect(() => {
    if (loggedInUserId) {
      const socketInstance = io(getFileUrl(''), {
        query: {
          userId: loggedInUserId,
        },
      });

      setSocket(socketInstance);

      socketInstance.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => socketInstance.close();
    }
  }, [loggedInUserId]);

  // Fetch Contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get('/users');
        setContacts(response.data);
        if (response.data.length > 0) {
          setActiveContact(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    fetchContacts();
  }, []);

  // Fetch Messages when activeContact changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeContact) return;
      try {
        const response = await api.get(`/messages/${activeContact._id}`);
        setMessages(response.data);
        
        // Mark as seen when opening the chat
        if (socket) {
          socket.emit('markSeen', { senderId: activeContact._id, receiverId: loggedInUserId });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [activeContact, socket, loggedInUserId]);

  // Socket listeners for messages and statuses
  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        if (activeContact && (message.senderId === activeContact._id || message.receiverId === activeContact._id)) {
          setMessages((prev) => [...prev, message]);
          
          // Mark as seen immediately if we have the chat open
          if (message.senderId === activeContact._id) {
            socket.emit('markSeen', { senderId: activeContact._id, receiverId: loggedInUserId });
          }
        }
      });

      socket.on('messagesDelivered', (receiverId) => {
        if (activeContact && activeContact._id === receiverId) {
          setMessages((prev) => 
            prev.map(msg => 
              msg.receiverId === receiverId && msg.status === 'sent' 
                ? { ...msg, status: 'delivered' } 
                : msg
            )
          );
        }
      });

      socket.on('messagesSeen', (receiverId) => {
        if (activeContact && activeContact._id === receiverId) {
          setMessages((prev) => 
            prev.map(msg => 
              msg.receiverId === receiverId && (msg.status === 'sent' || msg.status === 'delivered')
                ? { ...msg, status: 'seen' } 
                : msg
            )
          );
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('messagesDelivered');
        socket.off('messagesSeen');
      }
    };
  }, [socket, activeContact, loggedInUserId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !selectedFile && !uploading) return;

    try {
      setUploading(true);
      let fileUrl = '';
      let fileType = '';
      
      // If there is a selected file, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = uploadRes.data.fileUrl;
        fileType = uploadRes.data.fileType;
      }

      // Send the message (with or without file)
      const response = await api.post(
        `/messages/send/${activeContact._id}`, 
        { 
          text: newMessage || (selectedFile ? selectedFile.name : ''), 
          fileUrl, 
          fileType 
        }
      );
      
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      removeSelectedFile();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex h-[calc(100vh-140px)] min-h-[480px] overflow-hidden rounded border border-line bg-surface">
        <div className={`${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col border-r border-line bg-surface`}>
          
          <div className="border-b border-line p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-ink">Messages</h2>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search…"
                className="app-input h-9 pl-9 text-[13px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2">
            {contacts.map(contact => (
              <div 
                key={contact._id}
                onClick={() => setActiveContact(contact)}
                className={`flex cursor-pointer items-center gap-3 rounded px-3 py-2.5 transition-colors ${
                  activeContact?._id === contact._id ? 'bg-brand-xlight' : 'hover:bg-soft'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand to-brand flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {contact.name[0].toUpperCase()}
                  </div>
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-line ${isOnline(contact._id) ? 'bg-brand shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-white/30'}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="truncate text-[13px] font-medium text-ink">{contact.name}</h3>
                  </div>
                  <p className="text-sm text-muted truncate pr-2">{contact.role}</p>
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
               <div className="p-4 text-center text-muted text-sm">No contacts found. Register more users.</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeContact ? (
          <div className={`${!activeContact ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-1 flex-col bg-canvas`}>
            <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4">
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setActiveContact(null)} 
                  className="md:hidden p-2 -ml-2 text-muted hover:text-white transition-colors rounded-lg hover:bg-surface"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand to-brand flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {activeContact.name[0].toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-line ${isOnline(activeContact._id) ? 'bg-brand shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-white/30'}`}></span>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink tracking-tight">{activeContact.name}</h3>
                  <p className="text-sm text-muted">{activeContact.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-xl bg-surface hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-all border border-line">
                  <FiMoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((msg) => {
                const isMine = msg.senderId === loggedInUserId;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      {!isMine && (
                        <div className="w-8 h-8 rounded-lg mt-auto flex-shrink-0 bg-gradient-to-tr from-brand to-brand flex items-center justify-center text-white text-xs font-bold">
                          {activeContact.name[0].toUpperCase()}
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`max-w-[75%] rounded px-3 py-2 text-[13px] ${
                            isMine ? 'bg-brand text-white' : 'border border-line bg-surface text-ink'
                          }`}
                        >
                          {/* File / Image Attachment */}
                          {msg.fileUrl && (
                            <div className="mb-2">
                              {msg.fileType === 'image' ? (
                                <img src={getFileUrl(msg.fileUrl)} alt="Attachment" className="max-w-[200px] sm:max-w-[300px] rounded-lg border border-white/20" />
                              ) : (
                                <a href={getFileUrl(msg.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-navy/40 rounded-xl border border-line hover:bg-surface transition-colors">
                                  <div className="p-2 bg-brand/15 text-brand rounded-lg">
                                    <FiFileText className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-semibold truncate max-w-[150px]">{msg.text || 'Document.pdf'}</p>
                                    <p className="text-xs text-muted">PDF File</p>
                                  </div>
                                  <FiDownload className="w-5 h-5 text-muted hover:text-white" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text Message */}
                          {(!msg.fileUrl || (msg.fileUrl && msg.fileType === 'image' && msg.text)) && (
                             <p className="text-sm leading-relaxed">{msg.text}</p>
                          )}
                        </div>

                        {/* Status Ticks and Time */}
                        <div className="flex items-center gap-1 mt-1.5 px-1 text-muted">
                          <span className="text-[11px] font-medium">
                            {format(new Date(msg.createdAt), "hh:mm a")}
                          </span>
                          
                          {/* Render WhatsApp style ticks for sender */}
                          {isMine && (
                            <span className="flex items-center ml-1">
                              {msg.status === 'sent' && (
                                <FiCheck className="w-3.5 h-3.5 text-muted" />
                              )}
                              {msg.status === 'delivered' && (
                                <div className="flex">
                                  <FiCheck className="w-3.5 h-3.5 text-muted -mr-1.5" />
                                  <FiCheck className="w-3.5 h-3.5 text-muted" />
                                </div>
                              )}
                              {msg.status === 'seen' && (
                                <div className="flex">
                                  <FiCheck className="w-3.5 h-3.5 text-brand drop-shadow-[0_0_2px_rgba(96,165,250,0.5)] -mr-1.5" />
                                  <FiCheck className="w-3.5 h-3.5 text-brand drop-shadow-[0_0_2px_rgba(96,165,250,0.5)]" />
                                </div>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Preview Area */}
            {selectedFile && (
              <div className="px-6 py-3 bg-surface/80 border-t border-line flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/20 text-brand rounded-lg">
                    {selectedFile.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-6 h-6 object-cover rounded" />
                    ) : (
                      <FiFileText className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-muted">Ready to send</p>
                  </div>
                </div>
                <button 
                  onClick={removeSelectedFile}
                  className="p-1.5 text-muted hover:text-brand hover:bg-brand/100/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-surface/30 border-t border-line backdrop-blur-md">
              <div className="flex items-center gap-2 md:gap-4 p-2 bg-surface border border-line rounded-2xl focus-within:border-brand/40 transition-colors">
                <button type="button" className="p-2 md:p-2.5 flex-shrink-0 text-muted hover:text-brand transition-colors ml-1">
                  <FiSmile className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*,application/pdf"
                />
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 md:p-2.5 flex-shrink-0 text-muted hover:text-brand transition-colors"
                  disabled={uploading}
                >
                  <FiPaperclip className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={uploading ? "Sending..." : "Type your message..."}
                  disabled={uploading}
                  className="app-input h-9 flex-1 border-0 bg-transparent text-[13px] shadow-none focus:ring-0"
                />
                
                <button 
                  type="submit"
                  disabled={uploading || (!newMessage.trim() && !selectedFile)}
                  className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 flex items-center justify-center transition-all mr-1 ${
                    (newMessage.trim() || selectedFile) && !uploading
                      ? 'bg-brand hover:bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                      : 'bg-surface text-muted cursor-not-allowed'
                  }`}
                >
                  <FiSend className="w-4 h-4 md:w-5 md:h-5 -ml-0.5 md:-ml-1 mt-0.5" />
                </button>
              </div>
            </form>
            
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center relative z-10 bg-soft backdrop-blur-sm">
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
