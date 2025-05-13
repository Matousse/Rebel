"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = exports.SolanaService = exports.MagicAuthService = exports.AccountService = void 0;
// Point d'entrée du module Account Abstraction
const account_service_1 = require("./services/account-service");
Object.defineProperty(exports, "AccountService", { enumerable: true, get: function () { return account_service_1.AccountService; } });
const magic_auth_service_1 = require("./services/magic-auth-service");
Object.defineProperty(exports, "MagicAuthService", { enumerable: true, get: function () { return magic_auth_service_1.MagicAuthService; } });
const solana_service_1 = require("./services/solana-service");
Object.defineProperty(exports, "SolanaService", { enumerable: true, get: function () { return solana_service_1.SolanaService; } });
const config_1 = require("./config");
// Valider la configuration au démarrage
(0, config_1.validateConfig)();
// Instance singleton pour utilisation globale
const accountService = new account_service_1.AccountService();
exports.accountService = accountService;
