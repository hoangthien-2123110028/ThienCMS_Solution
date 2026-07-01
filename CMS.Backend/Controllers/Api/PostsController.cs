using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PostsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/posts?page=1&pageSize=6
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 6)
        {
            var totalCount = await _context.Posts.CountAsync();

            var posts = await _context.Posts
                .Include(p => p.Category)
                .OrderByDescending(p => p.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    Summary = p.Content != null && p.Content.Length > 150
                        ? p.Content.Substring(0, 150) + "..."
                        : p.Content,
                    p.CreatedDate,
                    p.ImageUrl,
                    CategoryName = p.Category != null ? p.Category.Name : null
                })
                .ToListAsync();

            return Ok(new
            {
                data = posts,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        // GET: api/posts/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var post = await _context.Posts
                .Include(p => p.Category)
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Content,
                    p.CreatedDate,
                    p.ImageUrl,
                    CategoryName = p.Category != null ? p.Category.Name : null
                })
                .FirstOrDefaultAsync();

            if (post == null) return NotFound();

            return Ok(post);
        }
    }
}
