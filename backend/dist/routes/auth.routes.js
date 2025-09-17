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
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const passport_1 = __importDefault(require("passport"));
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
const ratelimiter_middleware_1 = __importDefault(require("../middlewares/ratelimiter.middleware"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post("/signup", auth_middleware_1.validateSignupAuth, (0, express_async_handler_1.default)(auth_controller_1.signup));
router.post("/send-otp", ratelimiter_middleware_1.default, (0, express_async_handler_1.default)(auth_controller_1.setupOtp));
router.post("/login", auth_middleware_1.validateLoginAuth, (0, express_async_handler_1.default)(auth_controller_1.login));
router.post("/refresh", (0, express_async_handler_1.default)(auth_controller_1.refresh));
router.post("/logout", auth_middleware_1.authenticate, (0, express_async_handler_1.default)(auth_controller_1.logout));
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: "/auth/login" }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const accessToken = (0, jwt_1.generateAccessToken)(user.id);
    const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
    yield prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    (0, auth_controller_1.setRefreshToken)(res, refreshToken);
    res.redirect(`${process.env.CORS_ORIGIN}/?access=${accessToken}`);
}));
exports.default = router;
