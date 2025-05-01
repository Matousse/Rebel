import React, { useState, useEffect } from 'react';

// Icons
import { Music, Upload, Shield, User, LogOut, LogIn, Award, HelpCircle, Home } from 'lucide-react';

/**
 * Main App Component
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [magicSDK, setMagicSDK] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [error, setError] = useState('');

  // Initialiser Magic SDK et vérifier l'état de l'utilisateur
  useEffect(() => {
    const initMagic = async () => {
      try {
        // En production, utilisez une variable d'environnement
        const magic = new window.Magic('pk_live_DAE97419AE6EBC48');
        setMagicSDK(magic);
        
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = await magic.user.isLoggedIn();
        
        if (isLoggedIn) {
          const userMetadata = await magic.user.getMetadata();
          const token = localStorage.getItem('token');
          
          if (token) {
            // Récupérer le profil utilisateur depuis l'API
            try {
              const response = await fetch('http://localhost:5001/api/users/profile', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                if (userData.success) {
                  setUser({
                    ...userData.data,
                    token
                  });
                  console.log('User authenticated:', userData.data);
                }
              } else {
                // Token invalide, le supprimer
                localStorage.removeItem('token');
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              localStorage.removeItem('token');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing Magic:', error);
        setError('Failed to initialize authentication system');
      } finally {
        setLoading(false);
      }
    };
    
    initMagic();
  }, []);

  // Se déconnecter
  const handleLogout = async () => {
    if (magicSDK) {
      try {
        await magicSDK.user.logout();
        localStorage.removeItem('token');
        setUser(null);
        setCurrentPage('home');
      } catch (error) {
        console.error('Error logging out:', error);
        setError('Failed to log out');
      }
    }
  };

  // Fonction pour afficher la page actuelle
  const renderPage = () => {
    switch(currentPage) {
      case 'login':
        return <LoginPage 
                 onBack={() => setCurrentPage('home')} 
                 magicSDK={magicSDK} 
                 setUser={setUser} 
                 navigateTo={setCurrentPage}
               />;
      case 'profile':
        return user ? (
          <ProfilePage user={user} setUser={setUser} onBack={() => setCurrentPage('home')} />
        ) : (
          <LoginPage 
            onBack={() => setCurrentPage('home')} 
            magicSDK={magicSDK} 
            setUser={setUser} 
            navigateTo={setCurrentPage}
          />
        );
      case 'tracks':
        return user ? (
          <TracksPage user={user} onBack={() => setCurrentPage('home')} />
        ) : (
          <LoginPage 
            onBack={() => setCurrentPage('home')} 
            magicSDK={magicSDK} 
            setUser={setUser} 
            navigateTo={setCurrentPage}
          />
        );
      case 'upload':
        return user ? (
          <UploadPage user={user} onBack={() => setCurrentPage('home')} />
        ) : (
          <LoginPage 
            onBack={() => setCurrentPage('home')} 
            magicSDK={magicSDK} 
            setUser={setUser} 
            navigateTo={setCurrentPage}
          />
        );
      case 'proofs':
        return user ? (
          <ProofsPage user={user} onBack={() => setCurrentPage('home')} />
        ) : (
          <LoginPage 
            onBack={() => setCurrentPage('home')} 
            magicSDK={magicSDK} 
            setUser={setUser} 
            navigateTo={setCurrentPage}
          />
        );
      case 'help':
        return <HelpPage onBack={() => setCurrentPage('home')} />;
      default:
        return <HomePage user={user} navigateTo={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header avec navigation */}
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-violet-500">REBEL</h1>
          <nav className="hidden md:flex space-x-4">
            <button 
              onClick={() => setCurrentPage('home')}
              className="text-gray-300 hover:text-white"
            >
              Home
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => setCurrentPage('tracks')}
                  className="text-gray-300 hover:text-white"
                >
                  My Tracks
                </button>
                <button 
                  onClick={() => setCurrentPage('upload')}
                  className="text-gray-300 hover:text-white"
                >
                  Upload
                </button>
                <button 
                  onClick={() => setCurrentPage('proofs')}
                  className="text-gray-300 hover:text-white"
                >
                  Proofs
                </button>
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className="text-gray-300 hover:text-white"
                >
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => setCurrentPage('login')}
                className="text-violet-400 hover:text-violet-300"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-600"></div>
          </div>
        ) : (
          renderPage()
        )}
      </main>

      {/* Messages d'erreur */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-900 text-white p-4 rounded-lg shadow-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-4 text-white font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// Page d'accueil
function HomePage({ user, navigateTo }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-violet-500 mb-4">REBEL</h1>
        <p className="text-xl text-gray-300">Anti-Algorithm Music Hub</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Our Vision</h2>
          <p className="text-gray-300 mb-4">
            REBEL is the definitive anti-algorithmic sanctuary for underground music, 
            where human curation trumps AI recommendations, restoring cultural value and 
            financial sustainability to authentic electronic and experimental music scenes.
          </p>
          <p className="text-gray-300">
            We rebuild the discovery-to-monetization pipeline through a decentralized ecosystem 
            where fans, DJs, and micro-labels connect directly, underpinned by transparent Web3 
            infrastructure.
          </p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          {user ? (
            <div>
              <p className="text-gray-300 mb-4">
                Welcome, <span className="text-violet-400">{user.username || user.email}</span>!
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigateTo('upload')}
                  className="flex items-center text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  <span>Upload a new track</span>
                </button>
                <button 
                  onClick={() => navigateTo('tracks')}
                  className="flex items-center text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Music size={16} className="mr-2" />
                  <span>Manage your tracks</span>
                </button>
                <button 
                  onClick={() => navigateTo('proofs')}
                  className="flex items-center text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Shield size={16} className="mr-2" />
                  <span>View your ownership proofs</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">
                Join the community and start sharing your music with true ownership.
              </p>
              <button 
                onClick={() => navigateTo('login')}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <LogIn size={16} className="mr-2" />
                  <span>Login with Magic Link</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center mb-3">
              <Music size={24} className="text-violet-400" />
            </div>
            <h3 className="font-medium mb-2">Sonic Map</h3>
            <p className="text-sm text-gray-400">Visual interface representing music by sonic characteristics</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center mb-3">
              <Upload size={24} className="text-violet-400" />
            </div>
            <h3 className="font-medium mb-2">P2P Sharing</h3>
            <p className="text-sm text-gray-400">Decentralized exchange for rare tracks with provenance verification</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center mb-3">
              <Award size={24} className="text-violet-400" />
            </div>
            <h3 className="font-medium mb-2">Live Crates</h3>
            <p className="text-sm text-gray-400">Time-limited thematic challenges with community voting</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center mb-3">
              <Shield size={24} className="text-violet-400" />
            </div>
            <h3 className="font-medium mb-2">Proof of Creation</h3>
            <p className="text-sm text-gray-400">Blockchain-based timestamp proof for your creative work</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page de Login
function LoginPage({ onBack, magicSDK, setUser, navigateTo }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isArtist, setIsArtist] = useState(false);

  // Connexion avec Magic Link
  const handleMagicLogin = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (!magicSDK) {
        throw new Error('Authentication system not initialized');
      }
      
      // Obtenir le DID token de Magic
      await magicSDK.auth.loginWithMagicLink({ email });
      const didToken = await magicSDK.user.getIdToken();
      
      // Envoyer au backend pour vérification et obtenir un JWT
      const response = await fetch('http://localhost:5001/api/magic/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          didToken,
          username: username || undefined,
          isArtist
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        
        const userData = { ...data.data.user, token: data.data.token };
        setUser(userData);
        navigateTo('home');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connexion traditionnelle avec email/password
  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Connexion via méthode JWT traditionnelle
      const response = await fetch('http://localhost:5001/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        
        const userData = { ...data.data.user, token: data.data.token };
        setUser(userData);
        navigateTo('home');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Inscription traditionnelle
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!email || !username || !password) {
      setError('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Inscription via méthode traditionnelle
      const response = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          username, 
          password,
          isArtist
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        
        const userData = { ...data.data.user, token: data.data.token };
        setUser(userData);
        navigateTo('home');
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-violet-500">
        {isSignUp ? "Create Account" : "Login to REBEL"}
      </h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {isSignUp ? (
          // Formulaire d'inscription
          <form onSubmit={handleSignUp}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={isArtist}
                  onChange={(e) => setIsArtist(e.target.checked)}
                  className="rounded border-gray-600 text-violet-600 focus:ring-violet-500 h-4 w-4 bg-gray-700"
                />
                <span className="ml-2 text-gray-300">Sign up as an artist</span>
              </label>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <div className="text-center text-gray-500">OR</div>
              <button 
                type="button" 
                onClick={handleMagicLogin}
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg border border-gray-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Sign Up with Magic Link'}
              </button>
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-violet-400 hover:text-violet-300"
                >
                  Already have an account? Log in
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Formulaire de connexion
          <div>
            <div className="mb-6">
              <button 
                onClick={handleMagicLogin}
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <LogIn size={20} className="mr-2" />
                {isLoading ? 'Connecting...' : 'Login with Magic Link'}
              </button>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">Or login with email/password</span>
              </div>
            </div>
            
            <form onSubmit={handleTraditionalLogin}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Logging In...' : 'Login'}
                </button>
                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-violet-400 hover:text-violet-300"
                  >
                    Need an account? Sign up
                  </button>
                </div>
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={onBack}
                    className="text-gray-400 hover:text-gray-300 text-sm"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Page Profil
function ProfilePage({ user, setUser, onBack }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    isArtist: user?.isArtist || false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
    if (!user?.token) return;
    
    setWalletLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/magic/wallet', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });
      
      if (profilePicture) {
        formDataObj.append('profilePicture', profilePicture);
      }
      
      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formDataObj
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Profile updated successfully');
        
        // Update user in state
        setUser(prev => ({
          ...prev,
          ...data.data
        }));
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const becomeArtist = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:5001/api/users/become-artist', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('You are now registered as an artist!');
        setFormData(prev => ({ ...prev, isArtist: true }));
        
        // Update user in state
        setUser(prev => ({
          ...prev,
          isArtist: true
        }));
      } else {
        throw new Error(data.message || 'Failed to register as artist');
      }
    } catch (error) {
      console.error('Become artist error:', error);
      setError(error.message || 'Failed to register as artist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Your Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Profile Picture</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                      <img 
                        src={`http://localhost:5001/uploads/profiles/${user.profilePicture}`}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold">{user.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 h-32"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
          
          {!formData.isArtist && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Become an Artist</h2>
              <p className="text-gray-300 mb-4">
                Register as an artist to upload tracks and create timestamps proofs of your works.
              </p>
              <button
                onClick={becomeArtist}
                disabled={isLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Register as Artist'}
              </button>
            </div>
          )}
        </div>
        
        <div>
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
            {walletLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-violet-600"></div>
              </div>
            ) : walletInfo ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-gray-400 text-sm">Solana Address</h3>
                  <p className="font-mono text-sm bg-gray-900 p-2 rounded mt-1 break-all">
                    {walletInfo.solanaAddress}
                  </p>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Balance</h3>
                  <p className="text-xl font-medium mt-1">{walletInfo.balance} SOL</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No wallet information available.</p>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Account Status</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-gray-400 text-sm">Account Type</h3>
                <p className="font-medium">
                  {formData.isArtist ? (
                    <span className="text-violet-400">Artist</span>
                  ) : (
                    <span>Regular User</span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">Member Since</h3>
                <p className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page Tracks
function TracksPage({ user, onBack }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/tracks', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTracks(data.data);
        } else {
          setError(data.message || 'Failed to fetch tracks');
        }
      } else {
        setError('Failed to fetch tracks');
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setError(error.message || 'Failed to fetch tracks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-violet-500">My Tracks</h1>
        <button
          onClick={() => window.location.href = '/api/upload'}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
        >
          <Upload size={18} className="mr-2" />
          Upload New Track
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-violet-600"></div>
        </div>
      ) : tracks.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {tracks.map(track => (
            <div key={track._id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-violet-600/20 flex items-center justify-center mr-4 flex-shrink-0">
                    <Music size={20} className="text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{track.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {track.genre} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Uploaded {new Date(track.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {track.description && (
                  <p className="text-gray-300 mt-3 text-sm">{track.description}</p>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {track.tags && track.tags.map(tag => (
                    <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-gray-400 text-sm">
                    <span className="mr-4">{track.plays || 0} plays</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <a 
                      href={`http://localhost:5001/uploads/tracks/${track.audioFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                    >
                      Play
                    </a>
                    <button 
                      onClick={() => window.location.href = `/tracks/${track._id}/proof`}
                      className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-sm font-medium py-1 px-3 rounded transition-colors flex items-center"
                    >
                      <Shield size={14} className="mr-1" />
                      Create Proof
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Music size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No tracks yet</h3>
          <p className="text-gray-400 mb-6">
            You haven't uploaded any tracks yet. Upload your first track to get started.
          </p>
          <button
            onClick={() => window.location.href = '/upload'}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            <Upload size={18} className="mr-2" />
            Upload First Track
          </button>
        </div>
      )}
      
      <div className="mt-6">
        <button
          onClick={onBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// Upload Page
function UploadPage({ user, onBack }) {
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
    tags: '',
    isPublic: true
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Vérifier que l'utilisateur est un artiste
  useEffect(() => {
    if (!user.isArtist) {
      setError('You need to be registered as an artist to upload tracks.');
    }
  }, [user.isArtist]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAudioFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleCoverImageChange = (e) => {
    setCoverImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const uploadData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        uploadData.append(key, value);
      });
      
      // Convertir la chaîne de tags en array
      if (formData.tags) {
        uploadData.delete('tags');
        formData.tags.split(',').forEach(tag => {
          uploadData.append('tags', tag.trim());
        });
      }
      
      uploadData.append('audioFile', audioFile);
      
      if (coverImage) {
        uploadData.append('coverImage', coverImage);
      }
      
      const response = await fetch('http://localhost:5001/api/tracks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: uploadData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Track uploaded successfully!');
        setFormData({
          title: '',
          genre: '',
          description: '',
          tags: '',
          isPublic: true
        });
        setAudioFile(null);
        setCoverImage(null);
      } else {
        throw new Error(data.message || 'Failed to upload track');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload track. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Upload Track</h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Genre *</label>
            <input
              type="text"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 h-32"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="electronic, ambient, experimental"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Audio File *</label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
              required
            />
            <p className="mt-1 text-gray-500 text-xs">
              Supported formats: MP3, WAV, FLAC, OGG (max 30MB)
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Cover Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
            />
            <p className="mt-1 text-gray-500 text-xs">
              Recommended: 800x800 JPG or PNG (max 2MB)
            </p>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input 
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="rounded border-gray-600 text-violet-600 focus:ring-violet-500 h-4 w-4 bg-gray-700"
              />
              <span className="ml-2 text-gray-300">Make this track public</span>
            </label>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading || !user.isArtist}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Upload Track'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Proofs Page
function ProofsPage({ user, onBack }) {
    const [proofs, setProofs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    useEffect(() => {
      fetchProofs();
    }, []);
  
    const fetchProofs = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/proofs/user/me', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProofs(data.data.proofs || []);
          } else {
            setError(data.message || 'Failed to fetch proofs');
          }
        } else {
          setError('Failed to fetch proofs');
        }
      } catch (error) {
        console.error('Error fetching proofs:', error);
        setError(error.message || 'Failed to fetch proofs');
      } finally {
        setLoading(false);
      }
    };
  
    const payForProof = async (proofId) => {
      try {
        const response = await fetch(`http://localhost:5001/api/proofs/pay/${proofId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Refresh proofs list
          fetchProofs();
        } else {
          setError(data.message || 'Payment failed');
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError(error.message || 'Payment failed');
      }
    };
  
    const downloadProof = async (proofId) => {
      try {
        const response = await fetch(`http://localhost:5001/api/proofs/download/${proofId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `proof_${proofId}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to download proof');
        }
      } catch (error) {
        console.error('Download error:', error);
        setError(error.message || 'Failed to download proof');
      }
    };
  
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-violet-500">My Proofs of Creation</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-violet-600"></div>
          </div>
        ) : proofs.length > 0 ? (
          <div className="space-y-6">
            {proofs.map(proof => (
              <div key={proof._id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-lg bg-violet-600/20 flex items-center justify-center mr-4 flex-shrink-0">
                      <Shield size={20} className="text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{proof.title}</h3>
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(proof.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          proof.status === 'CONFIRMED' 
                            ? 'bg-green-900/50 text-green-300' 
                            : proof.status === 'PENDING' 
                            ? 'bg-yellow-900/50 text-yellow-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {proof.status}
                        </span>
                        {proof.blockchain?.transactionId && (
                          
                          <a
                          href={`https://explorer.solana.com/tx/${proof.blockchain.transactionId}?cluster=${proof.blockchain.network}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-violet-400 hover:underline"
                        >
                          View on Explorer
                        </a>
                        
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="font-mono text-xs bg-gray-900 p-2 rounded break-all">
                      {proof.contentHash}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Version: {proof.version}
                    </div>
                    
                    <div className="flex space-x-2">
                      {proof.payment?.isPaid ? (
                        proof.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => downloadProof(proof._id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors flex items-center"
                          >
                            Download Proof
                          </button>
                        ) : (
                          <span className="text-yellow-400 text-sm">Processing...</span>
                        )
                      ) : (
                        <button
                          onClick={() => payForProof(proof._id)}
                          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                        >
                          Pay {proof.payment?.cost || 10} RP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Shield size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No proofs yet</h3>
            <p className="text-gray-400 mb-6">
              You haven't created any proofs of creation yet.
            </p>
            <button
              onClick={() => window.location.href = '/tracks'}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
            >
              <Music size={18} className="mr-2" />
              Go to My Tracks
            </button>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }
  
  // Help Page
  function HelpPage({ onBack }) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-violet-500">About REBEL</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Our Vision</h2>
          <p className="text-gray-300 mb-4">
            REBEL is the definitive anti-algorithmic sanctuary for underground music, 
            where human curation trumps AI recommendations, restoring cultural value and 
            financial sustainability to authentic electronic and experimental music scenes.
          </p>
          <p className="text-gray-300">
            We rebuild the discovery-to-monetization pipeline through a decentralized ecosystem 
            where fans, DJs, and micro-labels connect directly, underpinned by transparent Web3 
            infrastructure that rewards genuine cultural contribution rather than algorithmic metrics.
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">The Problem</h2>
          <ul className="list-disc pl-5 text-gray-300 space-y-2 mb-4">
            <li>90% of music industry revenues are distributed to only 2% of artists</li>
            <li>Algorithmic platforms create a discovery barrier for niche/underground artists</li>
            <li>Homogenization of music due to algorithm-based recommendations (-30% sonic diversity)</li>
            <li>60-70% of streaming consumption driven by algorithmic recommendations</li>
            <li>AI-generated music threatens authentic human creation</li>
          </ul>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Core Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Sonic Map</h3>
              <p className="text-gray-300">Visual interface representing music by sonic characteristics (texture, energy, experimentation) rather than popularity metrics.</p>
            </div>
            <div>
              <h3 className="text-violet-400 font-medium mb-1">P2P Sharing System</h3>
              <p className="text-gray-300">Decentralized exchange for rare/exclusive tracks with provenance verification and fair-value pricing determined by community.</p>
            </div>
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Live Crates/Sonic Vaults</h3>
              <p className="text-gray-300">Time-limited thematic challenges with community voting system and rewards for curation and discovery contributions.</p>
            </div>
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Proof of Creation</h3>
              <p className="text-gray-300">Blockchain-based timestamp proofs that protect your work with verifiable evidence of creation time and ownership.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How to Use REBEL</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Registration</h3>
              <p className="text-gray-300">Sign up using Magic Link for passwordless authentication, or use traditional email/password. Artists need to register as artists to upload tracks.</p>
            </div>
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Uploading Tracks</h3>
              <p className="text-gray-300">Once registered as an artist, you can upload tracks with metadata including title, genre, description, and tags.</p>
            </div>
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Creating Proofs</h3>
              <p className="text-gray-300">After uploading a track, you can create a blockchain timestamp proof. The first proof for each track is free, subsequent proofs cost Rebellion Points (RP).</p>
            </div>
            <div>
              <h3 className="text-violet-400 font-medium mb-1">Account Abstraction</h3>
              <p className="text-gray-300">Our Web3 infrastructure is invisible to you - we handle all the blockchain interactions while providing the benefits of decentralization.</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }
  export default App;