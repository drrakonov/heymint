import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string) => {
  try {
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
    const JWT_ACCESS_EXPIRES_IN = "15m";

    if (!JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not defined");
    }

    return jwt.sign(
      { userId },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    );
  } catch (err) {
    console.error("Failed to generate accesss token", err)
    throw new Error("Access token generation failed");
  }
};


export const generateRefreshToken = (userId: string) => {
  try {
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    const JWT_REFRESH_EXPIRES_IN = "7d";

    if (!JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not defined");
    }

    return jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
  } catch (err) {
    console.error("Failed to generate refresh token", err);
    throw new Error("Refresh token generation failed");
  }
}


export const verifyRefreshToken = (token: string) => {
  try {
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    return jwt.verify(token, JWT_REFRESH_SECRET!);
  } catch (err) {
    console.error("Something went wrong in verification of refresh token", err);
    throw new Error("verification of refresh token is failed")
  }
}