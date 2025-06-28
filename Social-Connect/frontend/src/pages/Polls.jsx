// src/pages/Polls.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPollFeed, createPoll, castVote, deletePoll } from '../utils/api';

const Polls = ({ currentUser }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New poll form state
  const [showNewPollForm, setShowNewPollForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const response = await fetchPollFeed();
      setPolls(response || []);
    } catch (err) {
      setError('Failed to load polls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!question.trim() || !optionA.trim() || !optionB.trim()) return;
    
    try {
      setSubmitting(true);
      
      await createPoll({
        username: currentUser.username,
        Question: question,
        optiona: optionA,
        optionb: optionB,
        optionc: optionC
      });
      
      // Reset form
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setShowNewPollForm(false);
      
      // Reload polls
      loadPolls();
    } catch (err) {
      setError('Failed to create poll');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollId, option) => {
    try {
      await castVote(currentUser.username, pollId, option);
      loadPolls(); // Refresh polls to show updated votes
    } catch (err) {
      setError('Failed to cast vote');
      console.error(err);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      try {
        await deletePoll(pollId);
        loadPolls(); // Refresh polls
      } catch (err) {
        setError('Failed to delete poll');
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Polls</h1>
      
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
      
      {/* Create Poll Button */}
      <div className="mb-6">
        <button 
          onClick={() => setShowNewPollForm(!showNewPollForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition duration-200"
        >
          {showNewPollForm ? 'Cancel' : 'Create New Poll'}
        </button>
      </div>
      
      {/* New Poll Form */}
      {showNewPollForm && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <form onSubmit={handleCreatePoll}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Question</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Option A</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="First option"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Option B</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Second option"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Option C (optional)</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Third option (optional)"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition duration-200"
                disabled={submitting || !question.trim() || !optionA.trim() || !optionB.trim()}
              >
                {submitting ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Polls List */}
      {loading ? (
        <div className="text-center py-6">
          <p className="text-gray-400">Loading polls...</p>
        </div>
      ) : polls.length > 0 ? (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard 
              key={poll.id_} 
              poll={poll} 
              currentUser={currentUser} 
              onVote={handleVote}
              onDelete={handleDeletePoll}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-400">No polls available. Create one!</p>
        </div>
      )}
    </div>
  );
};

// Poll Card Component
const PollCard = ({ poll, currentUser, onVote, onDelete }) => {
  const [pollDetails, setPollDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPollDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/poll/${poll.id_}`);
        if (response.ok) {
          const data = await response.json();
          setPollDetails(data);
        }
      } catch (err) {
        console.error('Failed to fetch poll details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPollDetails();
  }, [poll.id_]);
  
  // Check if user has voted
  const hasVoted = pollDetails?.voted?.includes(currentUser.username);
  
  // Get vote counts for options
  const getVoteCount = (option) => {
    if (!pollDetails?.count) return 0;
    const voteData = pollDetails.count.find(item => item[0] === option);
    return voteData ? voteData[1] : 0;
  };
  
  // Calculate percentages
  const calculatePercentage = (option) => {
    if (!pollDetails?.count || pollDetails.count.length === 0) return 0;
    
    const totalVotes = pollDetails.count.reduce((acc, curr) => acc + curr[1], 0);
    if (totalVotes === 0) return 0;
    
    const voteCount = getVoteCount(option);
    return Math.round((voteCount / totalVotes) * 100);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <img 
            src={poll.photo ? `data:image/jpeg;base64,${poll.photo}` : '/default-avatar.png'} 
            alt={`${poll.username}'s avatar`} 
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
          <div>
            <p className="font-semibold">{poll.name}</p>
            <Link to={`/profile/${poll.username}`} className="text-gray-400 text-sm hover:underline">
              @{poll.username}
            </Link>
          </div>
        </div>
        
        {currentUser.username === poll.username && (
          <button 
            className="text-gray-400 hover:text-red-500"
            onClick={() => onDelete(poll.id_)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <h3 className="font-medium text-lg mt-3 mb-4">{poll.content_}</h3>
      
      {loading ? (
        <p className="text-gray-400 text-sm">Loading poll options...</p>
      ) : (
        <div className="space-y-3">
          {pollDetails?.options?.map((option, index) => (
            <div key={index} className="relative">
              <button
                className={`w-full text-left p-3 rounded-md transition duration-200 ${
                  hasVoted 
                    ? 'bg-gray-700 cursor-default' 
                    : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                }`}
                onClick={() => !hasVoted && onVote(poll.id_, option)}
                disabled={hasVoted}
              >
                <div className="flex justify-between">
                  <span>{option}</span>
                  {hasVoted && <span>{calculatePercentage(option)}%</span>}
                </div>
                
                {hasVoted && (
                  <div className="mt-1 bg-gray-600 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${calculatePercentage(option)}%` }}
                    ></div>
                  </div>
                )}
              </button>
            </div>
          ))}
          
          {hasVoted && (
            <p className="text-gray-400 text-sm mt-2">
              {pollDetails.count.reduce((acc, curr) => acc + curr[1], 0)} votes
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Polls;