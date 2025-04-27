// src/utils/anchorClient.js
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const bs58 = require('bs58');

// Program ID from your deployed program
const PROGRAM_ID = new PublicKey('8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt');

// IDL directly copy-pasted into this file
const IDL = {
  "address": "8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt",
  "metadata": {
    "name": "timestamp_proof",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Proof of Creation Timestamping program for Rebellion music platform"
  },
  "instructions": [
    {
      "name": "get_proof_of_creation",
      "docs": [
        "Vérifie l'existence d'une preuve de création"
      ],
      "accounts": [
        {
          "name": "artist",
          "docs": [
            "Artiste pour dériver la PDA"
          ]
        },
        {
          "name": "proof_of_creation",
          "docs": [
            "Compte de la preuve existante"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112, 114, 111, 111, 102, 45, 111, 102, 45, 99, 114, 101, 97, 116, 105, 111, 110
                ]
              },
              {
                "kind": "account",
                "path": "artist"
              },
              {
                "kind": "arg",
                "path": "track_hash"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "_track_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initialize",
      "accounts": [],
      "args": []
    },
    {
      "name": "mint_proof_of_creation",
      "docs": [
        "Mint une nouvelle preuve de création sous forme de micro-NFT"
      ],
      "accounts": [
        {
          "name": "artist",
          "docs": [
            "Artiste créateur de la preuve (doit signer)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payer",
          "docs": [
            "Payer des frais (peut être l'artiste lui-même)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "proof_of_creation",
          "docs": [
            "Compte PDA qui stocke la preuve de création"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112, 114, 111, 111, 102, 45, 111, 102, 45, 99, 114, 101, 97, 116, 105, 111, 110
                ]
              },
              {
                "kind": "account",
                "path": "artist"
              },
              {
                "kind": "arg",
                "path": "track_hash"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "docs": [
            "Programme système"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "track_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProofOfCreation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "artist",
            "type": "pubkey"
          },
          {
            "name": "track_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "DuplicateMint",
      "msg": "Une preuve pour ce track existe déjà."
    },
    {
      "code": 6001,
      "name": "InvalidTrackHash",
      "msg": "Hash du track invalide."
    },
    {
      "code": 6002,
      "name": "ProofOfCreationNotFound",
      "msg": "Preuve de création introuvable."
    }
  ]
};

/**
 * Create an Anchor client for interacting with the timestamp_proof program
 * @param {string} adminPrivateKey Base58-encoded private key for the admin/payer
 * @param {string} solanaEndpoint Solana RPC endpoint to use
 * @returns {Object} Client object with methods to interact with the program
 */
function createAnchorClient(adminPrivateKey, solanaEndpoint = 'https://api.devnet.solana.com') {
  // Decode the private key and create a keypair
  const secretKey = bs58.decode(adminPrivateKey);
  const adminKeypair = Keypair.fromSecretKey(secretKey);
  
  // Set up the connection and provider
  const connection = new Connection(solanaEndpoint, 'confirmed');
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
  });
  
  // Create the program interface
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);
  
  return {
    /**
     * Derives the PDA address for a proof of creation
     * @param {string} artistPublicKey Artist's public key as string
     * @param {Uint8Array|string} trackHash Track hash as Uint8Array or hex string
     * @returns {Object} The PDA address and bump seed
     */
    deriveProofPDA: async (artistPublicKey, trackHash) => {
      // Convert string hash to bytes if needed
      const hashBytes = typeof trackHash === 'string' 
        ? Buffer.from(trackHash, 'hex') 
        : trackHash;
      
      return PublicKey.findProgramAddressSync(
        [
          Buffer.from('proof-of-creation'),
          new PublicKey(artistPublicKey).toBuffer(),
          Buffer.from(hashBytes)
        ],
        PROGRAM_ID
      );
    },
    
    /**
     * Creates a new proof of creation
     * @param {string} artistPublicKey Artist's public key as string
     * @param {Uint8Array|string} trackHash Track hash as Uint8Array or hex string
     * @returns {Object} Result of the operation
     */
    mintProofOfCreation: async (artistPublicKey, trackHash) => {
      try {
        // Convert string hash to bytes if needed
        const hashBytes = typeof trackHash === 'string' 
          ? Buffer.from(trackHash, 'hex') 
          : trackHash;
        
        // Derive the PDA for the proof
        const [proofPDA, _] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from('proof-of-creation'),
            new PublicKey(artistPublicKey).toBuffer(),
            Buffer.from(hashBytes)
          ],
          PROGRAM_ID
        );
        
        // Create and send the transaction
        const tx = await program.methods
          .mintProofOfCreation(Array.from(hashBytes))
          .accounts({
            artist: new PublicKey(artistPublicKey),
            payer: adminKeypair.publicKey,
            proofOfCreation: proofPDA,
            systemProgram: anchor.web3.SystemProgram.programId
          })
          .signers([adminKeypair])
          .rpc();
        
        console.log(`Proof created: ${tx}`);
        
        return {
          success: true,
          transactionId: tx,
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
        // Convert string hash to bytes if needed
        const hashBytes = typeof trackHash === 'string' 
          ? Buffer.from(trackHash, 'hex') 
          : trackHash;
        
        // Derive the PDA for the proof
        const [proofPDA, _] = await PublicKey.findProgramAddressSync(
          [
            Buffer.from('proof-of-creation'),
            new PublicKey(artistPublicKey).toBuffer(),
            Buffer.from(hashBytes)
          ],
          PROGRAM_ID
        );
        
        // Check if the account exists
        const accountInfo = await connection.getAccountInfo(proofPDA);
        if (!accountInfo) {
          return null;
        }
        
        // Use the coder to decode the account data
        try {
          // Decode the account data
          const coder = new anchor.BorshAccountsCoder(IDL);
          const decoded = coder.decode('ProofOfCreation', accountInfo.data);
          
          return {
            artist: decoded.artist.toString(),
            trackHash: Buffer.from(decoded.track_hash),
            timestamp: Number(decoded.timestamp),
            pdaAddress: proofPDA.toString()
          };
        } catch (decodeError) {
          console.error('Error decoding account data:', decodeError);
          return null;
        }
      } catch (error) {
        console.error('Error getting proof:', error);
        return null;
      }
    },
    
    /**
     * Checks if a proof exists
     * @param {string} artistPublicKey Artist's public key as string
     * @param {Uint8Array|string} trackHash Track hash as Uint8Array or hex string
     * @returns {boolean} True if the proof exists
     */
    proofExists: async (artistPublicKey, trackHash) => {
      try {
        const proof = await module.exports.getProofOfCreation(artistPublicKey, trackHash);
        return proof !== null;
      } catch (error) {
        return false;
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
        // Calculate the hash of the file
        const crypto = require('crypto');
        const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
        
        // Check if a proof exists for this hash
        const proof = await module.exports.getProofOfCreation(artistPublicKey, fileHash);
        
        if (!proof) {
          return {
            verified: false,
            message: 'No proof found for this file and artist'
          };
        }
        
        return {
          verified: true,
          timestamp: new Date(Number(proof.timestamp) * 1000),
          transactionId: proof.transactionId,
          pdaAddress: proof.pdaAddress
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
}

module.exports = { createAnchorClient };