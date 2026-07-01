using CMS.Backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("test-mail")]
        public async Task<IActionResult> TestMail(
    [FromServices] EmailService emailService)
        {
            try
            {
                await emailService.SendPasswordResetEmailAsync(
                    "phamnguyenhoangthien123@gmail.com",
                    "123456"
                );

                return Ok("Đã gửi mail thành công");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}