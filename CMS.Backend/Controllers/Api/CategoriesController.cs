using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.CategoryProducts
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.ImageUrl,
                    ProductCount = c.Products != null ? c.Products.Count : 0
                })
                .ToListAsync();

            return Ok(categories);
        }
    }
}
