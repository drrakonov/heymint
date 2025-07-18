"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post("/signup", auth_middleware_1.validateAuth, (0, express_async_handler_1.default)(auth_controller_1.signup));
router.post("/login", auth_middleware_1.validateAuth, (0, express_async_handler_1.default)(auth_controller_1.login));
router.post("/refresh", auth_middleware_1.authenticate, (0, express_async_handler_1.default)(auth_controller_1.refresh));
router.post("/logout", auth_middleware_1.authenticate, (0, express_async_handler_1.default)(auth_controller_1.logout));
exports.default = router;
