// src/pages/Messages.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAllUsers, fetchChat, sendMessage } from '../utils/api';

const Messages = ({ currentUser }) => {
  const { receiverUsername } = useParams();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Load all users for sidebar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchAllUsers();
        const filteredUsers = response.filter(user => user.username !== currentUser.username);
        setUsers(filteredUsers);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      }
    };

    loadUsers();
  }, [currentUser.username]);

  // Scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set selected user and fetch chat
  useEffect(() => {
    const user = users.find(u => u.username === receiverUsername);
    if (user) {
      setSelectedUser(user);
    }

    const loadMessages = async () => {
      if (receiverUsername) {
        try {
          setLoading(true);
          const data = await fetchChat(currentUser.username, receiverUsername);
          setMessages(data || []);
        } catch (err) {
          setError('Failed to load messages');
        } finally {
          setLoading(false);
        }
      }
    };

    loadMessages();
  }, [receiverUsername, users, currentUser.username]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      await sendMessage(currentUser.username, selectedUser.username, newMessage);
      const updatedChat = await fetchChat(currentUser.username, selectedUser.username);
      setMessages(updatedChat);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-700 overflow-y-auto">
        <h2 className="text-xl font-bold p-4 border-b border-gray-700">Chats</h2>
        {users.map(user => (
          <Link
            key={user.username}
            to={`/messages/${user.username}`}
            className={`block p-4 hover:bg-gray-800 transition ${
              selectedUser?.username === user.username ? 'bg-gray-800 font-semibold' : ''
            }`}
          >
            {user.username}
          </Link>
        ))}
      </div>

      {/* Chat Area */}
      <div className="w-3/4 flex flex-col">
        {selectedUser ? (
          <>
            <div className="border-b border-gray-700 p-4 font-semibold text-lg">
              Chat with {selectedUser.username}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === currentUser.username
                        ? 'bg-blue-600 ml-auto text-right'
                        : 'bg-gray-700 text-left'
                    }`}
                  >
                    <div className="text-sm">{msg.msg}</div>
                    <div className="text-xs text-gray-300 mt-1">{msg.sender}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            Select a user to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
