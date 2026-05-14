using Microsoft.AspNetCore.Mvc;
using CMS.Data.Entities;

namespace CMS.Backend.Controllers
{
    public class UserController : Controller
    {
        public IActionResult Index()
        {
            var users = new List<User>
            {
                new User
                {
                    Id = 1,
                    Username = "admin",
                    FullName = "Nguyễn Văn Admin",
                    Role = "Administrator"
                },

                new User
                {
                    Id = 2,
                    Username = "editor",
                    FullName = "Trần Văn Editor",
                    Role = "Editor"
                }
            };

            return View(users);
        }
    }
}