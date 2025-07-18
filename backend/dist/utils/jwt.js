"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (userId) => {
    try {
        const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
        const JWT_ACCESS_EXPIRES_IN = "15m";
        if (!JWT_ACCESS_SECRET) {
            throw new Error("JWT_ACCESS_SECRET is not defined");
        }
        return jsonwebtoken_1.default.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
    }
    catch (err) {
        console.error("Failed to generate accesss token", err);
        throw new Error("Access token generation failed");
    }
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    try {
        const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
        const JWT_REFRESH_EXPIRES_IN = "7d";
        if (!JWT_REFRESH_SECRET) {
            throw new Error("JWT_REFRESH_SECRET is not defined");
        }
        return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    }
    catch (err) {
        console.error("Failed to generate refresh token", err);
        throw new Error("Refresh token generation failed");
    }
};
exports.generateRefreshToken = generateRefreshToken;
const verifyRefreshToken = (token) => {
    try {
        const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
        return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    catch (err) {
        console.error("Something went wrong in verification of refresh token", err);
        throw new Error("verification of refresh token is failed");
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
