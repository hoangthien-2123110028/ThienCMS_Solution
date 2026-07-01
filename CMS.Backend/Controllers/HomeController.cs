using Microsoft.AspNetCore.Authorization;
using CMS.Backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using CMS.Data;
using System.Linq;

namespace CMS.Backend.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly ApplicationDbContext _context;

        public HomeController(ILogger<HomeController> logger, ApplicationDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.CategoriesCount = _context.CategoryProducts.Count();
            ViewBag.ProductsCount = _context.Products.Count();
            ViewBag.CustomersCount = _context.Customers.Count();
            ViewBag.OrdersCount = _context.Orders.Count();
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
