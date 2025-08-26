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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMeetingSetup = exports.createGetStreamToken = void 0;
const node_sdk_1 = require("@stream-io/node-sdk");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getStreamApiKey = process.env.STREAM_API_KEY;
const getStreamApiSecret = process.env.STREAM_SECRET_KEY;
const client = new node_sdk_1.StreamClient(getStreamApiKey, getStreamApiSecret);
const createGetStreamToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, name } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "UserId not found" });
        }
        const newUser = {
            name: name || "unknown",
            id: userId,
            role: 'user'
        };
        yield client.upsertUsers([newUser]);
        const validity = 60 * 60;
        const token = client.generateUserToken({
            user_id: userId,
            validity_in_seconds: validity
        });
        const apiKey = getStreamApiKey;
        res.status(200).json({ success: true, message: "Token generated successfully", token, apiKey });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "get stream token generation failed" });
    }
});
exports.createGetStreamToken = createGetStreamToken;
const handleMeetingSetup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, isScheduled, isPaid, price, startingTime, createdBy, isProtected, password, meetingCode } = req.body;
        yield prisma.meeting.create({
            data: {
                title: title,
                desc: description,
                password: isProtected ? password : null,
                isProtected: isProtected,
                createdById: createdBy,
                startingTime: isScheduled ? startingTime : new Date(),
                price: isPaid ? price : 0,
                isPaid: isPaid,
                meetingCode: meetingCode
            }
        });
        return res.status(201).json({ success: true, message: "meeting details stored" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "meeting setup failed" });
    }
});
exports.handleMeetingSetup = handleMeetingSetup;
