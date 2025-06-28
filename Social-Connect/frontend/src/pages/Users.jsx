import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  fetchAllUsers, 
  followUser, 
  unfollowUser, 
  isFollowing, 
  requestFollow,
  fetchFollowRequests 
} from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import UserCard from '../components/UserCard';

const Users = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});
  const [requestStatus, setRequestStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await fetchAllUsers();
        
        // Filter out the current user - ensure we're comparing strings
        const currentUsername = typeof currentUser === 'object' ? currentUser.username : currentUser;
        const filteredUsers = allUsers.filter(user => user.username !== currentUsername);
        setUsers(filteredUsers);
        
        // Check following status for each user
        const statusMap = {};
        const requestMap = {};
        
        // First check who the user is following
        for (const user of filteredUsers) {
          const status = await isFollowing(currentUsername, user.username);
          statusMap[user.username] = status.is_following;
        }
        
        // Then check for pending follow requests
        try {
          // Get all pending requests sent by the current user
          const requests = await fetchFollowRequests(currentUsername);
          
          // Filter for requests made by current user (not to them)
          const sentRequests = requests.filter(req => 
            req.requester === currentUsername && req.status === 'pending'
          );
          
          // Mark users with pending requests
          sentRequests.forEach(req => {
            requestMap[req.target] = true;
          });
        } catch (error) {
          console.error('Error fetching follow requests:', error);
        }
        
        setFollowingStatus(statusMap);
        setRequestStatus(requestMap);
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    };

    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  const handleFollow = async (username) => {
    try {
      // Instead of directly following, send a follow request
      await requestFollow(currentUser, username);
      
      // Update the request status
      setRequestStatus(prev => ({
        ...prev,
        [username]: true
      }));
    } catch (error) {
      console.error('Error requesting follow:', error);
    }
  };

  const handleUnfollow = async (username) => {
    try {
      await unfollowUser(currentUser, username);
      setFollowingStatus(prev => ({
        ...prev,
        [username]: false
      }));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  // Enhanced search function that handles more fields
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true; // If no search term, show all users
    
    const searchLower = searchTerm.toLowerCase();
    const usernameMatch = user.username.toLowerCase().includes(searchLower);
    
    // Check for other possible fields
    const displayNameMatch = user.displayName && user.displayName.toLowerCase().includes(searchLower);
    const nameMatch = user.name && user.name.toLowerCase().includes(searchLower);
    const emailMatch = user.email && user.email.toLowerCase().includes(searchLower);
    const bioMatch = user.bio && user.bio.toLowerCase().includes(searchLower);
    
    return usernameMatch || displayNameMatch || nameMatch || emailMatch || bioMatch;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="users-container">
      <h1 className="text-2xl font-bold mb-4">People you may know</h1>
      
      <div className="search-container mb-6">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <UserCard
              key={user.username}
              user={user}
              isFollowing={followingStatus[user.username]}
              requestSent={requestStatus[user.username]}
              currentUser={currentUser}
              onFollow={() => handleFollow(user.username)}
              onUnfollow={() => handleUnfollow(user.username)}
            />
          ))
        ) : (
          <p className="text-gray-500">
            {searchTerm 
              ? `No users found matching "${searchTerm}"`
              : 'No users found.'
            }
          </p>
        )}
      </div>
    </div>
  );
};

export default Users;

