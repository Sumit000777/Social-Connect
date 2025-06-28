import React from 'react';
import { Link } from 'react-router-dom';
import defaultUserImage from '../assets/default-user.png';

const UserCard = ({ user, isFollowing, requestSent, currentUser, onFollow, onUnfollow }) => {
  const handleImageError = (e) => {
    e.target.src = defaultUserImage;
  };

  return (
    <div className="user-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <Link to={`/profile/${user.username}`} className="flex-shrink-0">
          <img
            src={user.userphoto ? `data:image/jpeg;base64,${user.userphoto}` : defaultUserImage}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover"
            onError={handleImageError}
          />
        </Link>
        <div className="ml-3 flex-grow">
          <Link to={`/profile/${user.username}`} className="font-medium text-blue-600 hover:text-blue-800">
            {user.author || user.username}
          </Link>
          <p className="text-sm text-gray-500">@{user.username}</p>
        </div>
      </div>

      <div className="flex justify-end">
        {isFollowing ? (
          <span className="px-4 py-1 bg-gray-100 text-blue-600 border border-blue-600 rounded-full">
            Following
          </span>
        ) : requestSent ? (
          <span className="px-4 py-1 bg-yellow-500 text-white rounded-full">
            Request Sent
          </span>
        ) : (
          <button
            onClick={onFollow}
            className="px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Follow
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;