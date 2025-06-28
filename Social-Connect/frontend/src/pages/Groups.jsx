// src/pages/Groups.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllGroups, createGroup } from '../utils/api';

const Groups = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New group form state
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await fetchAllGroups();
      setGroups(response || []);
    } catch (err) {
      setError('Failed to load groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !groupBio.trim()) return;
    
    try {
      setSubmitting(true);
      
      await createGroup({
        admin: currentUser.username,
        groupname: groupName,
        groupbio: groupBio,
        groupphoto: groupPhoto
      });
      
      // Reset form
      setGroupName('');
      setGroupBio('');
      setGroupPhoto(null);
      setPhotoPreview(null);
      setShowNewGroupForm(false);
      
      // Reload groups
      loadGroups();
    } catch (err) {
      setError('Failed to create group');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Groups</h1>
      
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
      
      {/* Create Group Button */}
      <div className="mb-6">
        <button 
          onClick={() => setShowNewGroupForm(!showNewGroupForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition duration-200"
        >
          {showNewGroupForm ? 'Cancel' : 'Create New Group'}
        </button>
      </div>
      
      {/* New Group Form */}
      {showNewGroupForm && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <form onSubmit={handleCreateGroup}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Group Name</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Group Bio</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What's this group about?"
                rows="3"
                value={groupBio}
                onChange={(e) => setGroupBio(e.target.value)}
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Group Photo (optional)</label>
              <div className="flex items-center">
                <label className="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                {photoPreview && (
                  <div className="ml-4 relative">
                    <img 
                      src={photoPreview} 
                      alt="Group photo preview" 
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-gray-900 rounded-full p-1"
                      onClick={() => {
                        setGroupPhoto(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition duration-200"
                disabled={submitting || !groupName.trim() || !groupBio.trim()}
              >
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Groups List */}
      {loading ? (
        <div className="text-center py-6">
          <p className="text-gray-400">Loading groups...</p>
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Link 
              key={group.grpname} 
              to={`/group/${group.grpname}`}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-200"
            >
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-700 mr-4">
                  {group.photo ? (
                    <img 
                      src={`data:image/jpeg;base64,${group.photo}`} 
                      alt={`${group.grpname} group`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-blue-600">
                      <span className="text-xl font-bold">{group.grpname.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{group.grpname}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-400">No groups available. Create one!</p>
        </div>
      )}
    </div>
  );
};

export default Groups;