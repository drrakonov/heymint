import { isMeetingExpired } from "../utils/meetingLifecycle";
import { PrismaClient } from "@prisma/client"
import { Response, Request } from "express"
import { DashboardMyMeetings, DashboardStats } from "../utils/Types";

const prisma = new PrismaClient();


export const getUserInfo = async (req: any, res: Response): Promise<any> => {
    try {
        const user = await prisma.user.findUnique({ 
            where: { id: req.user.id },
            select: { name: true, email: true, provider: true, id: true },
        })

        if(!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.json(user);
    } catch(err) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const getDashboardStats = async (req: any, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;

        if(!userId) {
            return res.status(401).json({ success: false, message: "user not authenticated" });

        }

        const [totalMeetings, myTotalMeetings, completedMeetings, protectedMeetings, activeUsers] = await Promise.all([
            prisma.meeting.count({
                where: { isDeleted: false }
            }),
            prisma.meeting.count({
                where: {
                    createdById: userId,
                    isDeleted: false
                }
            }),
            prisma.meeting.count({
                where: {
                    createdById: userId,
                    isComplete: true
                }
            }),
            prisma.meeting.count({
                where: {
                    createdById: userId,
                    isProtected: true,
                    isDeleted: false
                }
            }),
            prisma.user.count()
        ]);

        const dashboardStats: DashboardStats = {
            completedMeetings,
            myTotalMeetings,
            protectedMeetings,
            totalMeetings,
            activeUsers
        }
        
        return res.status(200).json({ success: true, message: "Dashboard stats", dashboardStats });


    }catch(err) {
        console.log("Failed to get dashboad info", err);
        return res.status(500).json({ success: false, message: "Failed to get the dashboard info!" });
    }
}


export const getAllMeetingToDashboard = async (req: any, res: Response): Promise<any> => {
    try {
        const userId = req.user.id;

        if(!userId) {
            return res.status(401).json({ success: false, message: "user not authenticated" })
        }

        const meetingsResult = await prisma.meeting.findMany({
            where: {
                createdById: userId,
                isComplete: false,
                isDeleted: false
            },
            select: {
                isProtected: true,
                isScheduled: true,
                startingTime: true,
                startedAt: true,
                isComplete: true,
                title: true,
                id: true
            }
        });

        const myMeetings: DashboardMyMeetings[] = meetingsResult.filter(meeting => !isMeetingExpired(meeting)).map((meeting : any) => ({
            title: meeting.title,
            id: meeting.id,
            type: meeting.isProtected ? "protected" : "free"
        }));

        return res.status(200).json({ success: true, message: "all my meetings", myMeetings });

    }catch(err) {
        console.log("Failed to get all the meetings", err);
        return res.status(500).json({ success: false, messgae: "Failed to get the meetigns" })
    }
}


export const updateUserProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { newName, id } = req.body;
        if(!newName || !id) return res.status(400).json({ success: false, message: "All fields are required" });
        const user = await prisma.user.update({
            where: {
                id,
            }, 
            data: {
                name: newName
            },
        })
        
        return res.status(200).json({ success: true, message: "Profile updated successfully" });

    }catch(err) {
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}
