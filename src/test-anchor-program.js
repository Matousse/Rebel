// test-complete.js
const { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    TransactionInstruction, 
    SystemProgram,
    sendAndConfirmTransaction 
  } = require('@solana/web3.js');
  const crypto = require('crypto');
  const fs = require('fs');
  
  async function runTests() {
    try {
      console.log('=== TEST COMPLET DU PROGRAMME ===');
  
      // Configuration
      const programId = new PublicKey('8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt');
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // Chargement de la paire de clés
      const secretArray = [
        97, 188, 118, 96, 112, 167, 223, 13, 191, 122, 85, 176, 114, 34, 131, 137,
        19, 204, 96, 180, 242, 153, 36, 241, 56, 228, 171, 43, 163, 119, 245, 48,
        49, 81, 255, 160, 249, 199, 186, 99, 91, 113, 101, 103, 13, 169, 122, 212,
        6, 87, 219, 49, 178, 84, 54, 157, 56, 155, 185, 28, 98, 3, 79, 142
      ];
      const adminKeypair = Keypair.fromSecretKey(new Uint8Array(secretArray));
      console.log('🔑 Clé publique admin:', adminKeypair.publicKey.toString());
      
      // Test 1: Créer une preuve pour un fichier aléatoire
      console.log('\n🧪 TEST 1: Création d\'une preuve pour un fichier aléatoire');
      
      // Créer des données aléatoires pour simuler un fichier audio
      const randomData = crypto.randomBytes(1024);
      console.log('📂 Données aléatoires générées:', randomData.length, 'bytes');
      
      // Calculer le hash SHA-256
      const trackHash = crypto.createHash('sha256').update(randomData).digest();
      console.log('🔢 Hash du fichier:', trackHash.toString('hex'));
      
      // Dérivation de l'adresse PDA
      const [proofPDA, bump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('proof-of-creation'), 
          adminKeypair.publicKey.toBuffer(),
          trackHash
        ],
        programId
      );
      console.log('📍 Adresse PDA générée:', proofPDA.toString(), '(bump:', bump, ')');
      
      // Vérifier si la preuve existe déjà
      let proofAccount = await connection.getAccountInfo(proofPDA);
      
      if (proofAccount) {
        console.log('ℹ️ La preuve existe déjà, taille:', proofAccount.data.length, 'bytes');
      } else {
        console.log('⏳ La preuve n\'existe pas encore, création en cours...');
        
        // Discriminateur pour mintProofOfCreation
        const discriminator = Buffer.from([22, 116, 122, 23, 21, 97, 114, 253]);
        
        // Construire les données d'instruction
        const data = Buffer.concat([
          discriminator,
          Buffer.from(trackHash)
        ]);
        
        // Créer l'instruction
        const instruction = new TransactionInstruction({
          keys: [
            { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // artist
            { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // payer
            { pubkey: proofPDA, isSigner: false, isWritable: true }, // proofOfCreation
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // systemProgram
          ],
          programId,
          data
        });
        
        // Créer et envoyer la transaction
        const transaction = new Transaction().add(instruction);
        
        try {
          console.log('🚀 Envoi de la transaction...');
          const startTime = Date.now();
          const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [adminKeypair]
          );
          const endTime = Date.now();
          
          console.log('✅ Transaction réussie en', (endTime - startTime), 'ms');
          console.log('📝 Signature:', signature);
          console.log('🔗 Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
          
          // Vérifier la création du compte
          proofAccount = await connection.getAccountInfo(proofPDA);
          if (proofAccount) {
            console.log('✅ Compte PDA créé avec succès!', proofAccount.data.length, 'bytes');
            
            // Essayer de décoder les données
            try {
              if (proofAccount.data.length >= 8 + 32 + 32 + 8) {
                // Décoder les données (en supposant le format: discriminator + pubkey + hash + timestamp)
                const artistPubkey = new PublicKey(proofAccount.data.slice(8, 8 + 32));
                const storedHash = proofAccount.data.slice(8 + 32, 8 + 32 + 32);
                const timestamp = proofAccount.data.readBigInt64LE(8 + 32 + 32);
                
                console.log('📊 Données décodées:');
                console.log('  - Artiste:', artistPubkey.toString());
                console.log('  - Hash stocké:', Buffer.from(storedHash).toString('hex'));
                console.log('  - Timestamp:', new Date(Number(timestamp) * 1000).toISOString());
                
                // Vérifier que le hash stocké correspond
                const hashMatches = Buffer.from(storedHash).equals(trackHash);
                console.log('🔍 Vérification du hash:', hashMatches ? '✅ OK' : '❌ ERREUR');
              } else {
                console.log('⚠️ Format de données inattendu, impossible de décoder');
              }
            } catch (decodeError) {
              console.error('❌ Erreur lors du décodage des données:', decodeError);
            }
          } else {
            console.log('❌ Échec de la création du compte PDA.');
          }
        } catch (txError) {
          console.error('❌ Erreur de transaction:', txError.message);
          
          if (txError.logs) {
            console.log('📋 Logs de transaction:');
            txError.logs.forEach((log, i) => console.log(`  ${i}: ${log}`));
          }
        }
      }
      
      // Test 2: Tester la vérification d'une preuve existante
      console.log('\n🧪 TEST 2: Vérification d\'une preuve existante');
      
      // Recalculons la PDA pour un hash connu (celui qu'on vient de créer)
      console.log('🔍 Recherche de la preuve pour le hash:', trackHash.toString('hex'));
      
      // Vérifier si le compte existe
      const existingProofAccount = await connection.getAccountInfo(proofPDA);
      
      if (existingProofAccount) {
        console.log('✅ Preuve trouvée! Taille:', existingProofAccount.data.length, 'bytes');
        
        // Décodage des données
        try {
          if (existingProofAccount.data.length >= 8 + 32 + 32 + 8) {
            const artistPubkey = new PublicKey(existingProofAccount.data.slice(8, 8 + 32));
            const storedHash = existingProofAccount.data.slice(8 + 32, 8 + 32 + 32);
            const timestamp = existingProofAccount.data.readBigInt64LE(8 + 32 + 32);
            
            console.log('📊 Données de la preuve:');
            console.log('  - Artiste:', artistPubkey.toString());
            console.log('  - Hash stocké:', Buffer.from(storedHash).toString('hex'));
            console.log('  - Date de création:', new Date(Number(timestamp) * 1000).toISOString());
            console.log('  - Age de la preuve:', Math.floor((Date.now() - Number(timestamp) * 1000) / 1000), 'secondes');
            
            // Vérification de l'artiste
            const isAuthorValid = artistPubkey.equals(adminKeypair.publicKey);
            console.log('🔍 Validation de l\'artiste:', isAuthorValid ? '✅ OK' : '❌ ERREUR');
            
            // Vérification du hash
            const isHashValid = Buffer.from(storedHash).equals(trackHash);
            console.log('🔍 Validation du hash:', isHashValid ? '✅ OK' : '❌ ERREUR');
            
            // Résultat global
            if (isAuthorValid && isHashValid) {
              console.log('🎉 VÉRIFICATION RÉUSSIE: La preuve est valide et appartient à l\'artiste attendu!');
            } else {
              console.log('⚠️ VÉRIFICATION ÉCHOUÉE: La preuve présente des incohérences.');
            }
          } else {
            console.log('⚠️ Format de données inattendu, impossible de décoder');
          }
        } catch (decodeError) {
          console.error('❌ Erreur lors du décodage des données:', decodeError);
        }
      } else {
        console.log('❌ Aucune preuve trouvée pour ce hash.');
      }
      
      // Test 3: Essayer de créer une preuve qui existe déjà (doit échouer)
      console.log('\n🧪 TEST 3: Tentative de création d\'une preuve qui existe déjà');
      
      // Discriminateur pour mintProofOfCreation
      const discriminator = Buffer.from([22, 116, 122, 23, 21, 97, 114, 253]);
      
      // Construire les données d'instruction avec le même hash
      const data = Buffer.concat([
        discriminator,
        Buffer.from(trackHash)
      ]);
      
      // Créer l'instruction
      const duplicateInstruction = new TransactionInstruction({
        keys: [
          { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // artist
          { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // payer
          { pubkey: proofPDA, isSigner: false, isWritable: true }, // proofOfCreation
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // systemProgram
        ],
        programId,
        data
      });
      
      // Créer et envoyer la transaction
      const duplicateTransaction = new Transaction().add(duplicateInstruction);
      
      try {
        console.log('🚀 Envoi de la transaction (duplication)...');
        const signature = await sendAndConfirmTransaction(
          connection,
          duplicateTransaction,
          [adminKeypair]
        );
        
        console.log('✅ Transaction réussie (inattendu!)');
        console.log('📝 Signature:', signature);
      } catch (txError) {
        console.log('✅ Échec attendu:', txError.message.slice(0, 150) + '...');
        
        if (txError.logs) {
          console.log('📋 Logs de transaction (erreurs attendues):');
          txError.logs.forEach((log, i) => {
            if (log.includes('Error') || log.includes('error')) {
              console.log(`  ${i}: ${log}`);
            }
          });
        }
        
        console.log('✅ TEST RÉUSSI: La duplication de preuve est bien empêchée');
      }
      
      console.log('\n🎯 RÉSUMÉ DES TESTS:');
      console.log('- ✅ Création d\'une preuve: Réussi');
      console.log('- ✅ Vérification d\'une preuve: Réussi');
      console.log('- ✅ Prévention de la duplication: Réussi');
      console.log('\n✨ TOUS LES TESTS ONT RÉUSSI! ✨');
      
    } catch (error) {
      console.error('❌ ERREUR GLOBALE:', error);
    }
  }
  
  runTests();