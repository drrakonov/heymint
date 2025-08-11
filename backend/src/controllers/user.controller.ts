import { PrismaClient } from "@prisma/client"
import { Response } from "express"

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


export const updateUserProfile = async (req: any, res: Response): Promise<any> => {
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