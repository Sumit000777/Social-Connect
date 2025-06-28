import React from 'react';
import { approveGroupRequest, approveFollowRequest } from '../utils/api';

const RequestItem = ({ request, type, onRequestUpdate, currentUser }) => {
  // Debug logging
  console.log('Request Item:', request);
  console.log('Request Status:', request?.status);
  console.log('Current User:', currentUser?.username);
  console.log('Type:', type);
  console.log('Request Admin:', request?.admin);
  
  // For follow requests, check if current user is the target of the follow request
  const isFollowTarget = type === 'follow' && request?.target === currentUser?.username;
  
  // For group requests, check if current user is admin
  const isGroupAdmin = type === 'group' && request?.admin === currentUser?.username;
  
  // Additional debug log for group admin check
  if (type === 'group') {
    console.log('Group Admin Check:', {
      requestAdmin: request?.admin,
      currentUsername: currentUser?.username,
      isGroupAdmin: isGroupAdmin
    });
  }
  
  // Can approve/reject if:
  // - For group requests: user is admin AND status is pending
  // - For follow requests: user is target of the request AND status is pending
  const canApprove = (type === 'group' && isGroupAdmin && request?.status === 'pending') || 
                     (type === 'follow' && isFollowTarget && request?.status === 'pending');

  // For group requests, display username
  // For follow requests, display requester
  const displayName = type === 'group' ? request?.username : request?.requester;
  const firstChar = displayName ? displayName.charAt(0).toUpperCase() : '?';

  const handleAction = async (action) => {
    try {
      console.log(`Handling ${action} for request ${request.id}`);
      
      if (type === 'group') {
        await approveGroupRequest(request.id, action);
      } else {
        await approveFollowRequest(request.id, action);
      }
      
      // Call the parent function to refresh the requests list
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
    }
  };

  // Format date properly
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleString();
    } catch (e) {
      return date;
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-2 flex justify-between items-center">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {firstChar}
        </div>
        <div className="ml-3">
          <p className="font-semibold text-white">
            {displayName || 'Unknown User'}
          </p>
          <p className="text-sm text-gray-400">
            {type === 'group'
              ? `Wants to join ${request?.grp_name || 'group'}`
              : `Wants to follow ${request?.target || 'you'}`}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(request?.request_time)}
          </p>
        </div>
      </div>
      
      {canApprove ? (
        <div className="flex space-x-2">
          <button 
            onClick={() => handleAction('approved')}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
          >
            Approve
          </button>
          <button 
            onClick={() => handleAction('rejected')}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
          >
            Reject
          </button>
        </div>
      ) : (
        <span className={`px-3 py-1 rounded text-sm ${
          request?.status === 'approved' ? 'bg-green-700 text-green-100' :
          request?.status === 'rejected' ? 'bg-red-700 text-red-100' :
          'bg-gray-700 text-gray-300'
        }`}>
          {request?.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Unknown Status'}
        </span>
      )}
    </div>
  );
};

export default RequestItem;