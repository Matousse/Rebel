/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/timestamp_proof.json`.
 */
export type TimestampProof = {
  "address": "8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt",
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
        "Vérifie l'existence d'une preuve de création"
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
            "Artiste pour dériver la PDA"
          ]
        },
        {
          "name": "proofOfCreation",
          "docs": [
            "Compte de la preuve existante"
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
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [],
      "args": []
    },
    {
      "name": "mintProofOfCreation",
      "docs": [
        "Mint une nouvelle preuve de création sous forme de micro-NFT"
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
          "name": "proofOfCreation",
          "docs": [
            "Compte PDA qui stocke la preuve de création"
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
          "docs": [
            "Programme système"
          ],
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
      "msg": "Une preuve pour ce track existe déjà."
    },
    {
      "code": 6001,
      "name": "invalidTrackHash",
      "msg": "Hash du track invalide."
    },
    {
      "code": 6002,
      "name": "proofOfCreationNotFound",
      "msg": "Preuve de création introuvable."
    }
  ],
  "types": [
    {
      "name": "proofOfCreation",
      "docs": [
        "Structure stockant les métadonnées de la preuve de création"
      ],
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
