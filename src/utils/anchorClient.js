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
          // Convert string hash to bytes if needed
          const hashBytes = typeof trackHash === 'string' 
            ? Buffer.from(trackHash, 'hex') 
            : trackHash;
          
          const result = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              new PublicKey(artistPublicKey).toBuffer(),
              Buffer.from(hashBytes).slice(0, 32)
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
          console.log('Attempting to mint proof of creation for artist:', artistPublicKey);
          console.log('Track hash:', typeof trackHash === 'string' ? trackHash : 'buffer');
          
          // Convert string hash to bytes if needed
          const hashBytes = typeof trackHash === 'string' 
            ? Buffer.from(trackHash, 'hex') 
            : trackHash;
          
          // Ensure hash is correct size (32 bytes)
          let hashData;
          if (hashBytes.length !== 32) {
            const originalLength = hashBytes.length;
            console.log('Hash length is not 32 bytes, adjusting...');
            // If too short, pad with zeros; if too long, truncate
            hashData = Buffer.alloc(32);
            hashBytes.copy(hashData, 0, 0, Math.min(32, hashBytes.length));
            console.log(`Hash length adjusted from ${originalLength} to 32 bytes`);
          } else {
            hashData = hashBytes;
          }
          
          // Derive the PDA for the proof
          console.log('Finding PDA address for the proof...');
          const [proofPDA, bump] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              adminKeypair.publicKey.toBuffer(), // Utiliser admin comme artiste
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
          // Convert string hash to bytes if needed
          const hashBytes = typeof trackHash === 'string' 
            ? Buffer.from(trackHash, 'hex') 
            : trackHash;
          
          // Ensure hash is correct size (32 bytes)
          let hashData;
          if (hashBytes.length !== 32) {
            hashData = Buffer.alloc(32);
            hashBytes.copy(hashData, 0, 0, Math.min(32, hashBytes.length));
          } else {
            hashData = hashBytes;
          }
          
          // Derive the PDA for the proof
          const [proofPDA, _] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              adminKeypair.publicKey.toBuffer(), // Admin comme artiste
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
            if (accountInfo.data.length >= 8 + 32 + 32 + 8) {
              // Décodage des données (format: discriminator + pubkey + hash + timestamp)
              const artistPubkey = new PublicKey(accountInfo.data.slice(8, 8 + 32));
              const storedHash = accountInfo.data.slice(8 + 32, 8 + 32 + 32);
              const timestamp = accountInfo.data.readBigInt64LE(8 + 32 + 32);
              
              console.log('Décodage réussi:');
              console.log('- Artiste:', artistPubkey.toString());
              console.log('- Hash stocké:', Buffer.from(storedHash).toString('hex'));
              console.log('- Timestamp:', new Date(Number(timestamp) * 1000).toISOString());
              
              return {
                artist: artistPubkey.toString(),
                trackHash: Buffer.from(storedHash),
                timestamp: Number(timestamp),
                pdaAddress: proofPDA.toString()
              };
            } else {
              console.log('Format de données inattendu, retour des données de base');
              return {
                artist: adminKeypair.publicKey.toString(),
                trackHash: hashBytes,
                timestamp: Date.now() / 1000,
                pdaAddress: proofPDA.toString()
              };
            }
          } catch (decodeError) {
            console.error('Erreur de décodage, retour des données de base:', decodeError);
            return {
              artist: adminKeypair.publicKey.toString(),
              trackHash: hashBytes,
              timestamp: Date.now() / 1000,
              pdaAddress: proofPDA.toString()
            };
          }
        } catch (error) {
          console.error('Error getting proof:', error);
          return null;
        }
      },
      
      /**
       * Verifies a proof against a file
       * @param {string} artistPublicKey Artist's public key as string
       * @param {Buffer} fileContent File content to verify
       * @returns {Object} Verification result
       */
      verifyFileProof: async (artistPublicKey, fileContent) => {
        try {
          console.log('Verifying file proof for artist:', artistPublicKey);
          // Calculate the hash of the file
          const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
          console.log('Calculated file hash:', fileHash);
          
          // Convert the hex string to proper bytes
          const hashBytes = Buffer.from(fileHash, 'hex');
          
          // Derive the PDA for the proof - using admin public key instead of artist
          const [proofPDA, _] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('proof-of-creation'),
              adminKeypair.publicKey.toBuffer(), // Admin comme artiste
              hashBytes.slice(0, 32)
            ],
            PROGRAM_ID
          );
          
          console.log('Looking for proof at address:', proofPDA.toString());
          
          // Check if the account exists in the blockchain
          const accountInfo = await connection.getAccountInfo(proofPDA);
          if (!accountInfo) {
            console.log('No proof found on blockchain');
            return {
              verified: false,
              message: 'No proof found for this file and artist'
            };
          }
          
          console.log('Proof verified successfully!');
          
          // Decode the timestamp if possible
          let timestamp;
          try {
            if (accountInfo.data.length >= 8 + 32 + 32 + 8) {
              timestamp = accountInfo.data.readBigInt64LE(8 + 32 + 32);
              console.log('Timestamp from blockchain:', new Date(Number(timestamp) * 1000).toISOString());
            }
          } catch (e) {
            console.error('Error reading timestamp:', e);
            timestamp = BigInt(Math.floor(Date.now() / 1000));
          }
          
          return {
            verified: true,
            timestamp: new Date(Number(timestamp) * 1000),
            pdaAddress: proofPDA.toString()
          };
        } catch (error) {
          console.error('Error verifying file:', error);
          return {
            verified: false,
            error: error.message
          };
        }
      }
    };
  } catch (error) {
    console.error('Error in Solana client initialization:', error);
    throw error;
  }
}

module.exports = { createAnchorClient };