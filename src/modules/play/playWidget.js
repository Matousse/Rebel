/**
 * Play Widget
 * Module client pour l'intégration du widget SoundCloud
 * À inclure dans vos pages frontend
 * 
 * Version avec logs de débogage
 */

class SoundCloudPlayer {
  constructor(options = {}) {
    console.log('🎵 SoundCloudPlayer: Initialisation avec options:', options);
    this.options = {
      container: options.container || '#soundcloud-player',
      color: options.color || '#ff5500',
      autoPlay: options.autoPlay || false,
      hideRelated: options.hideRelated || false,
      showComments: options.showComments || false,
      showUser: options.showUser || true,
      showReposts: options.showReposts || false,
      showTeaser: options.showTeaser || false,
      visual: options.visual || true,
      apiBaseUrl: options.apiBaseUrl || '/api/play'
    };
    
    this.currentTrack = null;
    this.widget = null;
    this.initialized = false;
    
    // Charger l'API SoundCloud
    this.loadSoundCloudAPI();
  }
  
  /**
   * Charge l'API SoundCloud
   */
  loadSoundCloudAPI() {
    console.log('🎵 SoundCloudPlayer: Chargement de l\'API SoundCloud');
    if (window.SC) {
      console.log('🎵 SoundCloudPlayer: API SoundCloud déjà chargée');
      return Promise.resolve(window.SC);
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = () => {
        console.log('🎵 SoundCloudPlayer: API SoundCloud chargée avec succès');
        resolve(window.SC);
      };
      script.onerror = (error) => {
        console.error('🎵 SoundCloudPlayer: Erreur lors du chargement de l\'API SoundCloud', error);
        reject(error);
      };
      document.body.appendChild(script);
    });
  }
  
  /**
   * Initialise le widget SoundCloud
   */
  async init() {
    console.log('🎵 SoundCloudPlayer: Initialisation du widget');
    if (this.initialized) {
      console.log('🎵 SoundCloudPlayer: Widget déjà initialisé');
      return;
    }
    
    try {
      await this.loadSoundCloudAPI();
      
      // Créer l'iframe pour le widget
      console.log(`🎵 SoundCloudPlayer: Recherche du conteneur ${this.options.container}`);
      const container = document.querySelector(this.options.container);
      if (!container) {
        console.error(`🎵 SoundCloudPlayer: Conteneur ${this.options.container} non trouvé`);
        throw new Error(`Container ${this.options.container} not found`);
      }
      
      // Créer l'iframe
      console.log('🎵 SoundCloudPlayer: Création de l\'iframe pour le widget');
      const iframe = document.createElement('iframe');
      iframe.id = 'soundcloud-widget';
      iframe.width = '100%';
      iframe.height = '166';
      iframe.scrolling = 'no';
      iframe.frameBorder = 'no';
      container.appendChild(iframe);
      
      // Charger un morceau aléatoire pour commencer
      console.log('🎵 SoundCloudPlayer: Chargement d\'un morceau aléatoire initial');
      await this.loadRandomTrack();
      
      this.initialized = true;
      console.log('🎵 SoundCloudPlayer: Widget initialisé avec succès');
    } catch (error) {
      console.error('Failed to initialize SoundCloud widget:', error);
    }
  }
  
  /**
   * Charge un morceau aléatoire depuis l'API
   */
  async loadRandomTrack() {
    console.log('🎵 SoundCloudPlayer: Chargement d\'un morceau aléatoire');
    try {
      console.log(`🎵 SoundCloudPlayer: Requête API vers ${this.options.apiBaseUrl}/random`);
      const response = await fetch(`${this.options.apiBaseUrl}/random`);
      const data = await response.json();
      console.log('🎵 SoundCloudPlayer: Réponse API reçue:', data);
      
      if (data.success && data.data.trackUrl) {
        console.log(`🎵 SoundCloudPlayer: Morceau aléatoire trouvé: ${data.data.trackUrl}`);
        this.loadTrack(data.data.trackUrl);
      } else {
        console.error('Failed to load random track:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching random track:', error);
    }
  }
  
  /**
   * Charge un morceau spécifique dans le widget
   * @param {string} trackUrl - URL SoundCloud du morceau
   */
  loadTrack(trackUrl) {
    console.log(`🎵 SoundCloudPlayer: Chargement du morceau: ${trackUrl}`);
    this.currentTrack = trackUrl;
    
    // Si le widget existe déjà, le mettre à jour
    if (this.widget) {
      console.log('🎵 SoundCloudPlayer: Mise à jour du widget existant');
      this.widget.load(trackUrl, this.getWidgetOptions());
      return;
    }
    console.log('🎵 SoundCloudPlayer: Création d\'un nouveau widget');
    
    // Sinon, créer un nouveau widget
    const iframe = document.getElementById('soundcloud-widget');
    if (!iframe) {
      console.error('🎵 SoundCloudPlayer: Iframe non trouvée (id: soundcloud-widget)');
      return;
    }
    
    // Initialiser le widget avec le morceau
    console.log('🎵 SoundCloudPlayer: Initialisation du widget SC.Widget');
    this.widget = SC.Widget(iframe);
    
    // Configurer le widget
    const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&${this.getWidgetQueryParams()}`;
    console.log(`🎵 SoundCloudPlayer: Configuration de l'iframe avec URL: ${widgetUrl}`);
    iframe.src = widgetUrl;
    
    // Ajouter les écouteurs d'événements
    this.setupEventListeners();
  }
  
  /**
   * Configure les écouteurs d'événements pour le widget
   */
  setupEventListeners() {
    console.log('🎵 SoundCloudPlayer: Configuration des écouteurs d\'événements');
    if (!this.widget) {
      console.error('🎵 SoundCloudPlayer: Impossible de configurer les événements, widget non initialisé');
      return;
    }
    
    this.widget.bind(SC.Widget.Events.FINISH, () => {
      console.log('🎵 SoundCloudPlayer: Événement FINISH détecté');
      // Charger automatiquement un nouveau morceau aléatoire à la fin
      this.loadRandomTrack();
    });
    
    this.widget.bind(SC.Widget.Events.ERROR, (error) => {
      console.error('🎵 SoundCloudPlayer: Erreur du widget SoundCloud', error);
      this.loadRandomTrack(); // Essayer un autre morceau en cas d'erreur
    });
    
    // Ajouter des écouteurs supplémentaires pour le débogage
    this.widget.bind(SC.Widget.Events.READY, () => {
      console.log('🎵 SoundCloudPlayer: Événement READY - Widget prêt');
    });
    
    this.widget.bind(SC.Widget.Events.PLAY, () => {
      console.log('🎵 SoundCloudPlayer: Événement PLAY - Lecture démarrée');
    });
    
    this.widget.bind(SC.Widget.Events.PAUSE, () => {
      console.log('🎵 SoundCloudPlayer: Événement PAUSE - Lecture en pause');
    });
  }
  
  /**
   * Obtient les options du widget sous forme de paramètres de requête
   * @returns {string} - Paramètres de requête
   */
  getWidgetQueryParams() {
    const params = {
      color: encodeURIComponent(this.options.color),
      auto_play: this.options.autoPlay,
      hide_related: this.options.hideRelated,
      show_comments: this.options.showComments,
      show_user: this.options.showUser,
      show_reposts: this.options.showReposts,
      show_teaser: this.options.showTeaser,
      visual: this.options.visual
    };
    
    return Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
  
  /**
   * Obtient les options du widget pour l'API
   * @returns {Object} - Options du widget
   */
  getWidgetOptions() {
    return {
      auto_play: this.options.autoPlay,
      buying: false,
      liking: false,
      download: false,
      sharing: false,
      show_artwork: true,
      show_comments: this.options.showComments,
      show_playcount: false,
      show_user: this.options.showUser,
      hide_related: this.options.hideRelated
    };
  }
  
  /**
   * Joue le morceau actuel
   */
  play() {
    console.log('🎵 SoundCloudPlayer: Demande de lecture');
    if (this.widget) this.widget.play();
    else console.error('🎵 SoundCloudPlayer: Impossible de lire, widget non initialisé');
  }
  
  /**
   * Met en pause le morceau actuel
   */
  pause() {
    console.log('🎵 SoundCloudPlayer: Demande de pause');
    if (this.widget) this.widget.pause();
    else console.error('🎵 SoundCloudPlayer: Impossible de mettre en pause, widget non initialisé');
  }
  
  /**
   * Charge et joue un nouveau morceau aléatoire
   */
  playRandom() {
    console.log('🎵 SoundCloudPlayer: Demande de lecture d\'un morceau aléatoire');
    this.loadRandomTrack();
  }
}

// Exporter la classe pour une utilisation dans les applications
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundCloudPlayer;
} else {
  window.SoundCloudPlayer = SoundCloudPlayer;
}
