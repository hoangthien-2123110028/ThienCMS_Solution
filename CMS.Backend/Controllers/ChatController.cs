using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // DANH SÁCH CUỘC HỘI THOẠI (INDEX)
        // ==========================================
        public async Task<IActionResult> Index()
        {
            // Lấy danh sách khách hàng có tin nhắn, nhóm theo khách hàng
            var conversations = await _context.ChatMessages
                .Include(m => m.Customer)
                .GroupBy(m => m.CustomerId)
                .Select(g => new ConversationViewModel
                {
                    CustomerId = g.Key,
                    CustomerName = g.First().Customer!.FullName,
                    CustomerEmail = g.First().Customer!.Email,
                    LastMessage = g.OrderByDescending(m => m.SentAt).First().Content,
                    LastMessageTime = g.Max(m => m.SentAt),
                    UnreadCount = g.Count(m => !m.IsFromAdmin && !m.IsRead),
                    TotalMessages = g.Count()
                })
                .OrderByDescending(c => c.LastMessageTime)
                .ToListAsync();

            return View(conversations);
        }

        // ==========================================
        // CHI TIẾT HỘI THOẠI VỚI 1 KHÁCH HÀNG
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Conversation(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            // Đánh dấu tất cả tin nhắn từ khách hàng là đã đọc
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.CustomerId == id && !m.IsFromAdmin && !m.IsRead)
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
            }
            await _context.SaveChangesAsync();

            var messages = await _context.ChatMessages
                .Where(m => m.CustomerId == id)
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            ViewBag.Customer = customer;
            return View(messages);
        }

        // ==========================================
        // ADMIN GỬI TIN NHẮN TRẢ LỜI
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Reply(int customerId, string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return RedirectToAction("Conversation", new { id = customerId });

            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null) return NotFound();

            var message = new ChatMessage
            {
                CustomerId = customerId,
                Content = content.Trim(),
                SentAt = DateTime.Now,
                IsFromAdmin = true,
                IsRead = false
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            return RedirectToAction("Conversation", new { id = customerId });
        }

        // ==========================================
        // API: Lấy tin nhắn mới (cho AJAX polling)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetNewMessages(int customerId, int lastMessageId)
        {
            var messages = await _context.ChatMessages
                .Where(m => m.CustomerId == customerId && m.Id > lastMessageId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    sentAt = m.SentAt.ToString("HH:mm dd/MM"),
                    m.IsFromAdmin
                })
                .ToListAsync();

            // Đánh dấu tin nhắn từ khách là đã đọc
            var unread = await _context.ChatMessages
                .Where(m => m.CustomerId == customerId && !m.IsFromAdmin && !m.IsRead)
                .ToListAsync();
            foreach (var msg in unread) msg.IsRead = true;
            await _context.SaveChangesAsync();

            return Json(messages);
        }

        // ==========================================
        // API: Đếm tổng tin nhắn chưa đọc (cho sidebar badge)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetTotalUnreadCount()
        {
            var count = await _context.ChatMessages
                .CountAsync(m => !m.IsFromAdmin && !m.IsRead);

            return Json(new { count });
        }
    }

    // ViewModel cho danh sách hội thoại
    public class ConversationViewModel
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = "";
        public string CustomerEmail { get; set; } = "";
        public string LastMessage { get; set; } = "";
        public DateTime LastMessageTime { get; set; }
        public int UnreadCount { get; set; }
        public int TotalMessages { get; set; }
    }
}
