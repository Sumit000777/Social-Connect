import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchGroupDetails,
  fetchGroupMembers,
  fetchGroupPosts,
  createPost,
  fetchGroupChat,
  sendGroupMessage,
  fetchGroupJoinRequests,
  requestJoinGroup,
  removeGroupMember,
  joinGroup,
  fetchFollowRequests
} from '../utils/api';
import RequestItem from '../components/RequestItem';
import defaultUserImage from '../assets/default-user.png';

const GroupDetail = ({ currentUser }) => {
  const { groupName } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatRef = useRef(null);

  // Join requests state
  const [joinRequests, setJoinRequests] = useState([]);
  const [userStatus, setUserStatus] = useState('not-member'); // can be 'not-member', 'pending', 'member'
  const [requestError, setRequestError] = useState(null);

  // Follow requests state
  const [followRequests, setFollowRequests] = useState([]);
  const [followError, setFollowError] = useState(null);

  // Load group details
  useEffect(() => {
    const loadGroupData = async () => {
      try {
        setLoading(true);
        setRequestError(null);
        setFollowError(null);

        // Fetch group details
        const groupData = await fetchGroupDetails(groupName, currentUser.username);
        setGroup(groupData);

        // Check if current user is admin
        const adminStatus = groupData.admin === currentUser.username;
        setIsAdmin(adminStatus);
        
        // Debug log to verify admin status
        console.log('Admin check:', {
          groupAdmin: groupData.admin,
          currentUsername: currentUser.username,
          isAdmin: adminStatus
        });

        // Fetch members
        const membersData = await fetchGroupMembers(groupName);
        setMembers(membersData);

        // Check if current user is a member
        const isMember = membersData.some(member => member.username === currentUser.username);

        if (isMember) {
          setUserStatus('member');
          
          // Load posts for members
          try {
            const postsData = await fetchGroupPosts(groupName);
            setPosts(postsData || []); // Ensure it's always an array
          } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
          }

          // Load chat for members
          try {
            const chatData = await fetchGroupChat(groupName);
            setChatMessages(chatData || []); // Ensure it's always an array
          } catch (error) {
            console.error('Error fetching chat:', error);
            setChatMessages([]);
          }
        } else {
          // For non-members, check if they have a pending request
          try {
            const requestsData = await fetchGroupJoinRequests(groupName);
            
            const hasPendingRequest = requestsData.some(
              request => request.username === currentUser.username && request.status === 'pending'
            );

            setUserStatus(hasPendingRequest ? 'pending' : 'not-member');
          } catch (error) {
            console.log('Error checking pending request:', error);
            setUserStatus('not-member');
          }
        }

        // If user is admin, fetch all join requests and follow requests
        if (adminStatus) {
          try {
            const requestsData = await fetchGroupJoinRequests(groupName);
            console.log('Fetched join requests:', requestsData); // Debug log
            setJoinRequests(requestsData || []); // Ensure it's always an array
          } catch (error) {
            console.error('Admin error fetching join requests:', error);
            setJoinRequests([]);
          }

          // Fetch follow requests for admin
          try {
            const username = typeof currentUser === 'object' ? currentUser.username : currentUser;
            const followData = await fetchFollowRequests(username);
            console.log('Fetched follow requests:', followData);
            setFollowRequests(followData || []);
          } catch (error) {
            console.error('Error fetching follow requests:', error);
            setFollowError('Failed to load follow requests');
            setFollowRequests([]);
          }
        }
      } catch (error) {
        console.error('Error loading group data:', error);
        setRequestError('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [groupName, currentUser.username]);

  // Set up periodic refresh for chat, join requests, and follow requests
  useEffect(() => {
    // Set up interval to refresh chat for members
    let chatInterval;
    if (userStatus === 'member') {
      chatInterval = setInterval(() => {
        fetchGroupChat(groupName).then(data => {
          setChatMessages(data);
        }).catch(error => {
          console.log('Error refreshing chat:', error);
        });
      }, 5000);
    }

    // Set up interval to refresh join requests if admin
    let requestInterval;
    if (isAdmin) {
      requestInterval = setInterval(() => {
        fetchGroupJoinRequests(groupName)
          .then(requestsData => {
            console.log('Refreshed join requests:', requestsData); // Debug log
            setJoinRequests(requestsData);
          })
          .catch(error => {
            console.log('Error refreshing requests:', error);
          });
      }, 10000);
    }

    // Set up interval to refresh follow requests if admin
    let followInterval;
    if (isAdmin) {
      followInterval = setInterval(() => {
        const username = typeof currentUser === 'object' ? currentUser.username : currentUser;
        fetchFollowRequests(username)
          .then(followData => {
            console.log('Refreshed follow requests:', followData);
            setFollowRequests(followData);
          })
          .catch(error => {
            console.log('Error refreshing follow requests:', error);
          });
      }, 10000);
    }

    return () => {
      if (chatInterval) clearInterval(chatInterval);
      if (requestInterval) clearInterval(requestInterval);
      if (followInterval) clearInterval(followInterval);
    };
  }, [groupName, isAdmin, userStatus, currentUser]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatRef.current && activeTab === 'chat') {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  // Get photo URL function - handles various photo formats
  const getPhotoUrl = (item) => {
    if (!item) return null;

    let photoData = null;

    // Check where the image might be stored
    const possibleKeys = [
      "photo",
      "userphoto",
      "avatar",
      "profile_image",
      "profileImage",
      "image",
      "user_photo",
    ];

    for (const key of possibleKeys) {
      if (
        item[key] &&
        typeof item[key] === "string" &&
        item[key].length > 100
      ) {
        photoData = item[key];
        break;
      }
    }

    if (!photoData) return null;

    // If it's already a full data URI, return as is
    if (photoData.startsWith("data:image")) {
      return photoData;
    }

    // Try to parse if it's accidentally stringified JSON
    try {
      const parsed = JSON.parse(photoData);
      if (typeof parsed === "string") photoData = parsed;
    } catch (e) {
      // Not JSON, continue
    }

    // Clean quotation marks
    photoData = photoData.replace(/^["']|["']$/g, "");

    // Check if it's base64 or hex
    const isLikelyHex =
      /^[0-9a-fA-F]+$/.test(photoData.replace(/\s/g, "")) &&
      photoData.length % 2 === 0;

    if (isLikelyHex) {
      // Convert hex to base64
      try {
        const hexToBase64 = (hex) => {
          const binary = hex
            .match(/.{1,2}/g)
            .map((byte) => String.fromCharCode(parseInt(byte, 16)))
            .join("");
          return btoa(binary);
        };

        const base64 = hexToBase64(photoData.replace(/\s/g, ""));
        return `data:image/jpeg;base64,${base64}`;
      } catch (e) {
        console.error("Failed to convert hex to base64:", e);
        return null;
      }
    }

    // If it's already base64
    return `data:image/jpeg;base64,${photoData}`;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'flex';
    }
  };

  // Handle join request
  const handleJoinRequest = async () => {
    try {
      setRequestError(null);
      const response = await requestJoinGroup(groupName, currentUser.username);
      
      // If group is public and join is immediate, update status directly
      if (response.status === 'success' && response.message && response.message.includes('joined successfully')) {
        setUserStatus('member');
        // Refresh members and posts for new member
        const membersData = await fetchGroupMembers(groupName);
        setMembers(membersData);
        const postsData = await fetchGroupPosts(groupName);
        setPosts(postsData);
      } else {
        // Otherwise, status is pending
        setUserStatus('pending');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      setRequestError('Failed to send join request');
    }
  };

  // Handle new post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await createPost(currentUser.username, newPost, groupName);
      const updatedPosts = await fetchGroupPosts(groupName);
      setPosts(updatedPosts || []);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  // Handle new chat message
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendGroupMessage(groupName, currentUser.username, newMessage);
      const updatedChat = await fetchGroupChat(groupName);
      setChatMessages(updatedChat);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Refresh join requests and members
  const refreshRequests = async () => {
    try {
      const requestsData = await fetchGroupJoinRequests(groupName);
      console.log('Refreshed requests after action:', requestsData); // Debug log
      setJoinRequests(requestsData);
      
      // Also refresh members
      const membersData = await fetchGroupMembers(groupName);
      setMembers(membersData);
    } catch (error) {
      console.error('Error refreshing requests:', error);
    }
  };

  // Refresh follow requests
  const refreshFollowRequests = async () => {
    try {
      const username = typeof currentUser === 'object' ? currentUser.username : currentUser;
      const followData = await fetchFollowRequests(username);
      console.log('Refreshed follow requests after action:', followData);
      setFollowRequests(followData);
    } catch (error) {
      console.error('Error refreshing follow requests:', error);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (username) => {
    if (window.confirm(`Are you sure you want to remove ${username} from the group?`)) {
      try {
        await removeGroupMember(groupName, currentUser.username, username);
        // Refresh members list
        const updatedMembers = await fetchGroupMembers(groupName);
        setMembers(updatedMembers);
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading group details...</div>;
  }

  if (!group) {
    return <div className="p-6 text-center">Group not found</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden">
            {getPhotoUrl(group) ? (
              <img
                src={getPhotoUrl(group)}
                alt={group.grpname}
                className="w-24 h-24 rounded-lg object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center text-3xl font-bold">
                {group.grpname?.charAt(0)?.toUpperCase() || 'G'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{group.grpname}</h1>
              {userStatus === 'not-member' && (
                <button
                  onClick={handleJoinRequest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Request to Join
                </button>
              )}
              {userStatus === 'pending' && (
                <span className="px-4 py-2 bg-yellow-600 rounded-lg">Request Pending</span>
              )}
              {userStatus === 'member' && (
                <span className="px-4 py-2 bg-green-600 rounded-lg">Member</span>
              )}
            </div>
            <p className="text-gray-300">{group.bio || 'No description available'}</p>
            <p className="text-sm text-gray-400 mt-2">Admin: {group.admin}</p>
            {isAdmin && (
              <p className="text-sm text-green-400 mt-1">You are the admin of this group</p>
            )}
          </div>
        </div>
        {requestError && (
          <p className="text-red-500 text-sm mt-2">{requestError}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 ${activeTab === 'posts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
        >
          Posts
        </button>
        {userStatus === 'member' && (
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
          >
            Group Chat
          </button>
        )}
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 ${activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
        >
          Members ({members.length})
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            >
              Join Requests {joinRequests.filter(req => req.status === 'pending').length > 0 && `(${joinRequests.filter(req => req.status === 'pending').length})`}
            </button>
            <button
              onClick={() => setActiveTab('follow-requests')}
              className={`px-4 py-2 ${activeTab === 'follow-requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            >
              Follow Requests {followRequests.filter(req => req.status === 'pending').length > 0 && `(${followRequests.filter(req => req.status === 'pending').length})`}
            </button>
          </>
        )}
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {userStatus === 'member' && (
            <form onSubmit={handlePostSubmit} className="mb-6">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Write a post..."
                className="w-full p-3 bg-gray-700 rounded-lg resize-none text-white"
                rows="3"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg mt-2"
              >
                Post
              </button>
            </form>
          )}

          {posts.length === 0 ? (
            <p className="text-center text-gray-400">No posts yet</p>
          ) : (
            <div>
              {posts.map(post => (
                <div key={post.tweetid || post.id} className="bg-gray-800 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {getPhotoUrl(post) ? (
                        <img
                          src={getPhotoUrl(post)}
                          alt={post.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          {post.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <Link to={`/profile/${post.username}`} className="font-semibold hover:underline">
                        {post.username}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {new Date(post.time_ || post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-200">{post.content_ || post.content}</p>
                  {post.photo && (
                    <img
                      src={getPhotoUrl(post) || `data:image/jpeg;base64,${post.photo}`}
                      alt="Post content"
                      className="mt-3 rounded-lg max-h-96 object-contain w-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && userStatus === 'member' && (
        <div className="flex flex-col h-96">
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4 mb-4"
          >
            {chatMessages.length === 0 ? (
              <p className="text-center text-gray-400">No messages yet</p>
            ) : (
              chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`mb-4 ${msg.sender === currentUser.username ? 'text-right' : ''}`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-3/4 ${
                      msg.sender === currentUser.username
                        ? 'bg-blue-600 text-left'
                        : 'bg-gray-700'
                    }`}
                  >
                    {msg.sender !== currentUser.username && (
                      <p className="font-semibold text-sm mb-1">{msg.sender}</p>
                    )}
                    <p>{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.time_).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleMessageSubmit} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-3 bg-gray-700 rounded-l-lg text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {members.map(member => (
            <div key={member.username} className="bg-gray-800 p-4 rounded-lg mb-2 flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  {getPhotoUrl(member) ? (
                    <img
                      src={getPhotoUrl(member)}
                      alt={member.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      {member.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <Link to={`/profile/${member.username}`} className="font-semibold hover:underline">
                    {member.username}
                  </Link>
                  {member.username === group.admin && (
                    <span className="ml-2 px-2 py-0.5 bg-red-600 rounded-full text-xs">Admin</span>
                  )}
                </div>
              </div>

              {isAdmin && member.username !== currentUser.username && member.username !== group.admin && (
                <button
                  onClick={() => handleRemoveMember(member.username)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Join Requests Tab */}
      {activeTab === 'requests' && isAdmin && (
        <div>
          <h2 className="text-xl font-bold mb-4">Join Requests</h2>
          
          {/* Pending Requests */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Pending Requests</h3>
            {joinRequests.filter(req => req.status === 'pending').length === 0 ? (
              <p className="text-center text-gray-400">No pending requests</p>
            ) : (
              joinRequests
                .filter(req => req.status === 'pending')
                .map(request => (
                  <RequestItem
                    key={request.id}
                    request={{
                      ...request,
                      grp_name: groupName,
                      admin: group.admin
                    }}
                    type="group"
                    onRequestUpdate={refreshRequests}
                    currentUser={currentUser}
                  />
                ))
            )}
          </div>

          {/* Processed Requests */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Request History</h3>
            {joinRequests.filter(req => req.status !== 'pending').length === 0 ? (
              <p className="text-center text-gray-400">No processed requests</p>
            ) : (
              joinRequests
                .filter(req => req.status !== 'pending')
                .map(request => (
                  <RequestItem
                    key={request.id}
                    request={{
                      ...request,
                      grp_name: groupName,
                      admin: group.admin
                    }}
                    type="group"
                    onRequestUpdate={refreshRequests}
                    currentUser={currentUser}
                  />
                ))
            )}
          </div>
        </div>
      )}

      {/* Follow Requests Tab */}
      {activeTab === 'follow-requests' && isAdmin && (
        <div>
          <h2 className="text-xl font-bold mb-4">Follow Requests</h2>
          
          {followError && (
            <p className="text-red-500 text-sm mb-4">{followError}</p>
          )}
          
          {/* Pending Follow Requests */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Pending Follow Requests</h3>
            {followRequests.filter(req => req.status === 'pending').length === 0 ? (
              <p className="text-center text-gray-400">No pending follow requests</p>
            ) : (
              followRequests
                .filter(req => req.status === 'pending')
                .map(request => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    type="follow"
                    onRequestUpdate={refreshFollowRequests}
                    currentUser={currentUser}
                  />
                ))
            )}
          </div>

          {/* Processed Follow Requests */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Follow Request History</h3>
            {followRequests.filter(req => req.status !== 'pending').length === 0 ? (
              <p className="text-center text-gray-400">No processed follow requests</p>
            ) : (
              followRequests
                .filter(req => req.status !== 'pending')
                .map(request => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    type="follow"
                    onRequestUpdate={refreshFollowRequests}
                    currentUser={currentUser}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;