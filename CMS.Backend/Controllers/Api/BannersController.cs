using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using System.Linq;
using System.Threading.Tasks;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class BannersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BannersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/banners?position=HomeHero
        [HttpGet]
        public async Task<IActionResult> GetActiveBanners([FromQuery] string position = "HomeHero")
        {
            var banners = await _context.Banners
                .Where(b => b.IsActive && b.Position == position)
                .OrderBy(b => b.SortOrder)
                .Select(b => new
                {
                    b.Id,
                    b.Title,
                    b.Description,
                    b.ImageUrl,
                    b.LinkUrl,
                    b.Position,
                    b.SortOrder
                })
                .ToListAsync();

            return Ok(banners);
        }
    }
}
