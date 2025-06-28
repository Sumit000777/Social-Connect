// src/pages/TweetDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchTweet, likeTweet, unlikeTweet, addComment, deleteComment, deleteTweet } from '../utils/api';

const TweetDetail = ({ currentUser }) => {
  const { tweetId } = useParams();
  const navigate = useNavigate();
  const [tweet, setTweet] = useState(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [likedUsers, setLikedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTweet();
  }, [tweetId]);

  const loadTweet = async () => {
    try {
      setLoading(true);
      const data = await fetchTweet(tweetId);
      if (data && data.tweet && data.tweet.length > 0) {
        setTweet(data.tweet[0]);
        setLikes(data.likes || []);
        setComments(data.comments || []);
        setLikedUsers(data.liked_users || []);
      } else {
        setError('Tweet not found');
      }
    } catch (err) {
      setError('Failed to load tweet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const isLiked = likedUsers.includes(currentUser.username);
      
      if (isLiked) {
        await unlikeTweet(tweetId, currentUser.username);
        setLikedUsers(likedUsers.filter(user => user !== currentUser.username));
      } else {
        await likeTweet(tweetId, currentUser.username);
        setLikedUsers([...likedUsers, currentUser.username]);
      }
    } catch (err) {
      console.error('Failed to update like:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      await addComment(tweetId, currentUser.username, newComment);
      setNewComment('');
      loadTweet();
    } catch (err) {
      setError('Failed to add comment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      loadTweet();
    } catch (err) {
      setError('Failed to delete comment');
      console.error(err);
    }
  };

  const handleDeleteTweet = async () => {
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      try {
        await deleteTweet(tweetId);
        navigate('/');
      } catch (err) {
        setError('Failed to delete tweet');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-400">Loading tweet...</p>
        </div>
      </div>
    );
  }

  if (error || !tweet) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-900/30 text-red-200 p-4 rounded-md">
          {error || 'Tweet not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Tweet Card */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        {/* Tweet Header */}
        <div className="flex items-start mb-3">
          <Link to={`/profile/${tweet.username}`} className="mr-3">
            {tweet.userphoto ? (
              <img 
                src={`data:image/jpeg;base64,${tweet.userphoto}`} 
                alt={tweet.username} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="font-bold text-gray-400">
                  {tweet.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <Link to={`/profile/${tweet.username}`} className="font-bold hover:underline">
                  {tweet.author}
                </Link>
                <p className="text-gray-400 text-sm">@{tweet.username}</p>
              </div>
              
              {tweet.username === currentUser.username && (
                <button 
                  onClick={handleDeleteTweet}
                  className="text-gray-400 hover:text-red-500"
                  title="Delete tweet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Tweet Content */}
        <div className="mb-4">
          <p className="text-lg">{tweet.content_}</p>
          {tweet.photo && (
            <img 
              src={`data:image/jpeg;base64,${tweet.photo}`} 
              alt="Tweet attachment" 
              className="mt-3 max-h-96 rounded-lg object-contain"
            />
          )}
          <p className="text-gray-400 text-sm mt-2">
            {new Date(tweet.time_).toLocaleString()}
          </p>
        </div>
        
        {/* Tweet Actions */}
        <div className="flex items-center text-gray-400 border-t border-gray-700 pt-3">
          <button 
            className={`flex items-center mr-6 hover:text-red-500 ${likedUsers.includes(currentUser.username) ? 'text-red-500' : ''}`}
            onClick={handleLike}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{likedUsers.length}</span>
          </button>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{comments.length}</span>
          </div>
        </div>
      </div>
      
      {/* Likes Section */}
      {likes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Liked by</h3>
          <div className="flex flex-wrap gap-2">
            {likes.map((user) => (
              <Link 
                key={user.username} 
                to={`/profile/${user.username}`}
                className="flex items-center bg-gray-800 rounded-full px-3 py-1"
              >
                {user.userphoto ? (
                  <img 
                    src={`data:image/jpeg;base64,${user.userphoto}`} 
                    alt={user.username} 
                    className="w-6 h-6 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-gray-400">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span>@{user.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Comments Form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium mb-3">Add Comment</h3>
        <form onSubmit={handleCommentSubmit}>
          <textarea
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          ></textarea>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition duration-200"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Comments List */}
      <h3 className="text-lg font-medium mb-2">Comments</h3>
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start">
                <Link to={`/profile/${comment.username}`} className="mr-3">
                  {comment.userphoto ? (
                    <img 
                      src={`data:image/jpeg;base64,${comment.userphoto}`} 
                      alt={comment.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="font-bold text-gray-400">
                        {comment.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/profile/${comment.username}`} className="font-bold hover:underline">
                        {comment.author}
                      </Link>
                      <p className="text-gray-400 text-sm">@{comment.username}</p>
                    </div>
                    
                    {comment.username === currentUser.username && (
                      <button 
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete comment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="mt-1">{comment.content_}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(comment.time_).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No comments yet</p>
        </div>
      )}
    </div>
  );
};

export default TweetDetail;