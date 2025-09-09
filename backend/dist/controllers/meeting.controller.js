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
exports.validateProtectedPassword = exports.isProtectedMeetingValidation = exports.deleteMeeting = exports.getAllMeetings = exports.handleMeetingSetup = exports.createGetStreamToken = void 0;
const node_sdk_1 = require("@stream-io/node-sdk");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getStreamApiKey = process.env.STREAM_API_KEY;
const getStreamApiSecret = process.env.STREAM_SECRET_KEY;
const client = new node_sdk_1.StreamClient(getStreamApiKey, getStreamApiSecret, { timeout: 15000 });
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
        console.log(err);
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
                isScheduled: isScheduled,
                price: isPaid ? price : 0,
                isPaid: isPaid,
                meetingCode: meetingCode
            }
        });
        return res.status(201).json({ success: true, message: "meeting details stored" });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "meeting setup failed" });
    }
});
exports.handleMeetingSetup = handleMeetingSetup;
const getAllMeetings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meeting = yield prisma.meeting.findMany({
            select: {
                title: true,
                desc: true,
                isPaid: true,
                isProtected: true,
                password: true,
                createdAt: true,
                startingTime: true,
                isScheduled: true,
                price: true,
                createdBy: {
                    select: {
                        name: true
                    }
                },
                createdById: true,
                meetingCode: true
            },
        });
        const meetings = meeting.map(m => ({
            title: m.title,
            description: m.desc,
            type: m.isPaid ? "Paid" : "Free",
            hostName: m.createdBy.name,
            price: m.price,
            meetingTime: String(m.startingTime),
            isProtected: m.isProtected,
            isInstant: m.isScheduled ? false : true,
            meetingCode: m.meetingCode,
            createdById: m.createdById
        }));
        res.status(201).json({ success: true, message: "Fetched all the meetings", meetings });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "failed to get all the meetings" });
    }
});
exports.getAllMeetings = getAllMeetings;
const deleteMeeting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { meetingCode, userId } = req.body;
        if (!meetingCode || !userId)
            throw new Error("missing meetingCode or userID");
        yield prisma.meeting.delete({
            where: {
                createdById: userId,
                meetingCode: meetingCode,
            }
        });
        res.status(200).json({ success: true, message: "Meeting deleted" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Failed to delete meeting" });
    }
});
exports.deleteMeeting = deleteMeeting;
const isProtectedMeetingValidation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meetingCode = req.query.meetingCode;
        const userId = req.query.userId;
        if (!meetingCode) {
            throw new Error("meetingCode or userId is missing");
        }
        const meeting = yield prisma.meeting.findUnique({
            select: {
                isProtected: true,
                createdById: true
            },
            where: {
                meetingCode: meetingCode,
            }
        });
        let isProtected = meeting === null || meeting === void 0 ? void 0 : meeting.isProtected;
        if (userId === (meeting === null || meeting === void 0 ? void 0 : meeting.createdById))
            isProtected = false;
        res.status(201).json({ success: true, isProtected });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Failed to validate meeting" });
    }
});
exports.isProtectedMeetingValidation = isProtectedMeetingValidation;
const validateProtectedPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { meetingPassword, meetingCode } = req.body;
        if (!meetingCode || !meetingCode) {
            return res.status(400).json({ success: false, message: "meetingCode, meetingPassword or userId is missing" });
        }
        const meeting = yield prisma.meeting.findUnique({
            select: {
                password: true
            },
            where: {
                meetingCode: meetingCode,
            }
        });
        if (!meeting) {
            throw new Error("Failed to fetch the meeting details");
        }
        if (meeting.password === meetingPassword) {
            res.status(200).json({ success: true, message: "Password is correct", isMatched: true });
        }
        else {
            res.status(401).json({ success: true, message: "Password is incorrect", isMatched: false });
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Failed to validate the protected meeting" });
    }
});
exports.validateProtectedPassword = validateProtectedPassword;
