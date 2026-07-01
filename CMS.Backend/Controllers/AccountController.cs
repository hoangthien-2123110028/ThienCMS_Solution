using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using System.Security.Claims;

namespace CMS.Backend.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // TRANG ĐĂNG NHẬP (GET)
        // ==========================================
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            // Nếu đã đăng nhập rồi thì chuyển về Dashboard
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }

            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        // ==========================================
        // XỬ LÝ ĐĂNG NHẬP (POST)
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(string username, string password, string? returnUrl = null)
        {
            // Kiểm tra username và password không được để trống
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                ViewData["Error"] = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
                return View();
            }

            // Tìm user trong database theo username
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            // Kiểm tra user có tồn tại và mật khẩu có đúng không
            if (user == null || user.PasswordHash != password)
            {
                ViewData["Error"] = "Tên đăng nhập hoặc mật khẩu không chính xác!";
                return View();
            }

            // ==========================================
            // TẠO CLAIMS CHO NGƯỜI DÙNG
            // Claims là các "thông tin xác nhận" về người dùng
            // ==========================================
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Username),           // Tên đăng nhập
                new Claim(ClaimTypes.Role, user.Role),               // Vai trò (Admin/Editor)
                new Claim("FullName", user.FullName),                // Họ tên đầy đủ
                new Claim("UserId", user.Id.ToString())              // ID người dùng
            };

            // Tạo ClaimsIdentity từ danh sách Claims
            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            // Cấu hình thuộc tính Authentication (ghi nhớ đăng nhập)
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true, // Ghi nhớ đăng nhập (cookie tồn tại sau khi đóng trình duyệt)
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8) // Hết hạn sau 8 giờ
            };

            // THỰC HIỆN ĐĂNG NHẬP: Ghi cookie xác thực vào trình duyệt
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            // Chuyển hướng về trang trước đó hoặc Dashboard
            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Home");
        }

        // ==========================================
        // ĐĂNG XUẤT
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            // Xóa cookie xác thực khỏi trình duyệt
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // Chuyển về trang đăng nhập
            return RedirectToAction("Login", "Account");
        }

        // ==========================================
        // TRANG TỪ CHỐI TRUY CẬP (403)
        // ==========================================
        [HttpGet]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}
