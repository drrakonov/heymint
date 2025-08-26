"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetingInputType = void 0;
const zod_1 = require("zod");
exports.meetingInputType = zod_1.z.object({
    title: zod_1.z.string().min(2, "title must contain atleast two characters").max(500, "title can have only 500 characters maximum"),
    description: zod_1.z.string().max(100, "description can have only 1000 characters maximum"),
    isScheduled: zod_1.z.boolean(),
    isPaid: zod_1.z.boolean(),
    isProtected: zod_1.z.boolean(),
    startingTime: zod_1.z.coerce.date(),
    price: zod_1.z.number(),
    createdBy: zod_1.z.uuid(),
    password: zod_1.z.string().max(30),
    meetingCode: zod_1.z.string()
});
