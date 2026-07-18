import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Bắt buộc dùng IPv4 để tránh lỗi ENETUNREACH trên các Server không hỗ trợ IPv6 (như Render)
  ...({ family: 4 } as any),
});

export const sendResetPasswordEmail = async (to: string, token: string) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Manwok Support" <${process.env.SMTP_USER}>`,
    to,
    subject: "Yêu cầu khôi phục mật khẩu - Manwok",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Khôi phục mật khẩu Manwok</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Manwok liên kết với email này.</p>
        <p>Vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu. Link này sẽ hết hạn sau 1 giờ.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Đặt Lại Mật Khẩu
          </a>
        </div>
        <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Đội ngũ Manwok</p>
      </div>
    `,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("Chưa cấu hình SMTP_USER và SMTP_PASS, in ra console để test: ", resetUrl);
      return true; // Pretend it sent
    }
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};
