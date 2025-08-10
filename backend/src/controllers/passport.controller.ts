import { PrismaClient } from "@prisma/client";
import passport, { Profile } from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
},
    async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void,
    ) => {
        try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value
            
            //if email is not present in the profile object
            if(!email) return done(new Error("No email found from Google"), null);

            //find user with googleId
            let user = await prisma.user.findUnique({ where: { googleId } });
            if(user) return done(null, user);

            //find user with email
            user = await prisma.user.findUnique({ where: { email } });
            if(user) {
                user = await prisma.user.update( {
                    where: { email },
                    data: {
                        googleId,
                        provider: "google",
                        name: user.name === "user" ? profile.displayName : user.name,
                    }
                });
                return done(null, user);
            }

            user = await prisma.user.create({
                data: {
                    googleId,
                    name: profile.displayName,
                    email,
                    provider: "google"
                },
            })
            return done(null, user);

        }catch(err) {
            return done(err as any, null);
        }
    }
));

passport.serializeUser((user, done)=> done(null, user));
passport.deserializeUser((obj, done) => done(null, obj as Express.User));

export default passport;