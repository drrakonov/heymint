"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.signup = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../utils/jwt");
const setRefreshToken = (res, token) => {
    res.cookie(process.env.COOKIE_NAME || "refreshToken", token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
const prisma = new client_1.PrismaClient();
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }
    const existingUser = yield prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            message: "User already exists"
        });
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const user = yield prisma.user.create({
        data: { name: "user", email, password: hashedPassword }
    });
    const accessToken = (0, jwt_1.generateAccessToken)(user.id);
    const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
    yield prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    setRefreshToken(res, refreshToken);
    res.status(201).json({ accessToken, message: "You are signed in" });
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatched = yield bcrypt_1.default.compare(password, user.password);
    if (!isMatched) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const accessToken = (0, jwt_1.generateAccessToken)(user.id);
    const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
    yield prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    setRefreshToken(res, refreshToken);
    res.status(200).json({ accessToken, message: "You are loggedin" });
});
exports.login = login;
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[process.env.COOKIE_NAME || "refreshToken"];
    if (!token) {
        return res.status(401).json({ message: "token not found" });
    }
    try {
        const decoded = (0, jwt_1.verifyRefreshToken)(token);
        const exists = yield prisma.refreshToken.findUnique({ where: { token } });
        if (!exists || exists.expiresAt < new Date()) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const accessToken = (0, jwt_1.generateAccessToken)(decoded.userId);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(decoded.userId);
        try {
            yield prisma.refreshToken.delete({ where: { token } });
            yield prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: decoded.userId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        }
        catch (err) {
            res.status(500).json({ message: "Error modifying refresh token" });
        }
        setRefreshToken(res, newRefreshToken);
        res.status(200).json({ accessToken, message: "token refreshed..." });
    }
    catch (err) {
        res.status(403).json({ message: "Invalid refresh token" });
    }
});
exports.refresh = refresh;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[process.env.COOKIE_NAME || "refreshToken"];
    if (token) {
        yield prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie(process.env.COOKIE_NAME || "refreshToken");
    res.status(200).json({ message: "Logged out" });
});
exports.logout = logout;
