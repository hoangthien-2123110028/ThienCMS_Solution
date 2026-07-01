using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/chat/{customerId}
        // Lấy lịch sử tin nhắn của khách hàng
        [HttpGet("{customerId}")]
        public async Task<IActionResult> GetMessages(int customerId)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null)
                return NotFound(new { message = "Khách hàng không tồn tại." });

            var messages = await _context.ChatMessages
                .Where(m => m.CustomerId == customerId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.SentAt,
                    m.IsFromAdmin,
                    m.IsRead
                })
                .ToListAsync();

            return Ok(messages);
        }

        // POST: api/chat
        // Khách hàng gửi tin nhắn mới
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { message = "Nội dung tin nhắn không được để trống." });

            var customer = await _context.Customers.FindAsync(request.CustomerId);
            if (customer == null)
                return NotFound(new { message = "Khách hàng không tồn tại." });

            var message = new ChatMessage
            {
                CustomerId = request.CustomerId,
                Content = request.Content.Trim(),
                SentAt = DateTime.Now,
                IsFromAdmin = false,
                IsRead = false
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message.Id,
                message.Content,
                message.SentAt,
                message.IsFromAdmin,
                message.IsRead
            });
        }

        // GET: api/chat/{customerId}/unread-count
        // Đếm số tin nhắn chưa đọc (từ admin gửi cho khách)
        [HttpGet("{customerId}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(int customerId)
        {
            var count = await _context.ChatMessages
                .CountAsync(m => m.CustomerId == customerId && m.IsFromAdmin && !m.IsRead);

            return Ok(new { unreadCount = count });
        }

        // POST: api/chat/{customerId}/mark-read
        // Đánh dấu đã đọc tất cả tin nhắn từ admin
        [HttpPost("{customerId}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int customerId)
        {
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.CustomerId == customerId && m.IsFromAdmin && !m.IsRead)
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { markedCount = unreadMessages.Count });
        }
    }

    // Request model
    public class SendChatRequest
    {
        public int CustomerId { get; set; }
        public string Content { get; set; } = "";
    }
}
