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
exports.validateJoinAccess = exports.validateProtectedPassword = exports.isProtectedMeetingValidation = exports.deleteMeeting = exports.getAllBookedMeetings = exports.getAllMeetings = exports.handleMeetingSetup = exports.createGetStreamToken = void 0;
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
        const { userId } = req.query;
        const meeting = yield prisma.meeting.findMany({
            select: {
                id: true,
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
        const meetingPurchased = yield prisma.meetingPurchase.findMany({
            where: {
                userId: String(userId)
            },
            select: { meetingId: true }
        });
        const meetings = meeting.map(m => ({
            meetingId: m.id,
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
        const purchases = meetingPurchased.map(p => p.meetingId);
        res.status(201).json({ success: true, message: "Fetched all the meetings", meetings, purchases });
    }
    catch (err) {
        console.log("Failed to get meetings", err);
        return res.status(500).json({ success: false, message: "failed to get all the meetings" });
    }
});
exports.getAllMeetings = getAllMeetings;
const getAllBookedMeetings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        if (!userId) {
            throw new Error("userId not found");
        }
        const purchasedMeetings = yield prisma.meetingPurchase.findMany({
            where: {
                userId: String(userId)
            },
            include: {
                meeting: {
                    include: {
                        createdBy: true
                    }
                }
            }
        });
        const bookings = purchasedMeetings.map((b) => ({
            meetingId: b.meeting.id,
            title: b.meeting.title,
            hostName: b.meeting.createdBy.name,
            description: b.meeting.desc,
            price: b.meeting.price,
            isProtected: b.meeting.isProtected,
            meetingTime: String(b.meeting.startingTime),
            meetingCode: b.meeting.meetingCode,
            isInstant: b.meeting.isScheduled ? false : true,
            createdById: b.meeting.createdById
        }));
        res.status(201).json({ success: true, message: "All booked meetings", bookings });
    }
    catch (err) {
        console.log("Failed to get booked meetings", err);
        return res.status(500).json({ success: false, message: "Failed to get booked meetings" });
    }
});
exports.getAllBookedMeetings = getAllBookedMeetings;
const deleteMeeting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { meetingCode, userId } = req.body;
        if (!meetingCode || !userId)
            throw new Error("missing meetingCode or userID");
        const meeting = yield prisma.meeting.findUnique({
            where: { meetingCode },
        });
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }
        if (meeting.createdById !== userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this meeting" });
        }
        yield prisma.$transaction([
            prisma.meetingPurchase.deleteMany({ where: { meetingId: meeting.id } }),
            prisma.payment.deleteMany({ where: { meetingId: meeting.id } }),
            prisma.meeting.delete({ where: { id: meeting.id } }),
        ]);
        res.status(200).json({ success: true, message: "Meeting and related records deleted successfully" });
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
const validateJoinAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, meetingCode } = req.query;
    try {
        if (!userId || !meetingCode)
            throw new Error("userId or meetingCode not found");
        const meeting = yield prisma.meeting.findUnique({
            where: { meetingCode: String(meetingCode) }
        });
        if (!meeting) {
            return res.json({ success: false, message: "Meeting does not exists" });
        }
        if (meeting.isPaid) {
            const purchase = yield prisma.meetingPurchase.findFirst({
                where: {
                    userId: String(userId),
                    meeting: {
                        meetingCode: String(meetingCode)
                    }
                }
            });
            if (!purchase) {
                return res.json({ success: false, message: "Meeting is not purchased" });
            }
        }
        res.status(200).json({ success: true, message: "Can join" });
    }
    catch (err) {
        console.log("Failed to validate the access to join the meeting", err);
        return res.status(500).json({ success: false, message: "Failed to validate join access" });
    }
});
exports.validateJoinAccess = validateJoinAccess;
