"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.validateUpdateProfile = exports.validateAuth = exports.validateMeetingInput = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const Types_1 = require("../utils/Types");
const authSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6, "Password must be atleast 6 characters")
});
const updateProfile = zod_1.z.object({
    newName: zod_1.z.string()
        .max(20, "Username must be less than 10 characters")
        .min(3, "Username must be atleast 3 characters"),
    id: zod_1.z.string().uuid("Invalid user ID")
});
const validateMeetingInput = (req, res, next) => {
    try {
        Types_1.meetingInputType.parse(req.body);
        next();
    }
    catch (err) {
        return res.status(400).json({ success: false, message: "Validation error" });
    }
};
exports.validateMeetingInput = validateMeetingInput;
const validateAuth = (req, res, next) => {
    try {
        authSchema.parse(req.body);
        next();
    }
    catch (err) {
        if (typeof err === "object" && err !== null && "errors" in err && Array.isArray(err.errors)) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        return res.status(400).json({ message: "Validation error" });
    }
};
exports.validateAuth = validateAuth;
const validateUpdateProfile = (req, res, next) => {
    try {
        updateProfile.parse(req.body);
        next();
    }
    catch (err) {
        if (typeof err === "object" && err !== null && "errors" in err && Array.isArray(err.errors)) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        return res.status(400).json({ message: "Validation error" });
    }
};
exports.validateUpdateProfile = validateUpdateProfile;
const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!(auth === null || auth === void 0 ? void 0 : auth.startsWith("Bearer "))) {
        return res.status(401).json({ message: "No token" });
    }
    const token = auth.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.userId };
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.authenticate = authenticate;
