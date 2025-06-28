import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import defaultUserImage from '../../assets/default-user.png';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
   
  const navItems = [
    { path: '/', label: 'Feed', icon: 'home' },
    { path: `/profile/${user?.username}`, label: 'Profile', icon: 'user' },
    { path: '/polls', label: 'Polls', icon: 'bar-chart' },
    { path: '/groups', label: 'Groups', icon: 'users' },
    { path: '/messages', label: 'Messages', icon: 'message-circle' },
    { path: '/users', label: 'Users', icon: 'search' },
  ];

  const handleImageError = (e) => {
    e.target.src = defaultUserImage;
  };

  // Check for various possible photo property names
  const getPhotoUrl = (user) => {
    if (!user) return null;
    
    // Check various properties where the photo might be stored
    if (user.photo) return `data:image/jpeg;base64,${user.photo}`;
    if (user.userphoto) return `data:image/jpeg;base64,${user.userphoto}`;
    if (user.avatar) return `data:image/jpeg;base64,${user.avatar}`;
    if (user.profile_image) return `data:image/jpeg;base64,${user.profile_image}`;
    if (user.profileImage) return `data:image/jpeg;base64,${user.profileImage}`;
    if (user.image) return `data:image/jpeg;base64,${user.image}`;
    
    return null;
  };

  return (
    <div className="w-64 bg-gray-800 flex flex-col h-full">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">SocialConnect</h1>
      </div>
      
      <div className="flex flex-col px-4 py-2">
        {user && (
          <div className="flex items-center space-x-2 mb-6 mt-4">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {getPhotoUrl(user) ? (
                <img 
                  src={getPhotoUrl(user)} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg text-white">
                  {user.username && user.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-white">{user.username}</p>
              {user.displayName && (
                <p className="text-xs text-gray-400">@{user.username}</p>
              )}
            </div>
          </div>
        )}
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg hover:bg-gray-700 ${
                    location.pathname === item.path ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                  }`}
                >
                  <i className={`feather-${item.icon} mr-3`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-700 w-full text-left text-gray-300"
              >
                <i className="feather-log-out mr-3"></i>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;