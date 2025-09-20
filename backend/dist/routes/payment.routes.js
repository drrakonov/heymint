"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const payment_middleware_1 = require("../middlewares/payment.middleware");
const router = express_1.default.Router();
router.post("/demo-payment", payment_middleware_1.validatePaymentInput, auth_middleware_1.authenticate, (0, express_async_handler_1.default)(payment_controller_1.demoPayement));
exports.default = router;
