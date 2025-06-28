// src/pages/Feed.jsx
import React, { useState, useEffect } from 'react';
import { fetchFeed, createTweet } from '../utils/api';
import TweetCard from '../components/tweet/TweetCard';

const Feed = ({ username }) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTweet, setNewTweet] = useState('');
  const [tweetPhoto, setTweetPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [username]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const response = await fetchFeed(username);
      setTweets(response.data || []);
    } catch (err) {
      setError('Failed to load feed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTweetPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTweet.trim() && !tweetPhoto) return;
    
    try {
      setSubmitting(true);
      
      await createTweet({
        username,
        content: newTweet,
        photo: tweetPhoto
      });
      
      // Reset form
      setNewTweet('');
      setTweetPhoto(null);
      setPhotoPreview(null);
      
      // Reload feed
      loadFeed();
    } catch (err) {
      setError('Failed to post tweet');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Home Feed</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-md">
          {error}
          <button 
            className="ml-2 underline" 
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* New Tweet Form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <form onSubmit={handleSubmit}>
          <textarea
           // src/pages/Feed.jsx (continued)
           className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
           rows="3"
           placeholder="What's happening?"
           value={newTweet}
           onChange={(e) => setNewTweet(e.target.value)}
         ></textarea>
         
         {photoPreview && (
           <div className="mt-2 relative">
             <img 
               src={photoPreview} 
               alt="Tweet attachment" 
               className="max-h-64 rounded-md object-contain"
             />
             <button
               type="button"
               className="absolute top-2 right-2 bg-gray-900/70 p-1 rounded-full"
               onClick={() => {
                 setTweetPhoto(null);
                 setPhotoPreview(null);
               }}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
               </svg>
             </button>
           </div>
         )}
         
         <div className="flex justify-between mt-3">
           <label className="cursor-pointer text-blue-400 hover:text-blue-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <input
               type="file"
               accept="image/*"
               className="hidden"
               onChange={handlePhotoChange}
             />
           </label>
           
           <button
             type="submit"
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition duration-200"
             disabled={submitting || (!newTweet.trim() && !tweetPhoto)}
           >
             {submitting ? 'Posting...' : 'Tweet'}
           </button>
         </div>
       </form>
     </div>
     
     {/* Tweet List */}
     {loading ? (
       <div className="text-center py-6">
         <p className="text-gray-400">Loading tweets...</p>
       </div>
     ) : tweets.length > 0 ? (
       <div className="space-y-4">
         {tweets.map((tweet) => (
           <TweetCard 
             key={tweet.tweetid} 
             tweet={tweet} 
             currentUser={username} 
             onDelete={loadFeed}
           />
         ))}
       </div>
     ) : (
       <div className="text-center py-6">
         <p className="text-gray-400">No tweets in your feed. Follow users to see their tweets!</p>
       </div>
     )}
   </div>
 );
};

export default Feed;