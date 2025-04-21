const bip39 = require('bip39');
const { Keypair } = require('@solana/web3.js');
const nacl = require('tweetnacl');

// Votre phrase mnémonique
const mnemonic = "film salad protect fruit innocent pilot curious run dash security couple response";
// Cible: la clé publique que vous recherchez
const targetPublicKey = "4KXVqKni4NCgbEyhirXimAsKXpkTDEDxrP4GswWzBbJm";

async function findKeypair() {
  try {
    console.log("Génération de la seed depuis la phrase mnémonique...");
    // Essayer sans passphrase
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Prendre différentes parties de la seed pour générer des keypairs
    for (let i = 0; i < seed.length - 32; i++) {
      const slice = seed.slice(i, i + 32);
      const keypair = Keypair.fromSeed(slice);
      const pubkey = keypair.publicKey.toString();
      
      console.log(`Essai ${i}: ${pubkey}`);
      
      if (pubkey === targetPublicKey) {
        console.log("\n✅ CORRESPONDANCE TROUVÉE!");
        console.log(`Index de départ dans la seed: ${i}`);
        console.log(`Clé publique: ${pubkey}`);
        
        // Afficher la clé privée de différentes façons
        console.log(`Clé privée (hex): ${Buffer.from(keypair.secretKey).toString('hex')}`);
        console.log(`Clé privée (base64): ${Buffer.from(keypair.secretKey).toString('base64')}`);
        
        try {
          // Si bs58 est disponible
          const bs58 = require('bs58');
          console.log(`Clé privée (base58): ${bs58.encode(keypair.secretKey)}`);
        } catch (e) {
          console.log("bs58 non disponible pour l'encodage base58");
        }
        
        return;
      }
    }
    
    console.log("\nEssai avec une dérivation simple...");
    // Essayer quelques dérivations simples
    const keyPaths = [
      seed.slice(0, 32),            // Premiers 32 bytes
      seed.slice(32, 64),           // 32 bytes suivants
      seed.slice(64, 96),           // 32 bytes suivants
      seed                          // Tous les bytes (bien que cela soit trop long pour une clé)
    ];
    
    for (let i = 0; i < keyPaths.length; i++) {
      try {
        const slice = keyPaths[i].slice(0, 32); // Prendre seulement les 32 premiers bytes
        const keypair = Keypair.fromSeed(slice);
        const pubkey = keypair.publicKey.toString();
        
        console.log(`Méthode alternative ${i}: ${pubkey}`);
        
        if (pubkey === targetPublicKey) {
          console.log("\n✅ CORRESPONDANCE TROUVÉE!");
          console.log(`Méthode: ${i}`);
          console.log(`Clé publique: ${pubkey}`);
          
          // Afficher la clé privée de différentes façons
          console.log(`Clé privée (hex): ${Buffer.from(keypair.secretKey).toString('hex')}`);
          console.log(`Clé privée (base64): ${Buffer.from(keypair.secretKey).toString('base64')}`);
          return;
        }
      } catch (e) {
        console.log(`Erreur avec méthode ${i}: ${e.message}`);
      }
    }
    
    console.log("\n❌ Aucune correspondance trouvée avec la clé publique attendue.");
    console.log("Il est possible que:");
    console.log("1. La phrase mnémonique soit incorrecte");
    console.log("2. Une passphrase supplémentaire soit nécessaire");
    console.log("3. Un chemin de dérivation spécifique ait été utilisé");
    
  } catch (error) {
    console.error("Erreur lors de la recherche de la clé:", error);
  }
}

findKeypair();