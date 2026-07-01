using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class ProductController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ==========================================
        // DANH SÁCH SẢN PHẨM + LỌC THEO DANH MỤC
        // ==========================================
        public async Task<IActionResult> Index(int? categoryId)
        {
            // Bắt đầu query từ bảng Products, kèm theo thông tin CategoryProduct
            var query = _context.Products.Include(p => p.Category).Include(p => p.Images).AsQueryable();

            // Nếu người dùng chọn lọc theo danh mục
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryProductId == categoryId);
            }

            var products = await query.ToListAsync();

            // Truyền danh sách danh mục sản phẩm cho dropdown lọc
            ViewBag.Categories = new SelectList(_context.CategoryProducts, "Id", "Name", categoryId);
            ViewBag.CurrentCategoryId = categoryId;

            return View(products);
        }

        // ==========================================
        // 1. CHỨC NĂNG THÊM MỚI (CREATE)
        // ==========================================
        [HttpGet]
        public IActionResult Create()
        {
            // Nạp danh sách danh mục sản phẩm cho Dropdown
            ViewBag.CategoryProducts = new SelectList(_context.CategoryProducts, "Id", "Name");
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Product product, List<IFormFile>? ImageFiles)
        {
            // Loại bỏ kiểm tra các trường không bắt buộc
            ModelState.Remove("Category");
            ModelState.Remove("CategoryProduct");

            if (ModelState.IsValid)
            {
                // Xử lý upload nhiều ảnh
                if (ImageFiles != null && ImageFiles.Count > 0)
                {
                    int sortOrder = 0;
                    foreach (var imageFile in ImageFiles)
                    {
                        if (imageFile.Length > 0)
                        {
                            var imageUrl = await SaveImageAsync(imageFile);

                            // Ảnh đầu tiên làm ảnh đại diện
                            if (sortOrder == 0)
                            {
                                product.ImageUrl = imageUrl;
                            }

                            product.Images.Add(new ProductImage
                            {
                                ImageUrl = imageUrl,
                                SortOrder = sortOrder++
                            });
                        }
                    }
                }

                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            // Nếu có lỗi, nạp lại danh sách danh mục
            ViewBag.CategoryProducts = new SelectList(_context.CategoryProducts, "Id", "Name", product.CategoryProductId);
            return View(product);
        }

        // ==========================================
        // 2. CHỨC NĂNG SỬA (EDIT)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var product = await _context.Products
                .Include(p => p.Images.OrderBy(i => i.SortOrder))
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return NotFound();

            // Nạp danh sách danh mục cho Dropdown, chọn sẵn danh mục cũ
            ViewBag.CategoryProducts = new SelectList(_context.CategoryProducts, "Id", "Name", product.CategoryProductId);
            return View(product);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Product product, List<IFormFile>? ImageFiles)
        {
            if (id != product.Id) return NotFound();

            // Loại bỏ kiểm tra các trường không bắt buộc
            ModelState.Remove("Category");
            ModelState.Remove("CategoryProduct");

            if (ModelState.IsValid)
            {
                // Lấy sản phẩm hiện tại từ DB để so sánh
                var existingProduct = await _context.Products
                    .Include(p => p.Images)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == id);

                // Xử lý upload ảnh mới nếu có
                if (ImageFiles != null && ImageFiles.Count > 0)
                {
                    int maxSortOrder = existingProduct?.Images.Any() == true
                        ? existingProduct.Images.Max(i => i.SortOrder) + 1
                        : 0;

                    foreach (var imageFile in ImageFiles)
                    {
                        if (imageFile.Length > 0)
                        {
                            var imageUrl = await SaveImageAsync(imageFile);
                            _context.ProductImages.Add(new ProductImage
                            {
                                ProductId = id,
                                ImageUrl = imageUrl,
                                SortOrder = maxSortOrder++
                            });
                        }
                    }
                }

                // Cập nhật ảnh đại diện: lấy ảnh đầu tiên
                var firstImage = await _context.ProductImages
                    .Where(pi => pi.ProductId == id)
                    .OrderBy(pi => pi.SortOrder)
                    .FirstOrDefaultAsync();
                product.ImageUrl = firstImage?.ImageUrl ?? product.ImageUrl;

                _context.Products.Update(product);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            ViewBag.CategoryProducts = new SelectList(_context.CategoryProducts, "Id", "Name", product.CategoryProductId);
            return View(product);
        }

        // ==========================================
        // XÓA ẢNH RIÊNG LẺ
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteImage(int imageId, int productId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image != null)
            {
                DeleteImageFile(image.ImageUrl);
                _context.ProductImages.Remove(image);
                await _context.SaveChangesAsync();

                // Cập nhật lại ảnh đại diện
                var firstImage = await _context.ProductImages
                    .Where(pi => pi.ProductId == productId)
                    .OrderBy(pi => pi.SortOrder)
                    .FirstOrDefaultAsync();

                var product = await _context.Products.FindAsync(productId);
                if (product != null)
                {
                    product.ImageUrl = firstImage?.ImageUrl;
                    await _context.SaveChangesAsync();
                }
            }

            return RedirectToAction(nameof(Edit), new { id = productId });
        }

        // ==========================================
        // 3. CHỨC NĂNG XÓA (DELETE)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (product == null) return NotFound();

            return View(product);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product != null)
            {
                // Xóa tất cả file ảnh trên server
                foreach (var image in product.Images)
                {
                    DeleteImageFile(image.ImageUrl);
                }

                // Xóa ảnh đại diện nếu khác với các ảnh trong Images
                if (!string.IsNullOrEmpty(product.ImageUrl))
                {
                    DeleteImageFile(product.ImageUrl);
                }

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        // ==========================================
        // HÀM HỖ TRỢ: Lưu ảnh vào thư mục wwwroot/uploads/products
        // ==========================================
        private async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "products");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Giữ nguyên extension gốc
            var extension = Path.GetExtension(imageFile.FileName).ToLower();

            // Tạo tên file unique
            var fileName = Guid.NewGuid().ToString() + extension;

            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            return "/uploads/products/" + fileName;
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