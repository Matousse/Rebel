// test-anchor-program.js
const path = require('path');
const dotenv = require('dotenv');
const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@coral-xyz/anchor');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve('/Users/admin/Desktop/rebel/.env') });

async function testProgram() {
    try {
        console.log('=== DÉMARRAGE DU TEST ===');

        // Clé secrète (tableau d'octets)
        const secretArray = [
            97, 188, 118, 96, 112, 167, 223, 13, 191, 122, 85, 176, 114, 34, 131, 137,
            19, 204, 96, 180, 242, 153, 36, 241, 56, 228, 171, 43, 163, 119, 245, 48,
            49, 81, 255, 160, 249, 199, 186, 99, 91, 113, 101, 103, 13, 169, 122, 212,
            6, 87, 219, 49, 178, 84, 54, 157, 56, 155, 185, 28, 98, 3, 79, 142
        ];
        const adminKeypair = Keypair.fromSecretKey(new Uint8Array(secretArray));
        console.log('Clé publique admin:', adminKeypair.publicKey.toString());

        // Utiliser l'IDL corrigé
        const fixedIdlPath = '/Users/admin/Desktop/rebel/fixed_idl.json';
        console.log('Chargement de l\'IDL depuis:', fixedIdlPath);
        const idl = require(fixedIdlPath);

        console.log('Nom du programme:', idl.name);
        console.log('Version du programme:', idl.version);

        // Connexion Solana
        const network = 'https://api.devnet.solana.com';
        const connection = new Connection(network, 'confirmed');
        console.log('Connecté à:', network);

        // Vérifier le solde
        const balance = await connection.getBalance(adminKeypair.publicKey);
        console.log('Solde (lamports):', balance, '=>', (balance / 1e9), 'SOL');
        if (balance < 1e7) {
            console.warn('⚠️ Solde faible (< 0.01 SOL)');
        }

        // Résoudre l'adresse du programme
        const programId = new PublicKey('5bcDroVghDth7qy6QDtWkcEi5k72PSDZHwiHkxTiHrRZ');
        console.log('Programme ID:', programId.toString());

        // Provider Anchor
        const provider = new AnchorProvider(
            connection,
            {
                publicKey: adminKeypair.publicKey,
                signTransaction: async (tx) => {
                    tx.partialSign(adminKeypair);
                    return tx;
                },
                signAllTransactions: async (txs) => {
                    return txs.map(tx => {
                        tx.partialSign(adminKeypair);
                        return tx;
                    });
                },
            },
            {
                preflightCommitment: 'processed',
                commitment: 'confirmed'
            }
        );

        // Vérifier que le programme existe
        const programInfo = await connection.getAccountInfo(programId);
        if (!programInfo) {
            console.error('Programme non trouvé sur la blockchain.');
            return;
        }
        if (!programInfo.executable) {
            console.warn('⚠️ Le compte du programme n\'est pas exécutable!');
        }

        console.log('Programme trouvé. Taille:', programInfo.data.length, 'bytes');

        // Instancier le programme Anchor
        const program = new Program(idl, programId, provider);

        // Récupérer les comptes du programme
        const accounts = await connection.getProgramAccounts(programId);
        console.log(`Le programme possède ${accounts.length} comptes.`);

        // Test d'invocation d'une instruction simple : mintProofOfCreation
        console.log('--- TEST : Création d\'une preuve ---');

        // Hash de test
        const testHash = new Uint8Array(32).map((_, i) => i % 256);
        console.log('Test Hash:', Buffer.from(testHash).toString('hex'));

        // Trouver PDA
        const [proofPDA, bump] = await PublicKey.findProgramAddress(
            [
                Buffer.from('proof-of-creation'),
                adminKeypair.publicKey.toBuffer(),
                testHash
            ],
            programId
        );

        console.log('PDA de la preuve:', proofPDA.toString(), ' (bump:', bump, ')');

        // Vérifier si la preuve existe
        try {
            const proof = await program.account.proofOfCreation.fetch(proofPDA);
            console.log('✅ La preuve existe déjà.');
            console.log('- Artiste:', proof.artist.toString());
            console.log('- Hash:', Buffer.from(proof.trackHash).toString('hex'));
            console.log('- Timestamp:', new Date(proof.timestamp * 1000).toISOString());
        } catch (fetchError) {
            console.log('⏳ La preuve n\'existe pas encore, création...');

            // Appel de la méthode Anchor
            try {
                const tx = await program.methods
                    .mintProofOfCreation(Array.from(testHash)) // anchor IDL attend parfois un tableau simple
                    .accounts({
                        artist: adminKeypair.publicKey,
                        payer: adminKeypair.publicKey,
                        proofOfCreation: proofPDA,
                        systemProgram: SystemProgram.programId,
                    })
                    .signers([adminKeypair])
                    .rpc();

                console.log('✅ Transaction envoyée avec succès!');
                console.log('Signature:', tx);
                 // Add a delay here (e.g., 2 seconds)
                await new Promise(resolve => setTimeout(resolve, 3000));

                 // Vérifier que la preuve a été créée
                 try {
                     const proofAccount = await program.account.proofOfCreation.fetch(proofPDA);
                     console.log('La preuve a été vérifiée:');
                     console.log('- Artiste:', proofAccount.artist.toString());
                     console.log('- Hash:', Buffer.from(proofAccount.trackHash).toString('hex'));
                     console.log('- Timestamp:', new Date(proofAccount.timestamp * 1000).toISOString());
                 } catch (verifyError) {
                     console.error('Erreur lors de la vérification de la preuve après création:', verifyError);
                 }

            } catch (mintError) {
                console.error('Erreur lors de la création de la preuve:', mintError);
                console.error('Erreur lors de la création de la preuve:', mintError.message);
             if (mintError.logs) {
                 console.log('\n=== LOGS D\'ERREUR DE TRANSACTION ===');
                 mintError.logs.forEach((log, i) => console.log(`${i}: ${log}`));
             }
            }
        }

    } catch (error) {
        console.error('Erreur principale:', error);
    }
}

// Exécuter
testProgram();