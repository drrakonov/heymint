import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (to: string, otp: string) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "",
    to,
    subject: "Verify your email – HeyMint",
    html: `
      <div style="margin:0; padding:0; font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; background-color:#f3f4f6; padding:30px;">
        <div style="max-width:500px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; padding:36px; box-shadow:0 6px 16px rgba(0,0,0,0.08);">
          
          <!-- Logo / App Name -->
          <div style="text-align:center; margin-bottom:24px;">
            <span style="display:inline-block; font-size:20px; font-weight:700; color:#29B184;">HeyMint</span>
          </div>

          <!-- Greeting -->
          <h2 style="margin:0 0 14px 0; font-size:22px; font-weight:600; color:#111827; text-align:center;">
            Confirm your email
          </h2>
          <p style="margin:0 0 20px 0; font-size:15px; color:#374151; text-align:center;">
            Welcome to HeyMint 🎉 Please use the code below to verify your account.
          </p>

          <!-- OTP Box -->
          <div style="background:#f9fafb; border:2px dashed #29B184; border-radius:10px; padding:22px; text-align:center; margin:24px 0;">
            <span style="font-size:30px; letter-spacing:8px; font-weight:700; color:#1f2937;">${otp}</span>
          </div>

          <!-- Expiry Info -->
          <p style="margin:0 0 22px 0; font-size:14px; color:#4b5563; text-align:center;">
            This code will expire in <strong>${process.env.OTP_EXPIRY_MINUTES} minute${process.env.OTP_EXPIRY_MINUTES === "1" ? "" : "s"}</strong>.
          </p>

          <!-- Footer Note -->
          <p style="margin:0 0 16px 0; font-size:13px; color:#9ca3af; text-align:center;">
            Didn’t request this? You can safely ignore this email.
          </p>

          <!-- Signature -->
          <div style="border-top:1px solid #e5e7eb; padding-top:16px; margin-top:28px; text-align:center;">
            <p style="margin:0; font-size:14px; color:#374151;">Thanks for joining,</p>
            <p style="margin:0; font-size:14px; font-weight:600; color:#111827;">– The HeyMint Team</p>
          </div>

        </div>
      </div>
    `,
  });

  return { data, error };
};
