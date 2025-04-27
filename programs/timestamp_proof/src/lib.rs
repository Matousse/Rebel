use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("8Hh439HNMKGRTD1gmnifrJ2RrP6y8PsKwHRRQyponubt");

#[program]
pub mod timestamp_proof {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    /// Mint une nouvelle preuve de création sous forme de micro-NFT
    pub fn mint_proof_of_creation(
        ctx: Context<MintProof>,
        track_hash: [u8; 32],
    ) -> Result<()> {
        let proof_account = &mut ctx.accounts.proof_of_creation;

        // Récupérer l'heure actuelle
        let clock = Clock::get()?;

        // Stocker les données de la preuve
        proof_account.artist = ctx.accounts.artist.key();
        proof_account.track_hash = track_hash;
        proof_account.timestamp = clock.unix_timestamp;

        msg!("✅ Preuve créée pour l'artiste: {}", proof_account.artist);
        msg!("🎵 Hash du track: {:?}", proof_account.track_hash);
        msg!("🕒 Timestamp: {}", proof_account.timestamp);

        Ok(())
    }

    /// Vérifie l'existence d'une preuve de création
    pub fn get_proof_of_creation(
        _ctx: Context<GetProof>,
        _track_hash: [u8; 32],
    ) -> Result<()> {
        // La lecture des données sera faite côté client.
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

/// Contexte pour la création d'une preuve de création
#[derive(Accounts)]
#[instruction(track_hash: [u8; 32])]
pub struct MintProof<'info> {
    /// Artiste créateur de la preuve (doit signer)
    #[account(mut)]
    pub artist: Signer<'info>,

    /// Payer des frais (peut être l'artiste lui-même)
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Compte PDA qui stocke la preuve de création
    #[account(
        init,
        payer = payer,
        space = ProofOfCreation::LEN,
        seeds = [b"proof-of-creation", artist.key().as_ref(), &track_hash],
        bump,
    )]
    pub proof_of_creation: Account<'info, ProofOfCreation>,

    /// Programme système
    pub system_program: Program<'info, System>,
}

/// Contexte pour récupérer une preuve de création
#[derive(Accounts)]
#[instruction(track_hash: [u8; 32])]
pub struct GetProof<'info> {
    /// Artiste pour dériver la PDA
    /// CHECK: Utilisé seulement pour dériver l'adresse PDA
    pub artist: AccountInfo<'info>,

    /// Compte de la preuve existante
    #[account(
        seeds = [b"proof-of-creation", artist.key().as_ref(), &track_hash],
        bump,
    )]
    pub proof_of_creation: Account<'info, ProofOfCreation>,
}

/// Structure stockant les métadonnées de la preuve de création
#[account]
pub struct ProofOfCreation {
    pub artist: Pubkey,       // Clé publique de l'artiste
    pub track_hash: [u8; 32], // Hash SHA-256 du fichier audio
    pub timestamp: i64,       // Timestamp Unix (en secondes)
}

impl ProofOfCreation {
    pub const LEN: usize = 8 + 32 + 32 + 8; // discriminator + artist + track_hash + timestamp
}

/// Codes d'erreurs possibles
#[error_code]
pub enum ErrorCode {
    #[msg("Une preuve pour ce track existe déjà.")]
    DuplicateMint,

    #[msg("Hash du track invalide.")]
    InvalidTrackHash,

    #[msg("Preuve de création introuvable.")]
    ProofOfCreationNotFound,
}