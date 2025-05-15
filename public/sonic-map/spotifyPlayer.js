// Gestion Spotify Web Playback SDK et lecture
class SpotifyPlayerManager {
  constructor() {
    this.token = null;
    this.player = null;
    this.deviceId = null;
    this.currentTrack = null;
    this.isReady = false;
    this.onReadyCallbacks = [];
  }

  async init() {
    try {
      this.token = localStorage.getItem('spotify_token') || window.SPOTIFY_TOKEN;
      if (!this.token) {
        alert('Aucun token Spotify trouvé. Connecte-toi !');
        return false;
      }
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.player = new Spotify.Player({
          name: 'Sonic Babylon Player',
          getOAuthToken: cb => { cb(this.token); },
          volume: 0.8
        });
        this.player.addListener('ready', ({ device_id }) => {
          this.deviceId = device_id;
          this.isReady = true;
          this.onReadyCallbacks.forEach(cb => cb());
          this.onReadyCallbacks = [];
        });
        this.player.addListener('not_ready', () => {
          this.isReady = false;
        });
        this.player.connect();
      };
      if (window.Spotify) window.onSpotifyWebPlaybackSDKReady();
    } catch (error) {
      console.error('[Spotify] Erreur init:', error);
      return false;
    }
    return true;
  }

  async playTrack(trackId) {
    if (!this.isReady || !this.deviceId) {
      alert('Spotify pas prêt !');
      return false;
    }
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [`spotify:track:${trackId}`] })
    });
    return response.ok;
  }
}

const spotifyPlayer = new SpotifyPlayerManager();
export default spotifyPlayer;
