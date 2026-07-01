using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class OrderController : Controller
    {
        private readonly ApplicationDbContext _context;

        public OrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // DANH SÁCH ĐƠN HÀNG (INDEX)
        // ==========================================
        public async Task<IActionResult> Index()
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .ToListAsync();
            return View(orders);
        }

        // ==========================================
        // CHI TIẾT ĐƠN HÀNG (DETAILS)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            return View(order);
        }

        // ==========================================
        // 1. CHỨC NĂNG THÊM MỚI (CREATE)
        // ==========================================
        [HttpGet]
        public IActionResult Create()
        {
            ViewBag.Customers = new SelectList(_context.Customers, "Id", "FullName");
            ViewBag.Products = _context.Products.ToList();
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Order order, int[] ProductIds, int[] Quantities)
        {
            // Loại bỏ kiểm tra navigation properties
            ModelState.Remove("Customer");
            ModelState.Remove("OrderDetails");

            if (ModelState.IsValid)
            {
                order.OrderDate = DateTime.Now;
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Thêm chi tiết đơn hàng
                if (ProductIds != null && Quantities != null)
                {
                    for (int i = 0; i < ProductIds.Length; i++)
                    {
                        if (ProductIds[i] > 0 && Quantities[i] > 0)
                        {
                            var product = await _context.Products.FindAsync(ProductIds[i]);
                            if (product != null)
                            {
                                var detail = new OrderDetail
                                {
                                    OrderId = order.Id,
                                    ProductId = ProductIds[i],
                                    Quantity = Quantities[i],
                                    UnitPrice = product.Price
                                };
                                _context.OrderDetails.Add(detail);
                            }
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                return RedirectToAction(nameof(Index));
            }

            ViewBag.Customers = new SelectList(_context.Customers, "Id", "FullName", order.CustomerId);
            ViewBag.Products = _context.Products.ToList();
            return View(order);
        }

        // ==========================================
        // 2. CHỨC NĂNG SỬA (EDIT)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();

            ViewBag.Customers = new SelectList(_context.Customers, "Id", "FullName", order.CustomerId);
            ViewBag.Products = _context.Products.ToList();
            return View(order);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Order order, int[] ProductIds, int[] Quantities)
        {
            if (id != order.Id) return NotFound();

            // Loại bỏ kiểm tra navigation properties
            ModelState.Remove("Customer");
            ModelState.Remove("OrderDetails");

            if (ModelState.IsValid)
            {
                // Cập nhật thông tin đơn hàng
                _context.Orders.Update(order);

                // Xóa chi tiết cũ và thêm lại
                var oldDetails = _context.OrderDetails.Where(od => od.OrderId == id);
                _context.OrderDetails.RemoveRange(oldDetails);

                if (ProductIds != null && Quantities != null)
                {
                    for (int i = 0; i < ProductIds.Length; i++)
                    {
                        if (ProductIds[i] > 0 && Quantities[i] > 0)
                        {
                            var product = await _context.Products.FindAsync(ProductIds[i]);
                            if (product != null)
                            {
                                var detail = new OrderDetail
                                {
                                    OrderId = order.Id,
                                    ProductId = ProductIds[i],
                                    Quantity = Quantities[i],
                                    UnitPrice = product.Price
                                };
                                _context.OrderDetails.Add(detail);
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            ViewBag.Customers = new SelectList(_context.Customers, "Id", "FullName", order.CustomerId);
            ViewBag.Products = _context.Products.ToList();
            return View(order);
        }

        // ==========================================
        // 3. CHỨC NĂNG XÓA (DELETE)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            return View(order);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order != null)
            {
                // Xóa chi tiết đơn hàng trước
                if (order.OrderDetails != null)
                {
                    _context.OrderDetails.RemoveRange(order.OrderDetails);
                }
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}