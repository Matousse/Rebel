// Types générés pour interagir avec le programme Anchor
export type TimestampProof = {
    "version": "0.1.0",
    "name": "timestamp_proof",
    "instructions": [
      {
        "name": "mintProofOfCreation",
        "accounts": [
          {
            "name": "artist",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "proofOfCreation",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "trackHash",
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
        "name": "getProofOfCreation",
        "accounts": [
          {
            "name": "artist",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "proofOfCreation",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "trackHash",
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
        "name": "proofOfCreation",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "artist",
              "type": "publicKey"
            },
            {
              "name": "trackHash",
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
        "msg": "Une preuve pour ce track existe déjà"
      },
      {
        "code": 6001,
        "name": "InvalidTrackHash",
        "msg": "Hash de track invalide"
      },
      {
        "code": 6002,
        "name": "ProofOfCreationNotFound",
        "msg": "Preuve de création non trouvée"
      }
    ]
  };
  
  export interface ProofOfCreationAccount {
    artist: any; // PublicKey
    trackHash: number[]; // [u8; 32]
    timestamp: any; // BN (i64)
  }