using Microsoft.AspNetCore.Authorization;
using CMS.Data;
using CMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class CategoryProductController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CategoryProductController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ==========================================
        // DANH SÁCH DANH MỤC SẢN PHẨM (INDEX)
        // ==========================================
        public async Task<IActionResult> Index()
        {
            var data = await _context.CategoryProducts.ToListAsync();
            return View(data);
        }

        // ==========================================
        // 1. CHỨC NĂNG THÊM MỚI (CREATE)
        // ==========================================
        [HttpGet]
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CategoryProduct categoryProduct, IFormFile? ImageFile)
        {
            ModelState.Remove("Products");

            if (ModelState.IsValid)
            {
                if (ImageFile != null && ImageFile.Length > 0)
                {
                    categoryProduct.ImageUrl = await SaveImageAsync(ImageFile);
                }

                _context.CategoryProducts.Add(categoryProduct);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(categoryProduct);
        }

        // ==========================================
        // 2. CHỨC NĂNG SỬA (EDIT)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var categoryProduct = await _context.CategoryProducts.FindAsync(id);
            if (categoryProduct == null) return NotFound();

            return View(categoryProduct);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, CategoryProduct categoryProduct, IFormFile? ImageFile)
        {
            if (id != categoryProduct.Id) return NotFound();

            ModelState.Remove("Products");

            if (ModelState.IsValid)
            {
                if (ImageFile != null && ImageFile.Length > 0)
                {
                    // Xóa ảnh cũ
                    var existing = await _context.CategoryProducts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
                    if (existing != null && !string.IsNullOrEmpty(existing.ImageUrl))
                    {
                        DeleteImageFile(existing.ImageUrl);
                    }

                    categoryProduct.ImageUrl = await SaveImageAsync(ImageFile);
                }

                _context.CategoryProducts.Update(categoryProduct);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(categoryProduct);
        }

        // ==========================================
        // 3. CHỨC NĂNG XÓA (DELETE)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var categoryProduct = await _context.CategoryProducts
                .FirstOrDefaultAsync(m => m.Id == id);

            if (categoryProduct == null) return NotFound();

            return View(categoryProduct);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var categoryProduct = await _context.CategoryProducts.FindAsync(id);
            if (categoryProduct != null)
            {
                if (!string.IsNullOrEmpty(categoryProduct.ImageUrl))
                {
                    DeleteImageFile(categoryProduct.ImageUrl);
                }
                _context.CategoryProducts.Remove(categoryProduct);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        // ==========================================
        // HÀM HỖ TRỢ: Lưu ảnh vào thư mục wwwroot/uploads/categories
        // ==========================================
        private async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "categories");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            return "/uploads/categories/" + uniqueFileName;
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
