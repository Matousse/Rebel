import React, { useState, useEffect } from 'react';
import { Music, Calendar, MapPin, Clock, Heart, MessageCircle, Share } from 'lucide-react';

function FeedPage({ user, navigateTo }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // For now, we'll load static data since we haven't built the backend for this yet
    loadStaticFeed();
  }, []);
  
  const loadStaticFeed = () => {
    // Simulated static feed data
    const staticFeed = [
      {
        id: 'post1',
        type: 'track',
        user: {
          id: 'user1',
          username: 'JazzMaster42',
          profilePicture: 'default-avatar.jpg',
          isArtist: true
        },
        content: {
          title: 'Autumn Leaves Reinterpretation',
          caption: 'Hey everyone! Here\'s a snippet of the intro to my upcoming album. Would love your feedback!',
          audioFile: 'sample-track-1.mp3',
          genre: 'Future Jazz',
          price: 2.5, // In SOL
          coverImage: 'sample-cover-1.jpg'
        },
        likes: 42,
        comments: [
          {
            id: 'comment1',
            user: {
              id: 'user2',
              username: 'FutureBeatsLover',
              profilePicture: 'default-avatar.jpg'
            },
            text: 'This is amazing! Can\'t wait for the full album release!',
            timestamp: new Date('2025-05-01T12:30:00.000Z')
          }
        ],
        timestamp: new Date('2025-05-01T10:15:00.000Z')
      },
      {
        id: 'post2',
        type: 'event',
        user: {
          id: 'user3',
          username: 'DPitchRecords',
          profilePicture: 'default-avatar.jpg',
          isLabel: true
        },
        content: {
          title: 'DPitch Showcase Paris',
          description: 'Join us for an unforgettable night of underground electronic music at La Machine du Moulin Rouge. Featuring our top artists and special guests!',
          date: 'May 19, 2025',
          location: 'Paris, France',
          coverImage: 'event-cover-1.jpg'
        },
        likes: 118,
        comments: [
          {
            id: 'comment2',
            user: {
              id: 'user4',
              username: 'TechnoEnthusiast',
              profilePicture: 'default-avatar.jpg'
            },
            text: 'Will be there for sure! Last event was incredible.',
            timestamp: new Date('2025-05-02T09:45:00.000Z')
          }
        ],
        timestamp: new Date('2025-05-02T08:30:00.000Z')
      },
      {
        id: 'post3',
        type: 'challenge',
        user: {
          id: 'user5',
          username: 'REBEL_Admin',
          profilePicture: 'default-avatar.jpg',
          isAdmin: true
        },
        content: {
          title: 'Francesco Del Garda Challenge',
          description: 'Find the curated playlist on the sonic map from the legendary digger Francesco Del Garda and win exclusive benefits!',
          deadline: 'May 10, 2025',
          prizes: ['Exclusive track downloads', 'REBEL Points', 'Early access to new features']
        },
        likes: 87,
        comments: [
          {
            id: 'comment3',
            user: {
              id: 'user6',
              username: 'DiggerQueen',
              profilePicture: 'default-avatar.jpg'
            },
            text: 'Challenge accepted! His taste in music is unparalleled.',
            timestamp: new Date('2025-05-02T14:20:00.000Z')
          }
        ],
        timestamp: new Date('2025-05-02T13:00:00.000Z')
      }
    ];
    
    setPosts(staticFeed);
    setLoading(false);
  };
  
  const handleLike = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 } 
          : post
      )
    );
  };
  
  const handleComment = (postId, comment) => {
    // In a real app, this would send the comment to the backend
    const newComment = {
      id: `comment${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture
      },
      text: comment,
      timestamp: new Date()
    };
    
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [...post.comments, newComment] 
            } 
          : post
      )
    );
  };
  
  const handleBuy = (postId) => {
    // In a real app, this would initiate a purchase transaction
    alert('Purchase functionality will be implemented soon!');
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">REBEL Feed</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-violet-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center overflow-hidden mr-3">
                    {post.user.profilePicture ? (
                      <img 
                        src={`http://localhost:5001/uploads/profiles/${post.user.profilePicture}`} 
                        alt={post.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">{post.user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center">
                      {post.user.username}
                      {post.user.isArtist && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-violet-600/20 text-violet-400 rounded-full">Artist</span>
                      )}
                      {post.user.isLabel && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded-full">Label</span>
                      )}
                      {post.user.isAdmin && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-600/20 text-red-400 rounded-full">Admin</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(post.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Post Content */}
              <div className="p-4">
                {post.type === 'track' && (
                  <div>
                    <h3 className="text-xl font-medium mb-2">{post.content.title}</h3>
                    <p className="text-gray-300 mb-4">{post.content.caption}</p>
                    <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
                      <div className="flex items-center p-3">
                        <div className="w-16 h-16 bg-violet-600/20 rounded-md flex-shrink-0 flex items-center justify-center mr-3">
                          {post.content.coverImage ? (
                            <img 
                              src={`http://localhost:5001/uploads/covers/${post.content.coverImage}`}
                              alt={post.content.title}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : (
                            <Music size={32} className="text-violet-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">{post.content.genre}</p>
                          <audio 
                            controls 
                            className="w-full"
                            src={`http://localhost:5001/uploads/tracks/${post.content.audioFile}`}
                          ></audio>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 border-t border-gray-700">
                        <span className="text-gray-300">Price: {post.content.price} SOL</span>
                        <button 
                          onClick={() => handleBuy(post.id)} 
                          className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.type === 'event' && (
                  <div>
                    <h3 className="text-xl font-medium mb-2">{post.content.title}</h3>
                    <p className="text-gray-300 mb-4">{post.content.description}</p>
                    <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
                      {post.content.coverImage && (
                        <img 
                          src={`http://localhost:5001/uploads/events/${post.content.coverImage}`}
                          alt={post.content.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center mb-2">
                          <Calendar size={16} className="text-violet-400 mr-2" />
                          <span>{post.content.date}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={16} className="text-violet-400 mr-2" />
                          <span>{post.content.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.type === 'challenge' && (
                  <div>
                    <h3 className="text-xl font-medium mb-2">{post.content.title}</h3>
                    <p className="text-gray-300 mb-4">{post.content.description}</p>
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-3">
                        <Clock size={16} className="text-violet-400 mr-2" />
                        <span>Deadline: {post.content.deadline}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-violet-400 mb-2">Prizes:</h4>
                        <ul className="list-disc pl-5 text-sm">
                          {post.content.prizes.map((prize, index) => (
                            <li key={index}>{prize}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Interactions */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center text-gray-400 hover:text-violet-400"
                    >
                      <Heart size={18} className="mr-1" />
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center text-gray-400">
                      <MessageCircle size={18} className="mr-1" />
                      <span>{post.comments.length}</span>
                    </div>
                  </div>
                  <div>
                    <button className="text-gray-400 hover:text-violet-400">
                      <Share size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-700">
                  <h4 className="text-sm font-medium mb-2">Comments</h4>
                  <div className="space-y-3">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center mr-2">
                          {comment.user.profilePicture ? (
                            <img 
                              src={`http://localhost:5001/uploads/profiles/${comment.user.profilePicture}`}
                              alt={comment.user.username}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-xs font-bold">{comment.user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-700 rounded-lg p-2">
                            <span className="font-medium text-sm">{comment.user.username}</span>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(comment.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add Comment */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center mr-2">
                    {user.profilePicture ? (
                      <img 
                        src={`http://localhost:5001/uploads/profiles/${user.profilePicture}`}
                        alt={user.username}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-bold">{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleComment(post.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedPage;