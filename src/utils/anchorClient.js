// src/utils/anchorClient.js
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction } = require('@solana/web3.js');
const bs58 = require('bs58');
const crypto = require('crypto');

// Program ID from your deployed program
const PROGRAM_ID = new PublicKey('8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt');

/**
 * Create a client for interacting with the timestamp_proof program
 * using direct Solana Web3.js calls instead of Anchor
 * 
 * @param {string} adminPrivateKey Base58-encoded private key for the admin/payer
 * @param {string} solanaEndpoint Solana RPC endpoint to use
 * @returns {Object} Client object with methods to interact with the program
 */
function createAnchorClient(adminPrivateKey, solanaEndpoint = 'https://api.devnet.solana.com') {
  try {
    // Imprimer des informations de débogage
    console.log('Initializing Solana client with endpoint:', solanaEndpoint);
    
    // Importation de bs58 avec contrôle de version
    let bs58local;
    try {
      bs58local = require('bs58');
      console.log('bs58 loaded successfully, version:', bs58local.version || 'unknown');
      
      // Vérifier si bs58.decode existe
      if (typeof bs58local.decode !== 'function') {
        console.error('bs58.decode is not a function!');
        throw new Error('bs58.decode is not available');
      }
    } catch (bs58Error) {
      console.error('Failed to load bs58:', bs58Error);
      throw bs58Error;
    }
    
    // Décoder la clé privée
    console.log('Decoding private key...');
    const secretKey = bs58local.decode(adminPrivateKey);
    console.log('Private key decoded, length:', secretKey.length);
    
    // Créer le keypair
    const adminKeypair = Keypair.fromSecretKey(secretKey);
    console.log('Admin keypair created, public key:', adminKeypair.publicKey.toString());
    
    // Configurer la connexion
    console.log('Setting up Solana connection...');
    const connection = new Connection(solanaEndpoint, 'confirmed');
    console.log('Solana connection established');
    
    return {
      /**
       * Get admin public key
       * @returns {PublicKey} Admin public key
       */
      getAdminPublicKey: () => {
        return adminKeypair.publicKey;
      },
      
      /**
       * Derives the PDA address for a proof of creation
       * @param {string} artistPublicKey Artist's public key as string
       * @param {Uint8Array|string} trackHash Track hash as Uint8Array or hex string
       * @returns {Object} The PDA address and bump seed
       */
      deriveProofPDA: async (artistPublicKey, trackHash) => {
        try {
          console.log('Deriving PDA for proof with artist:', artistPublicKey);
          
          // Normaliser le hash en buffer de 32 octets
          let hashBytes;
          if (typeof trackHash === 'string') {
            // Si c'est une chaîne hexadécimale, la convertir en Buffer
            hashBytes = Buffer.from(trackHash, 'hex');
          } else if (Buffer.isBuffer(trackHash)) {
            hashBytes = trackHash;
          } else {
            hashBytes = Buffer.from(trackHash);
          }
          
          // S'assurer que le hash fait exactement 32 octets
          const hashData = Buffer.alloc(32);
          hashBytes.copy(hashData, 0, 0, Math.min(32, hashBytes.length));
          
          // Dériver l'adresse PDA
          const result = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              new PublicKey(artistPublicKey).toBuffer(),
              hashData
            ],
            PROGRAM_ID
          );
          
          console.log('PDA derived successfully:', result[0].toString());
          return result;
        } catch (error) {
          console.error('Error deriving PDA:', error);
          throw error;
        }
      },
      
      /**
       * Creates a new proof of creation
       * @param {string} artistPublicKey Artist's public key as string
       * @param {Uint8Array|string} trackHash Track hash as Uint8Array or hex string
       * @returns {Object} Result of the operation
       */
      mintProofOfCreation: async (artistPublicKey, trackHash) => {
        try {
          console.log('Creating proof of creation for artist:', artistPublicKey);
          
          // Normaliser le hash en buffer de 32 octets
          let hashBytes;
          if (typeof trackHash === 'string') {
            // Si c'est une chaîne hexadécimale, la convertir en Buffer
            hashBytes = Buffer.from(trackHash, 'hex');
          } else if (Buffer.isBuffer(trackHash)) {
            hashBytes = trackHash;
          } else {
            hashBytes = Buffer.from(trackHash);
          }
          
          // S'assurer que le hash fait exactement 32 octets
          const hashData = Buffer.alloc(32);
          hashBytes.copy(hashData, 0, 0, Math.min(32, hashBytes.length));
          
          // Dériver l'adresse PDA pour la preuve
          console.log('Finding PDA address for the proof...');
          const [proofPDA, bump] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              adminKeypair.publicKey.toBuffer(), // Toujours utiliser l'admin comme artiste
              hashData
            ],
            PROGRAM_ID
          );
          console.log('PDA address:', proofPDA.toString(), 'with bump:', bump);
          
          // Utiliser le discriminateur correct basé sur le test fonctionnel
          const discriminator = Buffer.from([22, 116, 122, 23, 21, 97, 114, 253]);
          
          // Construire les données d'instruction avec le discriminateur
          const data = Buffer.concat([
            discriminator,
            hashData
          ]);
          
          console.log('Created instruction data, length:', data.length);
          
          // Create the transaction instruction using the same account structure as in the working test
          const instruction = new TransactionInstruction({
            keys: [
              { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // artiste = admin
              { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // payeur = admin
              { pubkey: proofPDA, isSigner: false, isWritable: true }, // preuve
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // systemProgram
            ],
            programId: PROGRAM_ID,
            data: data
          });
          
          // Create and sign the transaction
          const transaction = new Transaction().add(instruction);
          transaction.feePayer = adminKeypair.publicKey;
          
          const recentBlockhash = await connection.getRecentBlockhash();
          transaction.recentBlockhash = recentBlockhash.blockhash;
          
          // Sign and send the transaction
          transaction.sign(adminKeypair);
          console.log('Transaction signed, sending to network...');
          
          const signature = await connection.sendRawTransaction(transaction.serialize());
          console.log('Transaction sent, signature:', signature);
          
          // Wait for confirmation
          const confirmation = await connection.confirmTransaction(signature);
          console.log('Transaction confirmed:', confirmation);
          
          return {
            success: true,
            transactionId: signature,
            pdaAddress: proofPDA.toString(),
            status: 'CONFIRMED'
          };
        } catch (error) {
          console.error('Error creating proof:', error);
          return {
            success: false,
            error: error.message
          };
        }
      },
      
      /**
       * Gets information about an existing proof
       * @param {string} artistPublicKey Artist's public key as string
       * @param {Uint8Array|string} trackHash Track hash as Uint8Array or hex string
       * @returns {Object|null} Proof data or null if not found
       */
      getProofOfCreation: async (artistPublicKey, trackHash) => {
        try {
          console.log('Getting proof of creation for artist:', artistPublicKey);
          
          // Normaliser le hash en buffer de 32 octets
          let hashBytes;
          if (typeof trackHash === 'string') {
            // Si c'est une chaîne hexadécimale, la convertir en Buffer
            hashBytes = Buffer.from(trackHash, 'hex');
          } else if (Buffer.isBuffer(trackHash)) {
            hashBytes = trackHash;
          } else {
            hashBytes = Buffer.from(trackHash);
          }
          
          // S'assurer que le hash fait exactement 32 octets
          const hashData = Buffer.alloc(32);
          hashBytes.copy(hashData, 0, 0, Math.min(32, hashBytes.length));
          
          // Dériver l'adresse PDA pour la preuve - utiliser la même clé publique qu'à la création
          const [proofPDA, _] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              adminKeypair.publicKey.toBuffer(), // Toujours utiliser l'admin comme artiste
              hashData
            ],
            PROGRAM_ID
          );
          
          console.log('Looking for proof at address:', proofPDA.toString());
          
          // Check if the account exists
          const accountInfo = await connection.getAccountInfo(proofPDA);
          if (!accountInfo) {
            console.log('Proof account not found');
            return null;
          }
          
          console.log('Proof account found with data length:', accountInfo.data.length);
          
          // Essayer de décoder les données comme dans le test fonctionnel
          try {
            if (accountInfo.data.length >= 8 + 32) {
              // Les 8 premiers octets sont le discriminateur, les 32 suivants sont le hash
              const storedHash = accountInfo.data.slice(8, 8 + 32);
              const storedTimestamp = accountInfo.data.length >= 8 + 32 + 8 ? 
                accountInfo.data.readBigUInt64LE(8 + 32) : BigInt(0);
              
              return {
                exists: true,
                pdaAddress: proofPDA.toString(),
                hash: Buffer.from(storedHash).toString('hex'),
                timestamp: Number(storedTimestamp)
              };
            }
            return {
              exists: true,
              pdaAddress: proofPDA.toString(),
              rawData: accountInfo.data
            };
          } catch (decodeError) {
            console.error('Error decoding proof data:', decodeError);
            return {
              exists: true,
              pdaAddress: proofPDA.toString(),
              error: decodeError.message
            };
          }
        } catch (error) {
          console.error('Error getting proof:', error);
          return null;
        }
      },
      
      /**
       * Verifies a file proof against the blockchain
       * @param {string} artistPublicKey Artist's public key as string
       * @param {Buffer} fileBuffer File buffer to verify
       * @returns {Object} Verification result
       */
      verifyFileProof: async (artistPublicKey, fileBuffer) => {
        try {
          console.log('Verifying file proof for artist:', artistPublicKey);
          
          // Calculer le hash du fichier
          const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
          console.log('Calculated file hash:', fileHash);
          
          // Vérifier si une preuve existe pour ce hash
          const proof = await module.exports.createAnchorClient(
            adminPrivateKey, 
            solanaEndpoint
          ).getProofOfCreation(artistPublicKey, fileHash);
          
          if (!proof) {
            console.log('No proof found for this file hash');
            return { verified: false, reason: 'No proof found' };
          }
          
          console.log('Proof found:', proof);
          
          return {
            verified: true,
            proof: proof
          };
        } catch (error) {
          console.error('Error verifying file proof:', error);
          return {
            verified: false,
            error: error.message
          };
        }
      }
    };
  } catch (error) {
    console.error('Failed to initialize Anchor client:', error);
    throw error;
  }
}

module.exports = {
  createAnchorClient
};