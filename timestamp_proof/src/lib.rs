use anchor_lang::prelude::*;

declare_id!("DujDbJgRWo6cQcNTdT6FPbqWdLQg1mioJEGmHxH5uvf1");

#[program]
pub mod timestamp_proof {
    use super::*;

    /// Mint un nouveau micro-NFT comme preuve de création pour un artiste et un track
    pub fn mint_proof_of_creation(
        ctx: Context<MintProof>,
        track_hash: [u8; 32],
    ) -> Result<()> {
        let proof_account = &mut ctx.accounts.proof_of_creation;
        
        // Obtenir le timestamp actuel
        let clock = Clock::get()?;
        
        // Stocker les données
        proof_account.artist = ctx.accounts.artist.key();
        proof_account.track_hash = track_hash;
        proof_account.timestamp = clock.unix_timestamp;
        
        msg!("Preuve de création créée pour l'artiste: {}", proof_account.artist);
        msg!("Hash du track: {:?}", proof_account.track_hash);
        msg!("Timestamp: {}", proof_account.timestamp);
        
        Ok(())
    }
    
    /// Récupère les métadonnées d'une preuve de création
    pub fn get_proof_of_creation(
        _ctx: Context<GetProof>,
        _track_hash: [u8; 32],
    ) -> Result<()> {
        // La logique réelle est gérée par le client qui lira les données du compte
        // Cette instruction est principalement utilisée pour vérifier que le compte existe
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(track_hash: [u8; 32])]
pub struct MintProof<'info> {
    /// CHECK: Cette clé publique est uniquement utilisée comme paramètre d'entrée 
    /// pour dériver l'adresse PDA, mais n'est pas utilisée pour accéder aux données
    /// L'artiste qui crée la preuve (signer)
    #[account(mut)]
    pub artist: Signer<'info>,
    
    /// Le compte qui paie les frais de transaction (peut être le même que l'artiste)
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// Le compte PDA qui stockera la preuve de création
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 8, // discriminator + artist + track_hash + timestamp
        seeds = [b"proof-of-creation", artist.key().as_ref(), &track_hash],
        bump
    )]
    pub proof_of_creation: Account<'info, ProofOfCreation>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(track_hash: [u8; 32])]
pub struct GetProof<'info> {
    /// CHECK: Cette clé publique est uniquement utilisée pour dériver l'adresse PDA,
    /// mais n'est pas utilisée pour accéder aux données ou signer la transaction
    pub artist: AccountInfo<'info>,
    
    /// Le compte PDA qui stocke la preuve de création
    #[account(
        seeds = [b"proof-of-creation", artist.key().as_ref(), &track_hash],
        bump,
    )]
    pub proof_of_creation: Account<'info, ProofOfCreation>,
}

#[account]
pub struct ProofOfCreation {
    pub artist: Pubkey,        // Clé publique de l'artiste
    pub track_hash: [u8; 32],  // Hash SHA-256 du fichier audio
    pub timestamp: i64,        // Timestamp Unix de création (secondes)
}

#[error_code]
pub enum ErrorCode {
    #[msg("Une preuve pour ce track existe déjà")]
    DuplicateMint,
    
    #[msg("Hash de track invalide")]
    InvalidTrackHash,
    
    #[msg("Preuve de création non trouvée")]
    ProofOfCreationNotFound,
}