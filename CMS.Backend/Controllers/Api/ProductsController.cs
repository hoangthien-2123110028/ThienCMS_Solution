using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/products?categoryId=1&search=keyword&page=1&pageSize=12&minPrice=0&maxPrice=10000000&sortBy=price_asc&brand=Apple
        [HttpGet]
        public async Task<IActionResult> GetAll(
            int? categoryId,
            string? search,
            decimal? minPrice,
            decimal? maxPrice,
            string? brand,
            string? sortBy,
            int page = 1,
            int pageSize = 12)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryProductId == categoryId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Name.Contains(search) ||
                    (p.Description != null && p.Description.Contains(search)));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(brand))
            {
                query = query.Where(p => p.Brand == brand);
            }

            // Apply sorting
            query = sortBy switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "name_asc" => query.OrderBy(p => p.Name),
                "newest" => query.OrderByDescending(p => p.Id),
                _ => query.OrderByDescending(p => p.Id)
            };

            var totalCount = await query.CountAsync();
            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.Price,
                    p.StockQuantity,
                    p.ImageUrl,
                    p.Brand,
                    p.Colors,
                    p.CategoryProductId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    Images = p.Images.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList()
                })
                .ToListAsync();

            return Ok(new
            {
                data = products,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // GET: api/products/best-sellers?limit=8
        [HttpGet("best-sellers")]
        public async Task<IActionResult> GetBestSellers(int limit = 8)
        {
            var bestSellers = await _context.OrderDetails
                .GroupBy(od => od.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    TotalSold = g.Sum(od => od.Quantity)
                })
                .OrderByDescending(x => x.TotalSold)
                .Take(limit)
                .Join(
                    _context.Products.Include(p => p.Category).Include(p => p.Images),
                    bs => bs.ProductId,
                    p => p.Id,
                    (bs, p) => new
                    {
                        p.Id,
                        p.Name,
                        p.Description,
                        p.Price,
                        p.StockQuantity,
                        p.ImageUrl,
                        p.Brand,
                        p.Colors,
                        p.CategoryProductId,
                        CategoryName = p.Category != null ? p.Category.Name : null,
                        Images = p.Images.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList(),
                        bs.TotalSold
                    }
                )
                .OrderByDescending(x => x.TotalSold)
                .ToListAsync();

            return Ok(bestSellers);
        }

        // GET: api/products/brands — Get all distinct brands
        [HttpGet("brands")]
        public async Task<IActionResult> GetBrands()
        {
            var brands = await _context.Products
                .Where(p => p.Brand != null && p.Brand != "")
                .GroupBy(p => p.Brand)
                .Select(g => new
                {
                    Name = g.Key,
                    ProductCount = g.Count()
                })
                .OrderBy(b => b.Name)
                .ToListAsync();

            return Ok(brands);
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.Price,
                    p.StockQuantity,
                    p.ImageUrl,
                    p.Brand,
                    p.Colors,
                    p.CategoryProductId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    Images = p.Images.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList()
                })
                .FirstOrDefaultAsync();

            if (product == null) return NotFound();

            // Get related products from same category
            var relatedProducts = await _context.Products
                .Include(p => p.Images)
                .Where(p => p.CategoryProductId == product.CategoryProductId && p.Id != id)
                .Take(4)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Price,
                    p.ImageUrl,
                    Images = p.Images.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList()
                })
                .ToListAsync();

            return Ok(new { product, relatedProducts });
        }

        // GET: api/products/5/stock — Real-time stock check for tooltip
        [HttpGet("{id}/stock")]
        public async Task<IActionResult> GetStock(int id)
        {
            var product = await _context.Products
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.StockQuantity
                })
                .FirstOrDefaultAsync();

            if (product == null) return NotFound();

            string status;
            if (product.StockQuantity <= 0)
                status = "Hết hàng";
            else if (product.StockQuantity <= 5)
                status = "Sắp hết";
            else
                status = "Còn nhiều";

            return Ok(new
            {
                product.StockQuantity,
                Status = status,
                LastChecked = DateTime.UtcNow
            });
        }
    }
}
 