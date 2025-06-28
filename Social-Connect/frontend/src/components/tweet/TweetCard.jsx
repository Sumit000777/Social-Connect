// src/components/tweet/TweetCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { likeTweet, unlikeTweet, deleteTweet } from "../../utils/api";

const TweetCard = ({ tweet, currentUser, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.like_count || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikeTweet(tweet.tweetid, currentUser);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await likeTweet(tweet.tweetid, currentUser);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Like action failed", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this tweet?")) {
      try {
        setIsDeleting(true);
        await deleteTweet(tweet.tweetid);
        if (onDelete) onDelete();
      } catch (err) {
        console.error("Delete failed", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className='bg-gray-800 rounded-lg p-4 shadow'>
      <div className='flex items-start'>
        <div className='flex-shrink-0 mr-3'>
          <Link to={`/profile/${tweet.username}`}>
            <div className='w-10 h-10 rounded-full bg-gray-700 overflow-hidden'>
              {tweet.userphoto ? (
                <img
                  src={`data:image/jpeg;base64,${tweet.userphoto}`}
                  alt={tweet.username}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-lg'>
                  {tweet.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <div>
              <Link
                to={`/profile/${tweet.username}`}
                className='font-medium text-white hover:underline'>
                {tweet.author}
              </Link>
              <span className='text-gray-400 text-sm ml-2'>
                @{tweet.username}
              </span>
            </div>

            {tweet.username === currentUser && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='text-gray-400 hover:text-red-400'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            )}
          </div>

          <Link to={`/tweet/${tweet.tweetid}`}>
            <p className='mt-2 text-white'>{tweet.content_}</p>

            {tweet.photo && (
              <div className='mt-3'>
                <img
                  src={`data:image/jpeg;base64,${tweet.photo}`}
                  alt='Tweet content'
                  className='rounded-lg max-h-80 object-contain'
                />
              </div>
            )}
          </Link>

          <div className='mt-3 flex space-x-6 text-gray-400'>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                isLiked ? "text-red-500" : "hover:text-red-400"
              }`}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 20 20'
                fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z'
                  clipRule='evenodd'
                />
              </svg>
              <span>{likeCount}</span>
            </button>

            <Link
              to={`/tweet/${tweet.tweetid}`}
              className='flex items-center space-x-1 hover:text-blue-400'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 20 20'
                fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Comment</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;