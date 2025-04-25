/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/timestamp_proof.json`.
 */
export type TimestampProof = {
  "address": "DujDbJgRWo6cQcNTdT6FPbqWdLQg1mioJEGmHxH5uvf1",
  "metadata": {
    "name": "timestampProof",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Proof of Creation Timestamping program for Rebellion music platform"
  },
  "instructions": [
    {
      "name": "getProofOfCreation",
      "docs": [
        "Récupère les métadonnées d'une preuve de création"
      ],
      "discriminator": [
        136,
        124,
        201,
        138,
        24,
        213,
        161,
        167
      ],
      "accounts": [
        {
          "name": "artist",
          "docs": [
            "mais n'est pas utilisée pour accéder aux données ou signer la transaction"
          ]
        },
        {
          "name": "proofOfCreation",
          "docs": [
            "Le compte PDA qui stocke la preuve de création"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  111,
                  102,
                  45,
                  111,
                  102,
                  45,
                  99,
                  114,
                  101,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "artist"
              },
              {
                "kind": "arg",
                "path": "trackHash"
              }
            ]
          }
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
      "name": "mintProofOfCreation",
      "docs": [
        "Mint un nouveau micro-NFT comme preuve de création pour un artiste et un track"
      ],
      "discriminator": [
        22,
        116,
        122,
        23,
        21,
        97,
        114,
        253
      ],
      "accounts": [
        {
          "name": "artist",
          "docs": [
            "pour dériver l'adresse PDA, mais n'est pas utilisée pour accéder aux données",
            "L'artiste qui crée la preuve (signer)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payer",
          "docs": [
            "Le compte qui paie les frais de transaction (peut être le même que l'artiste)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "proofOfCreation",
          "docs": [
            "Le compte PDA qui stockera la preuve de création"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  111,
                  102,
                  45,
                  111,
                  102,
                  45,
                  99,
                  114,
                  101,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "artist"
              },
              {
                "kind": "arg",
                "path": "trackHash"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
      "discriminator": [
        176,
        199,
        228,
        135,
        174,
        198,
        34,
        137
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "duplicateMint",
      "msg": "Une preuve pour ce track existe déjà"
    },
    {
      "code": 6001,
      "name": "invalidTrackHash",
      "msg": "Hash de track invalide"
    },
    {
      "code": 6002,
      "name": "proofOfCreationNotFound",
      "msg": "Preuve de création non trouvée"
    }
  ],
  "types": [
    {
      "name": "proofOfCreation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "artist",
            "type": "pubkey"
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
  ]
};
