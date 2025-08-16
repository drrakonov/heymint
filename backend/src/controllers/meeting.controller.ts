import { StreamClient, UserRequest } from "@stream-io/node-sdk"
import { Request, Response } from "express";


const getStreamApiKey = process.env.STREAM_API_KEY!;
const getStreamApiSecret = process.env.STREAM_SECRET_KEY!;

const client = new StreamClient(getStreamApiKey, getStreamApiSecret);

export const createGetStreamToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, name } = req.body;
        if(!userId) {
           return res.status(400).json({ success: false, message: "UserId not found" }); 
        }

        const newUser: UserRequest = {
            name: name || "unknown",
            id: userId,
            role: 'user'
        }

        await client.upsertUsers([newUser]);
        const validity = 60 * 60;

        const token = client.generateUserToken({
            user_id: userId,
            validity_in_seconds: validity
        });

        const apiKey = getStreamApiKey;
        res.status(200).json({ success: true, message: "Token generated successfully", token, apiKey })

    }catch(err) {
        return res.status(500).json({ success: false, message: "get stream token generation failed" })
    }
}