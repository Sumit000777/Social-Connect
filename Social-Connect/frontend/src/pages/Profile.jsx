import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchUserProfile,
  fetchUserPosts,
  followUser,
  unfollowUser,
  fetchUserFollowers,
  fetchUserFollowing,
  fetchFollowRequests,
  requestFollow,
  approveFollowRequest,
  removeFollower,
} from "../utils/api";
import RequestItem from "../components/RequestItem";
import defaultUserImage from "../assets/default-user.png";

const Profile = ({ currentUser }) => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequested, setFollowRequested] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileData = await fetchUserProfile(username);
        console.log("Profile data:", profileData.profile); // Debugging line
        setProfile(profileData.profile);

        const postsData = await fetchUserPosts(username);
        setPosts(postsData);

        // Fetch followers data
        try {
          const followersData = await fetchUserFollowers(username);

          // Normalize followers data
          const normalizedFollowers = followersData.map((follower) => {
            if (typeof follower === "string") {
              return { follower };
            } else if (follower && typeof follower === "object") {
              return {
                follower: follower.follower || follower.username || "Unknown",
              };
            }
            return { follower: "Unknown" };
          });

          setFollowers(normalizedFollowers);

          // Check if current user is following profile user
          if (currentUser) {
            const isAlreadyFollowing = normalizedFollowers.some(
              (f) => f.follower === currentUser.username
            );
            setIsFollowing(isAlreadyFollowing);
          }
        } catch (followersError) {
          console.error("Error fetching followers:", followersError);
          setFollowers([]);
        }

        // Fetch following data
        try {
          const followingData = await fetchUserFollowing(username);

          // Normalize following data
          const normalizedFollowing = followingData.map((follow) => {
            if (typeof follow === "string") {
              return { following: follow };
            } else if (follow && typeof follow === "object") {
              return {
                following: follow.following || follow.username || "Unknown",
              };
            }
            return { following: "Unknown" };
          });

          setFollowing(normalizedFollowing);
        } catch (followingError) {
          console.error("Error fetching following:", followingError);
          setFollowing([]);
        }

        // If this is the current user's profile, fetch follow requests
        if (isOwnProfile) {
          try {
            const requestsData = await fetchFollowRequests(
              currentUser.username
            );

            // Check if requestsData is an array
            if (Array.isArray(requestsData)) {
              setFollowRequests(requestsData);
            } else {
              console.error(
                "Follow requests data is not an array:",
                requestsData
              );
              setFollowRequests([]);
            }
          } catch (requestsError) {
            console.error("Error fetching follow requests:", requestsError);
            setFollowRequests([]);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfileData();
    }
  }, [username, currentUser, isOwnProfile]);

  const handleFollowAction = async () => {
    if (!currentUser) return;

    try {
      if (isFollowing) {
        await unfollowUser(currentUser.username, username);
        setIsFollowing(false);
      } else if (!followRequested) {
        try {
          await requestFollow(currentUser.username, username);
          setFollowRequested(true);
        } catch (error) {
          // Handle case where follow request already exists
          if (error.response?.data?.detail?.includes("Already following")) {
            setIsFollowing(true);
          } else if (
            error.response?.data?.detail?.includes(
              "Follow request already pending"
            )
          ) {
            setFollowRequested(true);
          } else {
            throw error;
          }
        }
      }

      // Refresh followers
      const followersData = await fetchUserFollowers(username);

      // Normalize followers data
      const normalizedFollowers = followersData.map((follower) => {
        if (typeof follower === "string") {
          return { follower };
        } else if (follower && typeof follower === "object") {
          return {
            follower: follower.follower || follower.username || "Unknown",
          };
        }
        return { follower: "Unknown" };
      });

      setFollowers(normalizedFollowers);
    } catch (error) {
      console.error("Error with follow action:", error);
      // You might want to show an error message to the user here
    }
  };

  const refreshRequests = async () => {
    try {
      const requestsData = await fetchFollowRequests(currentUser.username);
      if (Array.isArray(requestsData)) {
        setFollowRequests(requestsData);
      } else {
        setFollowRequests([]);
      }
    } catch (error) {
      console.error("Error refreshing follow requests:", error);
    }
  };

  const handleRemoveFollower = async (followerUsername) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${followerUsername} from your followers?`
      )
    ) {
      try {
        await removeFollower(currentUser.username, followerUsername);
        // Refresh followers list
        const updatedFollowers = await fetchUserFollowers(username);

        // Normalize followers data
        const normalizedFollowers = updatedFollowers.map((follower) => {
          if (typeof follower === "string") {
            return { follower };
          } else if (follower && typeof follower === "object") {
            return {
              follower: follower.follower || follower.username || "Unknown",
            };
          }
          return { follower: "Unknown" };
        });

        setFollowers(normalizedFollowers);
      } catch (error) {
        console.error("Error removing follower:", error);
      }
    }
  };

  const handleImageError = (e) => {
    e.target.src = defaultUserImage;
  };

  if (loading) {
    return <div className='p-6 text-center text-white'>Loading profile...</div>;
  }

  if (error) {
    return <div className='p-6 text-center text-red-500'>{error}</div>;
  }

  if (profile == null) {
    return <div className='p-6 text-center text-white'>loading...</div>;
  }

  // Check for various possible photo property names
  const getPhotoUrl = (user) => {
    if (!user) return null;

    let photoData = null;

    // Check where the image might be stored
    const possibleKeys = [
      "photo",
      "userphoto",
      "avatar",
      "profile_image",
      "profileImage",
      "image",
      "user_photo",
    ];

    for (const key of possibleKeys) {
      if (
        user[key] &&
        typeof user[key] === "string" &&
        user[key].length > 100
      ) {
        photoData = user[key];
        break;
      }
    }

    if (!photoData) return null;

    // If it's already a full data URI, return as is
    if (photoData.startsWith("data:image")) {
      return photoData;
    }

    // Try to parse if it's accidentally stringified JSON
    try {
      const parsed = JSON.parse(photoData);
      if (typeof parsed === "string") photoData = parsed;
    } catch (e) {
      // Not JSON, continue
    }

    // Clean quotation marks
    photoData = photoData.replace(/^["']|["']$/g, "");

    // Check if it's base64 or hex
    const isLikelyHex =
      /^[0-9a-fA-F]+$/.test(photoData.replace(/\s/g, "")) &&
      photoData.length % 2 === 0;

    if (isLikelyHex) {
      // Convert hex to base64
      try {
        const hexToBase64 = (hex) => {
          const binary = hex
            .match(/.{1,2}/g)
            .map((byte) => String.fromCharCode(parseInt(byte, 16)))
            .join("");
          return btoa(binary);
        };

        const base64 = hexToBase64(photoData.replace(/\s/g, ""));
        return `data:image/jpeg;base64,${base64}`;
      } catch (e) {
        console.error("Failed to convert hex to base64:", e);
        return null;
      }
    }

    // If it's already base64
    return `data:image/jpeg;base64,${photoData}`;
  };

  return (
    <div className='p-6'>
      {/* Profile Header */}
      <div className='bg-gray-800 rounded-lg p-6 mb-6'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center'>
            <div className='h-16 w-16 rounded-full overflow-hidden'>
              {getPhotoUrl(profile) ? (
                <img
                  src={getPhotoUrl(profile)}
                  alt='User'
                  className='rounded-full w-24 h-24 object-cover'
                />
              ) : (
                <div className='h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl text-white'>
                  {username && username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className='ml-4'>
              <h1 className='text-2xl font-bold text-white'>{username}</h1>
              <div className='flex space-x-4 mt-2 text-sm text-gray-400'>
                <span>{posts.length} Posts</span>
                <span>{followers.length} Followers</span>
                <span>{following.length} Following</span>
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUser && (
            <button
              onClick={handleFollowAction}
              className={`px-4 py-2 rounded-lg text-white ${
                isFollowing
                  ? "bg-gray-600 hover:bg-red-700"
                  : followRequested
                  ? "bg-yellow-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}>
              {isFollowing
                ? "Unfollow"
                : followRequested
                ? "Request Sent"
                : "Follow"}
            </button>
          )}
        </div>

        <p className='mt-4 text-gray-300'>{profile.bio || "No bio yet"}</p>
      </div>

      {/* Tabs */}
      <div className='flex border-b border-gray-700 mb-6'>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 ${
            activeTab === "posts"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400"
          }`}>
          Posts
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`px-4 py-2 ${
            activeTab === "followers"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400"
          }`}>
          Followers
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`px-4 py-2 ${
            activeTab === "following"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400"
          }`}>
          Following
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 ${
              activeTab === "requests"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-400"
            }`}>
            Follow Requests{" "}
            {followRequests.length > 0 && `(${followRequests.length})`}
          </button>
        )}
      </div>

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div>
          {posts.length === 0 ? (
            <p className='text-center text-gray-400'>No posts yet</p>
          ) : (
            <div>
              {posts.map((post) => (
                <div key={post.id} className='bg-gray-800 p-4 rounded-lg mb-4'>
                  <div className='flex items-center mb-2'>
                    <div className='h-10 w-10 rounded-full overflow-hidden'>
                      {getPhotoUrl(post) ? (
                        <img
                          src={getPhotoUrl(post)}
                          alt={post.username || username}
                          className='w-full h-full object-cover'
                          onError={handleImageError}
                        />
                      ) : (
                        <div className='h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white'>
                          {(post.username || username) &&
                            (post.username || username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className='ml-3'>
                      <p className='font-semibold text-white'>
                        {post.username || username}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className='text-gray-200'>{post.content}</p>
                  <Link
                    to={`/tweet/${post.id}`}
                    className='text-blue-400 hover:underline text-sm mt-2 inline-block'>
                    View Post
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Followers Tab */}
      {activeTab === "followers" && (
        <div>
          {followers.length === 0 ? (
            <p className='text-center text-gray-400'>No followers yet</p>
          ) : (
            <div>
              {followers.map((follower, index) => {
                const followerUsername =
                  typeof follower === "string"
                    ? follower
                    : follower && follower.follower
                    ? follower.follower
                    : `Unknown-${index}`;

                return (
                  <div
                    key={`follower-${index}-${followerUsername}`}
                    className='bg-gray-800 p-4 rounded-lg mb-2 flex justify-between items-center'>
                    <div className='flex items-center'>
                      <div className='h-10 w-10 rounded-full overflow-hidden'>
                        {getPhotoUrl(follower) ? (
                          <img
                            src={getPhotoUrl(follower)}
                            alt={followerUsername}
                            className='w-full h-full object-cover'
                            onError={handleImageError}
                          />
                        ) : (
                          <div className='h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white'>
                            {followerUsername &&
                              followerUsername.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className='ml-3'>
                        <Link
                          to={`/profile/${followerUsername}`}
                          className='font-semibold hover:underline text-white'>
                          {followerUsername}
                        </Link>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <button
                        onClick={() => handleRemoveFollower(followerUsername)}
                        className='px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white'>
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === "following" && (
        <div>
          {following.length === 0 ? (
            <p className='text-center text-gray-400'>
              Not following anyone yet
            </p>
          ) : (
            <div>
              {following.map((follow, index) => {
                const followUsername =
                  typeof follow === "string"
                    ? follow
                    : follow && follow.following
                    ? follow.following
                    : follow && follow.username
                    ? follow.username
                    : `Unknown-${index}`;

                return (
                  <div
                    key={`following-${followUsername}-${index}`}
                    className='bg-gray-800 p-4 rounded-lg mb-2'>
                    <div className='flex items-center'>
                      <div className='h-10 w-10 rounded-full overflow-hidden'>
                        {getPhotoUrl(follow) ? (
                          <img
                            src={getPhotoUrl(follow)}
                            alt={followUsername}
                            className='w-full h-full object-cover'
                            onError={handleImageError}
                          />
                        ) : (
                          <div className='h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white'>
                            {followUsername &&
                              followUsername.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className='ml-3'>
                        <Link
                          to={`/profile/${followUsername}`}
                          className='font-semibold hover:underline text-white'>
                          {followUsername}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Follow Requests Tab */}
      {activeTab === "requests" && isOwnProfile && (
        <div>
          {!Array.isArray(followRequests) || followRequests.length === 0 ? (
            <p className='text-center text-gray-400'>
              No pending follow requests
            </p>
          ) : (
            <div>
              {followRequests.map((request, index) => {
                // Add debug logging
                console.log(`Follow request ${index}:`, request);
                console.log("Current user:", currentUser?.username);

                return (
                  <RequestItem
                    key={request.id || `request-${index}`}
                    request={request}
                    type='follow'
                    onRequestUpdate={refreshRequests}
                    currentUser={currentUser}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;