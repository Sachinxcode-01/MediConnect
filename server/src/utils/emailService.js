import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Professional email template for verification
const createVerificationEmail = (otp, userName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - MediConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 70px; height: 70px; background: #ffffff; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MediConnect</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">Healthcare Protected</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0 0 15px 0; letter-spacing: -0.5px;">
                Welcome${userName ? `, ${userName}` : ''}!
              </h2>
              <p style="color: #4a4a68; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Let's verify your email address to complete your MediConnect registration.
                Enter the following verification code in the app:
              </p>

              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); border-radius: 16px; padding: 30px; display: inline-block; min-width: 200px;">
                      <p style="color: #667eea; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Your Code</p>
                      <div style="font-size: 42px; font-weight: 800; color: #1a1a2e; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color: #4a4a68; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                This code will expire in <strong>10 minutes</strong>. For your security, do not share this code with anyone.
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; background: #f0f4ff; border-radius: 12px; margin-top: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #667eea; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                      </svg>
                      Security Notice
                    </p>
                    <p style="color: #4a4a68; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you didn't request this verification code, you can safely ignore this email.
                      Your account remains secure with our HIPAA-compliant encryption.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fc; padding: 30px 40px; text-align: center;">
              <p style="color: #8888aa; font-size: 12px; margin: 0 0 10px 0;">
                MediConnect - Secure Healthcare Platform
              </p>
              <p style="color: #aaaacc; font-size: 11px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #aaaacc; font-size: 11px; margin: 10px 0 0 0;">
                &copy; ${new Date().getFullYear()} MediConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Professional email template for OTP login
const createLoginOTPEmail = (otp, userName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Verification - MediConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); min-height: 100vh;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 70px; height: 70px; background: #ffffff; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#11998e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MediConnect</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">Secure Login Verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0 0 15px 0; letter-spacing: -0.5px;">
                Hello${userName ? `, ${userName}` : ''}!
              </h2>
              <p style="color: #4a4a68; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Someone just requested to sign in to your MediConnect account.
                Use the verification code below to complete your login:
              </p>

              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 16px; padding: 30px; display: inline-block; min-width: 200px; border: 2px solid #11998e;">
                      <p style="color: #11998e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Login Code</p>
                      <div style="font-size: 42px; font-weight: 800; color: #0d7377; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color: #4a4a68; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                This code will expire in <strong>10 minutes</strong>.
                <strong>Never share this code with anyone.</strong>
              </p>

              <!-- Security Alert Box -->
              <table role="presentation" style="width: 100%; background: #fff3cd; border-radius: 12px; margin-top: 30px; border-left: 4px solid #ffc107;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #856404; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Didn't request this login?
                    </p>
                    <p style="color: #856404; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you didn't request this code, your account security may be at risk.
                      Please contact our support team immediately and consider changing your password.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Device Info -->
              <table role="presentation" style="width: 100%; background: #f8f9fc; border-radius: 12px; margin-top: 25px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #666688; font-size: 12px; margin: 0;">
                      <strong>Request Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: true })} UTC
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fc; padding: 30px 40px; text-align: center;">
              <p style="color: #8888aa; font-size: 12px; margin: 0 0 10px 0;">
                MediConnect - HIPAA Compliant Healthcare Platform
              </p>
              <p style="color: #aaaacc; font-size: 11px; margin: 0;">
                This is an automated security message. Please do not reply.
              </p>
              <p style="color: #aaaacc; font-size: 11px; margin: 10px 0 0 0;">
                &copy; ${new Date().getFullYear()} MediConnect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Send email function
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MediConnect" <${process.env.SMTP_FROM_EMAIL || 'noreply@mediconnect.com'}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send verification email
export const sendVerificationEmail = async (email, otp, userName) => {
  const html = createVerificationEmail(otp, userName);
  return sendEmail({
    to: email,
    subject: '🔐 Verify Your Email - MediConnect',
    html
  });
};

// Send login OTP email
export const sendLoginOTP = async (email, otp, userName) => {
  const html = createLoginOTPEmail(otp, userName);
  return sendEmail({
    to: email,
    subject: '🔑 Your Login Code - MediConnect',
    html
  });
};
