"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express_1.default.json({
    limit: "20kb"
}));
app.use((0, cookie_parser_1.default)());
app.get('/', (req, res) => {
    res.send('Server is running...🚀');
});
app.use("/api/auth", auth_routes_1.default);
app.use((err, req, res, next) => {
    console.error("🔥 Error:", err.stack || err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
