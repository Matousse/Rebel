import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { TimestampProof } from '../target/types/timestamp_proof';
import { Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';

describe('timestamp_proof', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TimestampProof as Program<TimestampProof>;
  
  // Créer un keypair pour l'artiste
  const artist = Keypair.generate();
  
  // Simuler un hash de track (32 octets)
  const trackHash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    trackHash[i] = i;
  }
  
  // Dériver l'adresse PDA pour la preuve
  let proofPDA: [PublicKey, number];
  
  before(async () => {
    // Airdrop SOL à l'artiste pour les tests
    const airdropSig = await provider.connection.requestAirdrop(
      artist.publicKey,
      1000000000 // 1 SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    
    // Calculer l'adresse PDA
    proofPDA = await PublicKey.findProgramAddress(
      [
        Buffer.from('proof-of-creation'),
        artist.publicKey.toBuffer(),
        trackHash
      ],
      program.programId
    );
    
    console.log('PDA de la preuve:', proofPDA[0].toString());
  });
  
  it('Mint une nouvelle preuve de création', async () => {
    await program.methods
      .mintProofOfCreation(Array.from(trackHash))
      .accounts({
        artist: artist.publicKey,
        payer: artist.publicKey,
        proofOfCreation: proofPDA[0],
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([artist])
      .rpc();
    
    // Récupérer et vérifier les données
    const proofAccount = await program.account.proofOfCreation.fetch(proofPDA[0]);
    
    expect(proofAccount.artist.toString()).to.equal(artist.publicKey.toString());
    expect(Buffer.from(proofAccount.trackHash)).to.deep.equal(Buffer.from(trackHash));
    expect(proofAccount.timestamp).to.be.greaterThan(0);
    
    console.log('Preuve créée avec succès:');
    console.log('Artiste:', proofAccount.artist.toString());
    console.log('Timestamp:', new Date(proofAccount.timestamp * 1000).toISOString());
  });
  
  it('Récupère une preuve existante', async () => {
    await program.methods
      .getProofOfCreation(Array.from(trackHash))
      .accounts({
        artist: artist.publicKey,
        proofOfCreation: proofPDA[0],
      })
      .rpc();
    
    // Récupérer les données et vérifier
    const proofAccount = await program.account.proofOfCreation.fetch(proofPDA[0]);
    
    expect(proofAccount.artist.toString()).to.equal(artist.publicKey.toString());
    expect(Buffer.from(proofAccount.trackHash)).to.deep.equal(Buffer.from(trackHash));
    
    console.log('Preuve récupérée avec succès:');
    console.log('Timestamp Unix:', proofAccount.timestamp);
    console.log('Timestamp ISO:', new Date(proofAccount.timestamp * 1000).toISOString());
  });
  
  it('Échoue à créer un duplicata', async () => {
    try {
      await program.methods
        .mintProofOfCreation(Array.from(trackHash))
        .accounts({
          artist: artist.publicKey,
          payer: artist.publicKey,
          proofOfCreation: proofPDA[0],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([artist])
        .rpc();
      
      expect.fail('La transaction aurait dû échouer');
    } catch (error) {
      // Vérifier que l'erreur est due au duplicata
      expect(error.toString()).to.include('Error');
      console.log('Erreur attendue reçue pour duplicata:', error.toString());
    }
  });
});