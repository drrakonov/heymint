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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const chunker_1 = require("./src/utils/chunker");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Looking for a summarized meeting to retroactively chunk...");
        const summary = yield prisma.summary.findFirst({
            where: { transcription: { not: "Empty" } },
            orderBy: { id: 'desc' }
        });
        if (!summary) {
            console.log("No existing meeting found with a transcription. Please record a new meeting in the app!");
            return;
        }
        console.log(`Found meeting ${summary.meetingId}. Chunking now...`);
        yield (0, chunker_1.chunkTheTranscription)(summary.meetingId);
        console.log("✅ Chunking complete! Now running the chat test...");
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
