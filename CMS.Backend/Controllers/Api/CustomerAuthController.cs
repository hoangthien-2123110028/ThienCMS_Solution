using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerAuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Helpers.EmailService _emailService;

        public CustomerAuthController(ApplicationDbContext context, Helpers.EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // POST: api/customerauth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin." });
            }

            // Check if email already exists
            var existingCustomer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == request.Email);
            if (existingCustomer != null)
            {
                return BadRequest(new { message = "Email đã được đăng ký." });
            }

            var customer = new Customer
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                Password = request.Password
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký thành công!",
                customer = new
                {
                    customer.Id,
                    customer.FullName,
                    customer.Email,
                    customer.Phone,
                    customer.Address
                }
            });
        }

        // POST: api/customerauth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Vui lòng nhập email và mật khẩu." });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == request.Email && c.Password == request.Password);

            if (customer == null)
            {
                return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác." });
            }

            return Ok(new
            {
                message = "Đăng nhập thành công!",
                customer = new
                {
                    customer.Id,
                    customer.FullName,
                    customer.Email,
                    customer.Phone,
                    customer.Address
                }
            });
        }

        // ==========================================
        // QUÊN MẬT KHẨU — Bước 1: Gửi mã OTP
        // ==========================================
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Vui lòng nhập email." });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == request.Email);
            if (customer == null)
            {
                return BadRequest(new { message = "Email không tồn tại trong hệ thống." });
            }

            // Tạo mã OTP 6 số
            var random = new Random();
            var code = random.Next(100000, 999999).ToString();

            // Vô hiệu hóa các mã cũ chưa dùng
            var oldTokens = await _context.PasswordResetTokens
                .Where(t => t.Email == request.Email && !t.IsUsed)
                .ToListAsync();
            foreach (var t in oldTokens)
            {
                t.IsUsed = true;
            }

            // Lưu mã mới
            var token = new PasswordResetToken
            {
                Email = request.Email,
                Code = code,
                ExpiresAt = DateTime.Now.AddMinutes(15),
                IsUsed = false
            };
            _context.PasswordResetTokens.Add(token);
            await _context.SaveChangesAsync();

            // Gửi email
            try
            {
                await _emailService.SendPasswordResetEmailAsync(request.Email, code);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR] {ex.Message}");
                return StatusCode(500, new { message = "Không thể gửi email. Vui lòng kiểm tra cấu hình email server." });
            }

            return Ok(new { message = "Mã xác thực đã được gửi đến email của bạn." });
        }

        // ==========================================
        // QUÊN MẬT KHẨU — Bước 2: Xác thực mã OTP
        // ==========================================
        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Vui lòng nhập email và mã xác thực." });
            }

            var token = await _context.PasswordResetTokens
                .Where(t => t.Email == request.Email && t.Code == request.Code && !t.IsUsed)
                .OrderByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            if (token == null)
            {
                return BadRequest(new { message = "Mã xác thực không chính xác." });
            }

            if (token.ExpiresAt < DateTime.Now)
            {
                return BadRequest(new { message = "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới." });
            }

            return Ok(new { message = "Mã xác thực hợp lệ.", valid = true });
        }

        // ==========================================
        // QUÊN MẬT KHẨU — Bước 3: Đặt mật khẩu mới
        // ==========================================
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Code) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin." });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự." });
            }

            var token = await _context.PasswordResetTokens
                .Where(t => t.Email == request.Email && t.Code == request.Code && !t.IsUsed)
                .OrderByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            if (token == null || token.ExpiresAt < DateTime.Now)
            {
                return BadRequest(new { message = "Mã xác thực không hợp lệ hoặc đã hết hạn." });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == request.Email);
            if (customer == null)
            {
                return BadRequest(new { message = "Tài khoản không tồn tại." });
            }

            // Cập nhật mật khẩu
            customer.Password = request.NewPassword;
            token.IsUsed = true;

            _context.Customers.Update(customer);
            _context.PasswordResetTokens.Update(token);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới." });
        }

        // GET: api/customerauth/profile/5
        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetProfile(int id)
        {
            var customer = await _context.Customers
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.FullName,
                    c.Email,
                    c.Phone,
                    c.Address
                })
                .FirstOrDefaultAsync();

            if (customer == null) return NotFound();

            return Ok(customer);
        }

        // PUT: api/customerauth/profile/5
        [HttpPut("profile/{id}")]
        public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileRequest request)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound(new { message = "Khách hàng không tồn tại." });

            if (!string.IsNullOrWhiteSpace(request.FullName))
                customer.FullName = request.FullName;
            if (!string.IsNullOrWhiteSpace(request.Phone))
                customer.Phone = request.Phone;
            if (!string.IsNullOrWhiteSpace(request.Address))
                customer.Address = request.Address;
            if (!string.IsNullOrWhiteSpace(request.Password))
                customer.Password = request.Password;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật hồ sơ thành công!",
                customer = new
                {
                    customer.Id,
                    customer.FullName,
                    customer.Email,
                    customer.Phone,
                    customer.Address
                }
            });
        }

        // GET: api/customerauth/profile/5/addresses
        [HttpGet("profile/{id}/addresses")]
        public async Task<IActionResult> GetAddresses(int id)
        {
            var addresses = await _context.CustomerAddresses
                .Where(a => a.CustomerId == id)
                .OrderByDescending(a => a.IsDefault)
                .Select(a => new {
                    a.Id,
                    a.CustomerId,
                    a.ReceiverName,
                    a.ReceiverPhone,
                    a.AddressLine,
                    a.IsDefault
                })
                .ToListAsync();

            return Ok(addresses);
        }

        // POST: api/customerauth/profile/5/addresses
        [HttpPost("profile/{id}/addresses")]
        public async Task<IActionResult> AddAddress(int id, [FromBody] AddressRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ReceiverName) ||
                string.IsNullOrWhiteSpace(request.ReceiverPhone) ||
                string.IsNullOrWhiteSpace(request.AddressLine))
            {
                return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin địa chỉ." });
            }

            var hasAddresses = await _context.CustomerAddresses.AnyAsync(a => a.CustomerId == id);

            if (request.IsDefault || !hasAddresses)
            {
                var defaults = await _context.CustomerAddresses.Where(a => a.CustomerId == id && a.IsDefault).ToListAsync();
                foreach (var d in defaults)
                {
                    d.IsDefault = false;
                }
            }

            var address = new CustomerAddress
            {
                CustomerId = id,
                ReceiverName = request.ReceiverName,
                ReceiverPhone = request.ReceiverPhone,
                AddressLine = request.AddressLine,
                IsDefault = request.IsDefault || !hasAddresses
            };

            _context.CustomerAddresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm địa chỉ thành công!", address });
        }

        // PUT: api/customerauth/profile/5/addresses/2
        [HttpPut("profile/{id}/addresses/{addressId}")]
        public async Task<IActionResult> UpdateAddress(int id, int addressId, [FromBody] AddressRequest request)
        {
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == id);
            if (address == null) return NotFound(new { message = "Địa chỉ không tồn tại." });

            if (string.IsNullOrWhiteSpace(request.ReceiverName) ||
                string.IsNullOrWhiteSpace(request.ReceiverPhone) ||
                string.IsNullOrWhiteSpace(request.AddressLine))
            {
                return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin địa chỉ." });
            }

            if (request.IsDefault && !address.IsDefault)
            {
                var defaults = await _context.CustomerAddresses.Where(a => a.CustomerId == id && a.IsDefault).ToListAsync();
                foreach (var d in defaults)
                {
                    d.IsDefault = false;
                }
            }

            address.ReceiverName = request.ReceiverName;
            address.ReceiverPhone = request.ReceiverPhone;
            address.AddressLine = request.AddressLine;
            address.IsDefault = request.IsDefault;

            _context.CustomerAddresses.Update(address);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật địa chỉ thành công!", address });
        }

        // DELETE: api/customerauth/profile/5/addresses/2
        [HttpDelete("profile/{id}/addresses/{addressId}")]
        public async Task<IActionResult> DeleteAddress(int id, int addressId)
        {
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == id);
            if (address == null) return NotFound(new { message = "Địa chỉ không tồn tại." });

            bool wasDefault = address.IsDefault;

            _context.CustomerAddresses.Remove(address);
            await _context.SaveChangesAsync();

            if (wasDefault)
            {
                var anotherAddress = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.CustomerId == id);
                if (anotherAddress != null)
                {
                    anotherAddress.IsDefault = true;
                    _context.CustomerAddresses.Update(anotherAddress);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { message = "Xóa địa chỉ thành công!" });
        }
    }

    // Request DTOs
    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Password { get; set; }
    }

    public class AddressRequest
    {
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyResetCodeRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
