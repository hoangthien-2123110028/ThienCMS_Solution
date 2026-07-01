
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Data.Entities
{
    // Tin nhắn chat giữa khách hàng và admin
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime SentAt { get; set; } = DateTime.Now;

        // true = admin gửi, false = khách hàng gửi
        public bool IsFromAdmin { get; set; }

        // Trạng thái đã đọc
        public bool IsRead { get; set; } = false;

        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }
    }
}
