using Microsoft.AspNetCore.Authorization;
using CMS.Data;           // Để hiểu ApplicationDbContext
using CMS.Data.Entities;  // Để hiểu 'Post' và 'Category'
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore; // Để hiểu 'Include' và 'ToListAsync'
using System.Threading.Tasks;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class PostController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        // Tiêm DbContext và IWebHostEnvironment vào thông qua Constructor
        public PostController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // Action Index: Trả về danh sách bài viết ra giao diện
        public async Task<IActionResult> Index()
        {
            // Lấy danh sách bài viết, kèm theo thông tin Category để biết bài đó thuộc mục nào
            var posts = await _context.Posts.Include(p => p.Category).ToListAsync();
            return View(posts);
        }

        // ==========================================
        // XEM CHI TIẾT BÀI VIẾT (DETAILS)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var post = await _context.Posts
                .Include(p => p.Category)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (post == null) return NotFound();

            return View(post);
        }

        [HttpGet]
        public IActionResult Create()
        {
            // Sử dụng gán trực tiếp vào ViewBag thay vì ViewData để đồng bộ với View của bạn
            ViewBag.CategoryId = new SelectList(_context.Categories, "Id", "Name");

            return View();
        }
        // Xử lý dữ liệu khi người dùng bấm nút "Lưu bài viết"
        [HttpPost]
        [ValidateAntiForgeryToken] // Bảo mật chống giả mạo request
        public async Task<IActionResult> Create(Post post, IFormFile? ImageFile)
        {
            // Kiểm tra xem dữ liệu người dùng nhập có hợp lệ không (đã điền đủ các trường bắt buộc chưa)
            if (ModelState.IsValid)
            {
                // Xử lý upload ảnh nếu người dùng có chọn file
                if (ImageFile != null && ImageFile.Length > 0)
                {
                    post.ImageUrl = await SaveImageAsync(ImageFile);
                }

                // Thêm bài viết mới vào bộ nhớ đệm của Entity Framework
                _context.Posts.Add(post);

                // Lưu thay đổi xuống SQL Server
                await _context.SaveChangesAsync();

                // Lưu thành công thì chuyển hướng về trang danh sách (Index)
                return RedirectToAction(nameof(Index));
            }

            // NẾU CÓ LỖI (Ví dụ: quên nhập tiêu đề): 
            // Phải nạp lại danh sách chuyên mục cho Dropdown để trả về View hiện lại form, nếu không sẽ bị lỗi null như ban nãy
            ViewBag.CategoryId = new SelectList(_context.Categories, "Id", "Name", post.CategoryId);

            return View(post);
        }
        // 1. GET: Hiển thị form Sửa bài viết (kèm dữ liệu cũ)
        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound(); // Báo lỗi nếu không có ID trên đường dẫn
            }

            // Tìm bài viết trong Database dựa vào ID
            var post = await _context.Posts.FindAsync(id);
            if (post == null)
            {
                return NotFound(); // Báo lỗi nếu không tìm thấy bài viết
            }

            // Nạp danh sách chuyên mục cho Dropdown, và chọn sẵn chuyên mục cũ của bài viết
            ViewBag.CategoryId = new SelectList(_context.Categories, "Id", "Name", post.CategoryId);

            return View(post); // Truyền dữ liệu bài viết cũ sang cho View hiển thị
        }

        // 2. POST: Xử lý lưu dữ liệu khi bấm nút "Lưu thay đổi"
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Post post, IFormFile? ImageFile)
        {
            // Kiểm tra xem ID trên thanh địa chỉ có khớp với ID của bài viết gửi lên không (bảo mật)
            if (id != post.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                // Xử lý upload ảnh mới nếu người dùng chọn file mới
                if (ImageFile != null && ImageFile.Length > 0)
                {
                    // Xóa ảnh cũ nếu có
                    if (!string.IsNullOrEmpty(post.ImageUrl))
                    {
                        DeleteImage(post.ImageUrl);
                    }

                    // Lưu ảnh mới
                    post.ImageUrl = await SaveImageAsync(ImageFile);
                }

                // Cập nhật thông tin mới vào Entity Framework
                _context.Posts.Update(post);

                // Lưu xuống SQL Server
                await _context.SaveChangesAsync();

                return RedirectToAction(nameof(Index)); // Sửa xong thì quay về trang danh sách
            }

            // Nếu có lỗi nhập liệu (VD: để trống tiêu đề), thì nạp lại danh sách Category và hiện lại form
            ViewBag.CategoryId = new SelectList(_context.Categories, "Id", "Name", post.CategoryId);
            return View(post);
        }
        // 1. GET: Hiển thị trang xác nhận Xóa
        [HttpGet]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            // Lấy bài viết ra kèm theo thông tin Category để hiển thị cho rõ ràng
            var post = await _context.Posts
                .Include(p => p.Category)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (post == null)
            {
                return NotFound();
            }

            return View(post); // Trả dữ liệu sang trang xác nhận xóa
        }

        // 2. POST: Thực hiện lệnh xóa thật sự trong Database
        [HttpPost, ActionName("Delete")] // ActionName giúp URL vẫn giữ nguyên là /Post/Delete
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            // Tìm bài viết cần xóa
            var post = await _context.Posts.FindAsync(id);

            if (post != null)
            {
                // Xóa file ảnh trên server nếu có
                if (!string.IsNullOrEmpty(post.ImageUrl))
                {
                    DeleteImage(post.ImageUrl);
                }

                // Xóa khỏi bộ nhớ đệm
                _context.Posts.Remove(post);
                // Lưu thay đổi xuống SQL Server
                await _context.SaveChangesAsync();
            }

            // Xóa xong thì quay về trang danh sách
            return RedirectToAction(nameof(Index));
        }

        // ==========================================
        // HÀM HỖ TRỢ: Lưu ảnh vào thư mục wwwroot/uploads/posts
        // ==========================================
        private async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            // Tạo thư mục uploads/posts nếu chưa tồn tại
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "posts");
            Directory.CreateDirectory(uploadsFolder);

            // Tạo tên file duy nhất để tránh trùng lặp
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Lưu file vào thư mục
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            // Trả về đường dẫn tương đối để lưu vào Database
            return "/uploads/posts/" + uniqueFileName;
        }

        // HÀM HỖ TRỢ: Xóa file ảnh khỏi server
        private void DeleteImage(string imageUrl)
        {
            var filePath = Path.Combine(_env.WebRootPath, imageUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
    }
}