"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
router.get("/me", auth_middleware_1.authenticate, (0, express_async_handler_1.default)(user_controller_1.getUserInfo));
router.post("/update-user", auth_middleware_1.validateUpdateProfile, (0, express_async_handler_1.default)(user_controller_1.updateUserProfile));
exports.default = router;
