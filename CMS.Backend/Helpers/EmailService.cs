using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace CMS.Backend.Helpers
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private SmtpClient CreateSmtpClient()
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "";
            var senderPassword = _configuration["EmailSettings:SenderPassword"] ?? "";

            var client = new SmtpClient(smtpHost)
            {
                Port = smtpPort,
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            return client;
        }

        private MailMessage CreateMailMessage(string toEmail, string subject, string htmlBody)
        {
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "";
            var senderName = _configuration["EmailSettings:SenderName"] ?? "Nàng Quýt Pet Shop";

            var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);
            return message;
        }

        // ==========================================
        // GỬI MÃ OTP QUÊN MẬT KHẨU
        // ==========================================
        public async Task SendPasswordResetEmailAsync(string toEmail, string code)
        {
            var subject = "🐾 Mã xác thực đặt lại mật khẩu - Nàng Quýt Pet Shop";
            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #FEF3C7; }}
    .container {{ max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(217, 119, 6, 0.15); border: 1px solid #FDE68A; }}
    .header {{ background: linear-gradient(135deg, #F59E0B, #D97706); padding: 35px 32px; text-align: center; }}
    .header h1 {{ color: #fff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }}
    .header p {{ color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 500; }}
    .body {{ padding: 32px; background: #ffffff; }}
    .body p {{ color: #4B5563; line-height: 1.6; margin: 0 0 16px; font-size: 15px; }}
    .code-box {{ background: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 16px; text-align: center; padding: 24px; margin: 24px 0; }}
    .code {{ font-size: 38px; font-weight: 800; color: #B45309; letter-spacing: 8px; font-family: 'Courier New', monospace; }}
    .note {{ font-size: 13px; color: #78350F; background: #FEF3C7; padding: 14px 18px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #D97706; }}
    .footer {{ text-align: center; padding: 24px 32px; background: #FFFBEB; color: #92400E; font-size: 12px; border-top: 1px dashed #FDE68A; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>🐾 Nàng Quýt Pet Shop</h1>
      <p>Cửa hàng phụ kiện & thức ăn thú cưng</p>
    </div>
    <div class='body'>
      <p>Xin chào bạn,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Nàng Quýt Pet Shop</strong>. Vui lòng sử dụng mã xác thực dễ thương dưới đây để tiếp tục:</p>
      <div class='code-box'>
        <div class='code'>{code}</div>
      </div>
      <p>Mã này có hiệu lực trong vòng <strong>15 phút</strong>.</p>
      <div class='note'>
        Nếu bạn không thực hiện yêu cầu này, đừng lo lắng nhé! Hãy cứ bỏ qua email này, tài khoản của bạn vẫn được bảo vệ an toàn.
      </div>
    </div>
    <div class='footer'>
      &copy; 2026 Nàng Quýt Pet Shop. All rights reserved.<br/>
      Chúc bạn và bé cưng một ngày ngập tràn niềm vui! 🐶🐱
    </div>
  </div>
</body>
</html>";

            using var client = CreateSmtpClient();
            using var message = CreateMailMessage(toEmail, subject, htmlBody);
            await client.SendMailAsync(message);
        }

        // ==========================================
        // GỬI EMAIL XÁC NHẬN ĐẶT HÀNG
        // ==========================================
        public async Task SendOrderConfirmationEmailAsync(
            string toEmail,
            string customerName,
            int orderId,
            DateTime orderDate,
            string shippingName,
            string shippingPhone,
            string shippingAddress,
            string paymentMethod,
            List<OrderItemInfo> items,
            decimal totalAmount)
        {
            var subject = $"🦴 Xác nhận đơn hàng thành công #{orderId} - Nàng Quýt Pet Shop";

            var itemRows = string.Join("", items.Select(item =>
                $@"<tr>
                    <td style='padding: 12px 16px; border-bottom: 1px solid #FEF3C7; color: #4B5563; font-size: 14px;'>🐾 {item.ProductName}</td>
                    <td style='padding: 12px 16px; border-bottom: 1px solid #FEF3C7; text-align: center; color: #4B5563; font-size: 14px;'>{item.Quantity}</td>
                    <td style='padding: 12px 16px; border-bottom: 1px solid #FEF3C7; text-align: right; color: #4B5563; font-size: 14px;'>{item.UnitPrice:N0}₫</td>
                    <td style='padding: 12px 16px; border-bottom: 1px solid #FEF3C7; text-align: right; font-weight: 600; color: #1F2937; font-size: 14px;'>{(item.Quantity * item.UnitPrice):N0}₫</td>
                  </tr>"
            ));

            var paymentText = paymentMethod == "VNPay" ? "Thanh toán trực tuyến (VNPay)" : "Thanh toán khi nhận hàng (COD)";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #FEF3C7; }}
    .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(217, 119, 6, 0.15); border: 1px solid #FDE68A; }}
    .header {{ background: linear-gradient(135deg, #10B981, #059669); padding: 35px 32px; text-align: center; }}
    .header h1 {{ color: #fff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }}
    .header p {{ color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 500; }}
    .body {{ padding: 32px; }}
    .body p {{ color: #4B5563; line-height: 1.6; margin: 0 0 16px; font-size: 15px; }}
    .order-id {{ background: #E6F4EA; color: #137333; font-weight: 700; padding: 16px; border-radius: 14px; text-align: center; font-size: 18px; margin: 20px 0; border: 1px solid #A3E635; }}
    .info-box {{ background: #FFFBEB; padding: 14px 16px; border-radius: 12px; border: 1px solid #FDE68A; }}
    .info-label {{ font-size: 11px; text-transform: uppercase; color: #B45309; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }}
    .info-value {{ font-size: 14px; color: #1F2937; font-weight: 600; }}
    table {{ width: 100%; border-collapse: collapse; margin: 24px 0; }}
    thead th {{ background: #FFFBEB; padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #78350F; font-weight: 700; text-align: left; border-bottom: 2px solid #FDE68A; }}
    .total-row {{ background: #FEF3C7; }}
    .total-row td {{ padding: 16px; font-weight: 800; font-size: 18px; color: #D97706; border-top: 1px solid #FDE68A; }}
    .footer {{ text-align: center; padding: 24px 32px; background: #FFFBEB; color: #92400E; font-size: 12px; border-top: 1px dashed #FDE68A; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>🎁 Nàng Quýt Pet Shop</h1>
      <p>Đơn hàng cho bé cưng đã được ghi nhận!</p>
    </div>
    <div class='body'>
      <p>Xin chào <strong>{customerName}</strong>,</p>
      <p>Cảm ơn bạn đã tin tưởng lựa chọn sản phẩm tại <strong>Nàng Quýt Pet Shop</strong>! Đơn hàng của bạn đã được hệ thống tiếp nhận và đang được chuẩn bị để giao tới bé cưng sớm nhất.</p>
      
      <div class='order-id'>📦 Mã đơn hàng của bạn: #{orderId}</div>

      <table cellpadding='0' cellspacing='0' style='width: 100%;'>
        <tr>
          <td style='padding: 0 6px 0 0; vertical-align: top; width: 50%;'>
            <div class='info-box'>
              <div class='info-label'>👤 Người nhận hàng</div>
              <div class='info-value'>{shippingName}</div>
            </div>
          </td>
          <td style='padding: 0 0 0 6px; vertical-align: top; width: 50%;'>
            <div class='info-box'>
              <div class='info-label'>📞 Số điện thoại</div>
              <div class='info-value'>{shippingPhone}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan='2' style='padding: 10px 0 0 0;'>
            <div class='info-box'>
              <div class='info-label'>📍 Địa chỉ giao hàng</div>
              <div class='info-value'>{shippingAddress}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan='2' style='padding: 10px 0 0 0;'>
            <div class='info-box'>
              <div class='info-label'>💳 Phương thức thanh toán</div>
              <div class='info-value'>{paymentText}</div>
            </div>
          </td>
        </tr>
      </table>

      <table>
        <thead>
          <tr>
            <th style='text-align: left;'>Sản phẩm cho bé</th>
            <th style='text-align: center; width: 50px;'>SL</th>
            <th style='text-align: right; width: 100px;'>Đơn giá</th>
            <th style='text-align: right; width: 110px;'>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {itemRows}
        </tbody>
        <tfoot>
          <tr class='total-row'>
            <td colspan='3' style='text-align: right;'>Tổng cộng đơn hàng:</td>
            <td style='text-align: right;'>{totalAmount:N0}₫</td>
          </tr>
        </tfoot>
      </table>

      <p style='font-size: 13px; color: #78350F; font-style: italic; background: #FFFBEB; padding: 10px 14px; border-radius: 8px;'>📅 Ngày đặt hàng: {orderDate:dd/MM/yyyy HH:mm}</p>
    </div>
    <div class='footer'>
      &copy; 2026 Nàng Quýt Pet Shop. All rights reserved.<br/>
      Yêu thương và chăm sóc tốt nhất cho những người bạn bốn chân! 🐶🐱🐰
    </div>
  </div>
</body>
</html>";

            using var client = CreateSmtpClient();
            using var message = CreateMailMessage(toEmail, subject, htmlBody);
            await client.SendMailAsync(message);
        }
    }

    public class OrderItemInfo
    {
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}