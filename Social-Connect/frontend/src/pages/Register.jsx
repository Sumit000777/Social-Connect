import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUser, loginUser } from '../utils/api';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    mailid: '',
    firstname: '',
    lastname: '',
    location: '',
    bio: '',
    website: '',
    dateofbirth: '',
    photo: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await createUser(formData);
      
      // Automatically log in after registration
      const userData = await loginUser(formData.username, formData.password);
      onLogin(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-8">Create an Account</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="username" className="block mb-1 text-sm font-medium">
                Username*
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block mb-1 text-sm font-medium">
                Password*
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="mailid" className="block mb-1 text-sm font-medium">
                Email*
              </label>
              <input
                type="email"
                id="mailid"
                name="mailid"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.mailid}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="firstname" className="block mb-1 text-sm font-medium">
                First Name*
              </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="lastname" className="block mb-1 text-sm font-medium">
                Last Name*
              </label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="location" className="block mb-1 text-sm font-medium">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="bio" className="block mb-1 text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              value={formData.bio}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="website" className="block mb-1 text-sm font-medium">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.website}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="dateofbirth" className="block mb-1 text-sm font-medium">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateofbirth"
                name="dateofbirth"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={formData.dateofbirth}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="photo" className="block mb-1 text-sm font-medium">
              Profile Photo
            </label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              onChange={handlePhotoChange}
            />
            {photoPreview && (
              <div className="mt-2">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-full"
                />
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;