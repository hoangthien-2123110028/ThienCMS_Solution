using System;
using System.ComponentModel.DataAnnotations;

namespace CMS.Data.Entities
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Code { get; set; } = string.Empty; // Mã OTP 6 số

        public DateTime ExpiresAt { get; set; } // Hết hạn sau 15 phút

        public bool IsUsed { get; set; } = false; // Đã sử dụng chưa
    }
}
