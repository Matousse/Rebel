import { Request, Response, NextFunction } from 'express';
import { MagicAuthService } from '../account-abstraction/services/magic-auth-service';
import { accountService } from '../account-abstraction';

// Service Magic pour validation des tokens
const magicAuthService = new MagicAuthService();

// Extension de l'interface Request pour TypeScript
declare global {
  namespace Express {
    interface Request {
      magicUser?: {
        issuer: string;
        email?: string;
        publicAddress?: string;
        isRegistered: boolean;
        userId?: string;
      };
      user?: any; // Interface utilisateur existante du backend
    }
  }
}

/**
 * Middleware pour vérifier l'authentification Magic
 * Valide le token et ajoute les données utilisateur à la requête
 */
export const verifyMagicToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Vérifier que l'Authorization header est présent
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized', 
        message: 'Token d\'authentification manquant' 
      });
    }
    
    // Extraire le DID token
    const didToken = authHeader.split('Bearer ')[1];
    if (!didToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized', 
        message: 'Token d\'authentification invalide' 
      });
    }

    // Valider le token Magic
    try {
      const isValid = await magicAuthService.validateToken(didToken);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Token Magic invalide'
        });
      }
      
      // Récupérer les métadonnées de l'utilisateur
      const metadata = await magicAuthService.getUserMetadata(didToken);
      
      // Vérifier si l'utilisateur existe dans notre système
      if (!metadata.issuer) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Identifiant Magic manquant'
        });
      }
      
      const user = accountService.getUserByMagicIssuer(metadata.issuer);
      
      if (!user) {
        // L'utilisateur est authentifié via Magic mais n'existe pas encore dans notre système
        req.magicUser = {
          issuer: metadata.issuer,
          email: metadata.email,
          publicAddress: metadata.publicAddress,
          isRegistered: false
        };
      } else {
        // L'utilisateur existe dans notre système
        req.magicUser = {
          issuer: metadata.issuer,
          email: metadata.email,
          publicAddress: metadata.publicAddress,
          isRegistered: true,
          userId: user.id
        };
        
        // Ajouter l'utilisateur complet à la requête pour compatibilité avec le système existant
        // Ajustez cette partie selon la structure utilisateur du backend existant
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          publicKey: user.publicKey
        };
      }
      
      next();
    } catch (error) {
      console.error('Erreur lors de la validation du token Magic:', error);
      return res.status(401).json({
        success: false, 
        error: 'Unauthorized',
        message: 'Erreur d\'authentification'
      });
    }
  } catch (error) {
    console.error('Erreur dans le middleware Magic:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error', 
      message: 'Une erreur est survenue lors de la vérification de l\'authentification' 
    });
  }
};

/**
 * Middleware pour garantir que l'utilisateur est enregistré
 * À utiliser après verifyMagicToken
 */
export const requireRegisteredUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.magicUser || !req.magicUser.isRegistered) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Vous devez être enregistré pour accéder à cette ressource',
      needsRegistration: true
    });
  }
  
  next();
};