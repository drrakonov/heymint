"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = require("express-rate-limit");
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 1,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
});
exports.default = limiter;
