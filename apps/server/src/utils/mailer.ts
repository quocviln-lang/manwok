export const sendResetPasswordEmail = async (to: string, token: string) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  const senderEmail = process.env.SMTP_USER || "noreply@manwok.com";
  
  const htmlContent = `
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
  `;

  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn("Chưa cấu hình BREVO_API_KEY, in ra console để test: ", resetUrl);
      return true; // Pretend it sent for local dev
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "Manwok Support" },
        to: [{ email: to }],
        subject: "Yêu cầu khôi phục mật khẩu - Manwok",
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error: ", errorData);
      return false;
    }

    console.log("Email sent successfully via Brevo API");
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};
