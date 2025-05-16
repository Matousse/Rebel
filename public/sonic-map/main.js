// Babylon.js Dream Space - Navigation et interaction
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Color3, MeshBuilder, StandardMaterial, GlowLayer, HighlightLayer, Texture, Animation, ParticleSystem, PointerEventTypes, Scalar, UniversalCamera } from '@babylonjs/core';
import '@babylonjs/loaders';

const canvas = document.getElementById('renderCanvas');
const engine = new Engine(canvas, true);
let scene;
import spotifyPlayer from './spotifyPlayer.js';
let currentPlayingSphere = null;

async function createScene() {
  scene = new Scene(engine);
  scene.clearColor = new Color3(0.06, 0.07, 0.18);
  new GlowLayer('glow', scene, { blurKernelSize: 64 });
  new HighlightLayer('hl', scene);

  // Lumière douce et ambiance
  const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
  light.intensity = 0.8;

  // Caméra FPS (vaisseau)
  const camera = new UniversalCamera('shipCam', new Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
  camera.speed = 3.5;
  camera.angularSensibility = 4000;
  camera.inertia = 0.1;
  camera.applyGravity = false;
  camera.ellipsoid = new Vector3(2, 2, 2);
  camera.minZ = 0.1;
  camera.maxZ = 10000;

  // Fond étoilé doux
  scene.createDefaultSkybox(new Texture("https://assets.babylonjs.com/environments/backgroundGround.png", scene), true, 10000, 0.2);

  // Données musicales
    const response = await fetch('/sonicMapData.json');
  const data = await response.json();
  console.log('Chargement JSON terminé, nombre de chansons:', data.length);

  // Sphères musicales
  const spheres = [];
  let closestSphere = null;
  let minDist = Infinity;
  data.forEach(song => {
    const sphere = MeshBuilder.CreateSphere(song.id, { diameter: song.size }, scene);
    sphere.position = new Vector3(song.position.x, song.position.y, song.position.z);
    const mat = new StandardMaterial(`${song.id}_mat`, scene);
    mat.diffuseColor = new Color3(song.color.r, song.color.g, song.color.b);
    mat.emissiveColor = mat.diffuseColor.scale(song.emissiveIntensity + (song.liked ? 1.5 : 0));
    mat.alpha = 0.92;
    sphere.material = mat;
    sphere.metadata = song;
    if (song.liked) addAuroraEffect(sphere, scene);
    spheres.push(sphere);
    // Cherche la sphère la plus proche du centre
    const dist = Math.sqrt(song.position.x**2 + song.position.y**2 + song.position.z**2);
    if (dist < minDist) {
      minDist = dist;
      closestSphere = sphere;
    }
  });
  console.log('Nombre de sphères créées:', spheres.length);

  // Place la caméra au centre et vise la sphère la plus proche
  if (closestSphere) {
    camera.position = new Vector3(0, 0, 0);
    camera.setTarget(closestSphere.position);
    console.log('Caméra placée au centre et orientée vers la sphère la plus proche:', closestSphere.position);
  } else {
    camera.position = new Vector3(0, 0, 0);
    console.log('Aucune sphère trouvée, caméra au centre.');
  }

  // Affiche l'étiquette d'aide Spotify au démarrage
  setTimeout(() => {
    const help = document.getElementById('spotifyHelpLabel');
    if (help) help.style.display = 'block';
  }, 400);

  let hasPlayedSpotify = false;

  // Notification bulle moderne
  window.showNotification = function(msg) {
    const notif = document.getElementById('spotifyBubbleNotif');
    if (!notif) return;
    notif.textContent = msg;
    notif.classList.add('active');
    setTimeout(() => {
      notif.classList.remove('active');
    }, 2600);
  };

  // Message d'aide pour activer les contrôles
  setTimeout(() => {
    const help = document.getElementById('spotifyHelpLabel');
    if (help) help.style.display = 'block';
  }, 500);
  
  // Fonction pour ajouter l'effet d'aurore aux sphères
  function addAuroraEffect(mesh, scene) {
    // Particules "aurore boréale" oniriques
    const ps = new ParticleSystem("aurora", 400, scene);
    ps.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    ps.emitter = mesh;
    ps.minEmitBox = new Vector3(-0.3, 0, -0.3);
    ps.maxEmitBox = new Vector3(0.3, 0.6, 0.3);
    ps.color1 = new Color3(0.6, 1, 1);
    ps.color2 = new Color3(0.2, 0.8, 1);
    ps.colorDead = new Color3(0.05, 0.15, 0.3);
    ps.minSize = mesh.scaling.x * 0.7;
    ps.maxSize = mesh.scaling.x * 1.6;
    ps.minLifeTime = 1.2;
    ps.maxLifeTime = 2.5;
    ps.emitRate = 30;
    ps.blendMode = ParticleSystem.BLENDMODE_ONEONE;
    ps.gravity = new Vector3(0, 0.2, 0);
    ps.direction1 = new Vector3(-0.5, 1, -0.5);
    ps.direction2 = new Vector3(0.5, 1, 0.5);
    ps.minAngularSpeed = 0;
    ps.maxAngularSpeed = Math.PI;
    ps.minEmitPower = 0.2;
    ps.maxEmitPower = 0.7;
    ps.updateSpeed = 0.02;
    ps.start();
    mesh.aurora = ps;
  }
    ps.start();
    mesh.aurora = ps;
  }

  // Détection de proximité et affichage panneau info
  const infoPanel = document.getElementById('infoPanel');
  let lastHovered = null;
  scene.registerBeforeRender(() => {
    let found = false;
    for (const sphere of spheres) {
      const dist = Vector3.Distance(camera.position, sphere.position);
      if (dist < 8) {
        if (lastHovered !== sphere) {
          showInfo(sphere.metadata);
          lastHovered = sphere;
        }
        found = true;
        break;
      }
    }
    if (!found && lastHovered) {
      hideInfo();
      lastHovered = null;
    }
  });

  function showInfo(song) {
  if (currentPlayingSphere && currentPlayingSphere.metadata === song) {
    infoPanel.innerHTML += `<br><span style='color:#1db954;font-weight:bold'>▶️ Lecture en cours</span>`;
  }
    infoPanel.innerHTML = `<b>${song.title}</b> <span style="color:#6ef">${song.artist}</span><br>
      <i>${song.genre}${song.subgenreOf ? ' ('+song.subgenreOf+')' : ''}</i> &bull; ${song.year}<br>
      <small>BPM: ${song.audio.tempo.toFixed(1)}<br>
      Énergie: ${(song.audio.energy*100).toFixed(0)}<br>
      Dance: ${(song.audio.danceability*100).toFixed(0)}<br>
      <span style="color:${song.liked ? '#ff7' : '#ccc'}">${song.liked ? '❤️ Aimée' : 'Non aimée'}</span></small>`;
    infoPanel.style.display = 'block';
    infoPanel.style.opacity = '1';
  }
  function hideInfo() {
    infoPanel.style.opacity = '0';
    setTimeout(() => { infoPanel.style.display = 'none'; }, 300);
  }

  // Système de viseur et tir (clic ou espace)
  window.addEventListener('pointerdown', tryLike);
  window.addEventListener('keydown', async e => {
    if (e.code === 'Space') {
      e.preventDefault(); // Empêche le scroll de la fenêtre
      tryLike();
    }
    if (e.key === 'p' || e.key === 'P') {
      // Raycast du viseur
      const pick = scene.pick(canvas.width/2, canvas.height/2);
      if (pick && pick.pickedMesh && spheres.includes(pick.pickedMesh)) {
        const song = pick.pickedMesh.metadata;
        const ok = await spotifyPlayer.playTrack(song.id);
        if (ok) {
          hasPlayedSpotify = true;
          // Masque l'étiquette d'aide
          const help = document.getElementById('spotifyHelpLabel');
          if (help) help.style.display = 'none';
          showNotification(`<b>${song.title}</b> a été jouée ! 🎶`);
          if (currentPlayingSphere && currentPlayingSphere !== pick.pickedMesh) {
            currentPlayingSphere.renderOverlay = false;
          }
          currentPlayingSphere = pick.pickedMesh;
          currentPlayingSphere.renderOverlay = true;
        } else {
          showNotification('Erreur de lecture Spotify.<br>Vérifie ton compte premium.');
        }
      } else {
        showNotification('Vise une sphère pour lancer la lecture Spotify.');
      }
    }
  });

  function tryLike() {
    // Raycast du viseur
    const pick = scene.pick(canvas.width/2, canvas.height/2);
    if (pick && pick.pickedMesh && spheres.includes(pick.pickedMesh)) {
      toggleLike(pick.pickedMesh);
    }
  }

  function toggleLike(sphere) {
    const song = sphere.metadata;
    song.liked = !song.liked;
    // Effet lumineux
    const mat = sphere.material;
    mat.emissiveColor = mat.diffuseColor.scale(song.emissiveIntensity + (song.liked ? 1.5 : 0));
    // Aurora
    if (song.liked && !sphere.aurora) addAuroraEffect(sphere, scene);
    if (!song.liked && sphere.aurora) { sphere.aurora.stop(); sphere.aurora.dispose(); sphere.aurora = null; }
    // UI
    if (lastHovered === sphere) showInfo(song);
  }


createScene();
engine.runRenderLoop(() => {
  if (scene) {
    scene.render();
    // Affiche un overlay sur la sphère en cours de lecture
    if (currentPlayingSphere) {
      const overlayMat = currentPlayingSphere.material;
      overlayMat.emissiveColor = overlayMat.diffuseColor.scale(currentPlayingSphere.metadata.emissiveIntensity + 2.5);
    }
  }
});
window.addEventListener('resize', () => engine.resize());
