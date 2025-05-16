import { UserAccount } from '../interfaces/types';
/**
 * Service pour gérer l'authentification via Magic.link
 */
export declare class MagicAuthService {
    private magic;
    constructor();
    /**
     * Valider un DID token Magic
     */
    validateToken(didToken: string): Promise<boolean>;
    /**
     * Récupérer les métadonnées utilisateur à partir d'un token
     */
    getUserMetadata(didToken: string): Promise<{
        issuer: string;
        email?: string;
        publicAddress?: string;
    }>;
    /**
     * Vérifier si une chaîne est au format base58 valide
     * Le format base58 utilise ces caractères: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
     */
    private isValidBase58;
    /**
     * Générer une adresse Solana valide au format base58
     */
    private generateValidSolanaAddress;
    /**
     * Créer un compte utilisateur à partir des données Magic
     */
    createUserAccountFromMagic(didToken: string, username?: string): Promise<UserAccount>;
    /**
     * Déconnecter un utilisateur Magic
     */
    logoutUser(issuer: string): Promise<boolean>;
    /**
     * Vérifier si un utilisateur existe déjà avec cet issuer
     */
    userExists(issuer: string): Promise<boolean>;
}
