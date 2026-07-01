using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class BannerController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public BannerController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ==========================================
        // DANH SÁCH BANNER
        // ==========================================
        public async Task<IActionResult> Index()
        {
            var banners = await _context.Banners
                .OrderBy(b => b.Position)
                .ThenBy(b => b.SortOrder)
                .ToListAsync();
            return View(banners);
        }

        // ==========================================
        // 1. THÊM MỚI BANNER (CREATE)
        // ==========================================
        [HttpGet]
        public IActionResult Create()
        {
            return View(new Banner { Position = "HomeHero", IsActive = true, SortOrder = 0 });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Banner banner, IFormFile? ImageFile)
        {
            if (ImageFile != null && ImageFile.Length > 0)
            {
                ModelState.Remove(nameof(Banner.ImageUrl));
            }

            if (ModelState.IsValid)
            {
                if (ImageFile != null && ImageFile.Length > 0)
                {
                    banner.ImageUrl = await SaveImageAsync(ImageFile);
                }
                else
                {
                    ModelState.AddModelError("ImageUrl", "Vui lòng chọn ảnh banner.");
                    return View(banner);
                }

                banner.CreatedAt = DateTime.Now;
                banner.UpdatedAt = DateTime.Now;

                _context.Banners.Add(banner);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            return View(banner);
        }

        // ==========================================
        // 2. CHỈNH SỬA BANNER (EDIT)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            return View(banner);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Banner banner, IFormFile? ImageFile)
        {
            if (id != banner.Id) return NotFound();

            ModelState.Remove(nameof(Banner.ImageUrl));

            if (ModelState.IsValid)
            {
                var existingBanner = await _context.Banners.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
                if (existingBanner == null) return NotFound();

                if (ImageFile != null && ImageFile.Length > 0)
                {
                    // Xóa ảnh cũ
                    DeleteImageFile(existingBanner.ImageUrl);
                    // Lưu ảnh mới
                    banner.ImageUrl = await SaveImageAsync(ImageFile);
                }
                else
                {
                    // Giữ lại ảnh cũ
                    banner.ImageUrl = existingBanner.ImageUrl;
                }

                banner.CreatedAt = existingBanner.CreatedAt;
                banner.UpdatedAt = DateTime.Now;

                _context.Banners.Update(banner);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            return View(banner);
        }

        // ==========================================
        // 3. XÓA BANNER (DELETE)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var banner = await _context.Banners.FirstOrDefaultAsync(m => m.Id == id);
            if (banner == null) return NotFound();

            return View(banner);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner != null)
            {
                // Xóa ảnh trên server
                DeleteImageFile(banner.ImageUrl);
                _context.Banners.Remove(banner);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        // ==========================================
        // HÀM HỖ TRỢ: Lưu ảnh vào thư mục wwwroot/uploads/banners
        // ==========================================
        private async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "banners");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            return "/uploads/banners/" + uniqueFileName;
        }

        // HÀM HỖ TRỢ: Xóa file ảnh khỏi server
        private void DeleteImageFile(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return;
            var filePath = Path.Combine(_env.WebRootPath, imageUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
    }
}
