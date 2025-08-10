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
const client_1 = require("@prisma/client");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma = new client_1.PrismaClient();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const googleId = profile.id;
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        //if email is not present in the profile object
        if (!email)
            return done(new Error("No email found from Google"), null);
        //find user with googleId
        let user = yield prisma.user.findUnique({ where: { googleId } });
        if (user)
            return done(null, user);
        //find user with email
        user = yield prisma.user.findUnique({ where: { email } });
        if (user) {
            user = yield prisma.user.update({
                where: { email },
                data: {
                    googleId,
                    provider: "google",
                    name: user.name === "user" ? profile.displayName : user.name,
                }
            });
            return done(null, user);
        }
        user = yield prisma.user.create({
            data: {
                googleId,
                name: profile.displayName,
                email,
                provider: "google"
            },
        });
        return done(null, user);
    }
    catch (err) {
        return done(err, null);
    }
})));
passport_1.default.serializeUser((user, done) => done(null, user));
passport_1.default.deserializeUser((obj, done) => done(null, obj));
exports.default = passport_1.default;
