const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Clearing old meetings and related data...");
    await prisma.summary.deleteMany({});
    await prisma.meetingPurchase.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.meeting.deleteMany({});
    console.log("Database flushed!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
