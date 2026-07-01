using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CMS.Data;
using CMS.Data.Entities;
using CMS.Backend.Helpers;
using Microsoft.Extensions.Configuration;

namespace CMS.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;

        public OrdersController(ApplicationDbContext context, IConfiguration configuration, EmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        // ==========================================
        // TẠO ĐƠN HÀNG (POST: api/orders)
        // ==========================================
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (request.CustomerId <= 0 || request.Items == null || !request.Items.Any())
            {
                return BadRequest(new { message = "Thông tin đơn hàng không hợp lệ." });
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // 1. Khởi tạo thực thể Order sơ bộ
                    var order = new Order
                    {
                        CustomerId = request.CustomerId,
                        OrderDate = DateTime.Now,
                        Status = 0, // Chờ duyệt / Chưa thanh toán
                        Notes = request.Notes,
                        ShippingAddress = request.ShippingAddress,
                        ShippingPhone = request.ShippingPhone,
                        ShippingName = request.ShippingName,
                        PaymentMethod = request.PaymentMethod
                    };

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync(); // Lấy OrderId tự tăng

                    decimal totalAmount = 0;
                    var orderItemInfos = new List<OrderItemInfo>();

                    // 2. Duyệt qua từng sản phẩm để xử lý logic giá và kho hàng
                    foreach (var item in request.Items)
                    {
                        var product = await _context.Products.FindAsync(item.ProductId);
                        if (product != null)
                        {
                            // NẾU LÀ ĐƠN COD -> KIỂM TRA VÀ TRỪ KHO NGAY LẬP TỨC
                            if (request.PaymentMethod == "COD")
                            {
                                if (product.StockQuantity < item.Quantity)
                                {
                                    return BadRequest(new { message = $"Sản phẩm '{product.Name}' không đủ tồn kho (Còn lại: {product.StockQuantity})." });
                                }
                                product.StockQuantity -= item.Quantity;
                            }

                            var detail = new OrderDetail
                            {
                                OrderId = order.Id,
                                ProductId = item.ProductId,
                                Quantity = item.Quantity,
                                UnitPrice = product.Price
                            };
                            _context.OrderDetails.Add(detail);
                            totalAmount += product.Price * item.Quantity;

                            orderItemInfos.Add(new OrderItemInfo
                            {
                                ProductName = product.Name,
                                Quantity = item.Quantity,
                                UnitPrice = product.Price
                            });
                        }
                    }

                    await _context.SaveChangesAsync();

                    // 3. Xử lý luồng phản hồi tùy thuộc vào phương thức thanh toán
                    string vnpayUrl = "";
                    if (request.PaymentMethod == "VNPay")
                    {
                        string ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                        var baseUrl = _configuration["VNPay:BaseUrl"];
                        var tmnCode = _configuration["VNPay:TmnCode"];
                        var hashSecret = _configuration["VNPay:HashSecret"];
                        var returnUrl = _configuration["VNPay:ReturnUrl"];

                        vnpayUrl = Helpers.VnPayHelper.BuildPaymentUrl(
                            baseUrl, tmnCode, hashSecret, returnUrl, ipAddress,
                            order.Id.ToString(), totalAmount, $"Thanh toan don hang #{order.Id}"
                        );
                    }
                    else
                    {
                        // Đơn hàng COD hoàn thành -> Gửi email xác nhận luôn
                        await SendOrderEmailSafe(request.CustomerId, order, orderItemInfos, totalAmount);
                    }

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message = request.PaymentMethod == "VNPay" ? "Tạo đơn hàng thành công, đang chuyển hướng thanh toán..." : "Đặt hàng thành công!",
                        orderId = order.Id,
                        vnpayUrl = vnpayUrl
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = $"Lỗi xử lý hệ thống: {ex.Message}" });
                }
            }
        }

        // ==========================================
        // VNPAY RETURN (GET: api/orders/vnpay-return)
        // Luồng chuyển hướng hiển thị giao diện cho khách hàng
        // ==========================================
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            var query = Request.Query;
            var hashSecret = _configuration["VNPay:HashSecret"];

            bool isValidSignature = Helpers.VnPayHelper.ValidateCallback(hashSecret, query);
            if (!isValidSignature) return BadRequest(new { success = false, message = "Chữ ký không hợp lệ." });

            string txnRef = query["vnp_TxnRef"];
            string responseCode = query["vnp_ResponseCode"];
            string transactionNo = query["vnp_TransactionNo"];

            if (int.TryParse(txnRef, out int orderId))
            {
                var order = await _context.Orders
                    .Include(o => o.OrderDetails)
                    .FirstOrDefaultAsync(o => o.Id == orderId);

                if (order != null)
                {
                    if (responseCode == "00")
                    {
                        // Gọi hàm dùng chung để thực hiện trừ kho và cập nhật trạng thái an toàn
                        bool isUpdated = await ProcessPaymentSuccessAsync(order, transactionNo, "VNPay Return");
                        return Ok(new { success = true, orderId = order.Id });
                    }
                    else
                    {
                        order.Notes = (order.Notes ?? "") + $"\n[VNPay Return] Thanh toán thất bại. Mã lỗi: {responseCode}, Ngày: {DateTime.Now}";
                        await _context.SaveChangesAsync();
                        return Ok(new { success = false, orderId = order.Id, errorCode = responseCode });
                    }
                }
            }
            return BadRequest(new { success = false, message = "Đơn hàng không hợp lệ." });
        }

        // ==========================================
        // VNPAY IPN (GET: api/orders/vnpay-ipn)
        // Webhook ngầm (Server-to-Server) bảo vệ và chống lệch kho hàng
        // ==========================================
        [HttpGet("vnpay-ipn")]
        public async Task<IActionResult> VnPayIpn()
        {
            var query = Request.Query;
            var hashSecret = _configuration["VNPay:HashSecret"];

            bool isValidSignature = Helpers.VnPayHelper.ValidateCallback(hashSecret, query);
            if (!isValidSignature) return Ok(new { RspCode = "97", Message = "Invalid signature" });

            if (!int.TryParse(query["vnp_TxnRef"], out int orderId))
                return Ok(new { RspCode = "01", Message = "Order Not Found" });

            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return Ok(new { RspCode = "01", Message = "Order Not Found" });

            // Kiểm tra số tiền trùng khớp nếu cần (VNPay khuyến nghị rà soát cấu trúc vnp_Amount)
            // decimal vnpAmount = decimal.Parse(query["vnp_Amount"]) / 100; 

            string responseCode = query["vnp_ResponseCode"];
            string transactionNo = query["vnp_TransactionNo"];

            if (responseCode == "00")
            {
                // Thực thi xử lý cập nhật kho ngầm
                bool isUpdated = await ProcessPaymentSuccessAsync(order, transactionNo, "VNPay IPN");
                if (!isUpdated)
                {
                    return Ok(new { RspCode = "02", Message = "Order already confirmed" });
                }
            }
            else
            {
                order.Notes = (order.Notes ?? "") + $"\n[VNPay IPN] Giao dịch lỗi hoặc hủy. Mã: {responseCode}";
                await _context.SaveChangesAsync();
            }

            return Ok(new { RspCode = "00", Message = "Confirm success" });
        }

        // ==========================================
        // HÀM DÙNG CHUNG: CẬP NHẬT TRẠNG THÁI VÀ TRỪ KHO KHI THANH TOÁN THÀNH CÔNG
        // Đảm bảo không chạy trùng lặp (Idempotent) giữa Return và IPN
        // ==========================================
        private async Task<bool> ProcessPaymentSuccessAsync(Order order, string transactionNo, string source)
        {
            // Nếu đơn hàng đã cập nhật TransactionId hoặc đổi trạng thái từ trước -> Bỏ qua
            if (!string.IsNullOrEmpty(order.TransactionId) || order.Status != 0)
            {
                return false;
            }

            using (var dbTransaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    order.TransactionId = transactionNo;
                    order.Status = 1; // Đổi sang trạng thái Đang xử lý / Đã thanh toán
                    order.Notes = (order.Notes ?? "") + $"\n[{source}] Thanh toán thành công qua VNPay. Mã GD: {transactionNo}, Lúc: {DateTime.Now}";

                    var orderItemInfos = new List<OrderItemInfo>();
                    decimal totalAmount = 0;

                    if (order.OrderDetails != null)
                    {
                        foreach (var detail in order.OrderDetails)
                        {
                            var product = await _context.Products.FindAsync(detail.ProductId);
                            if (product != null)
                            {
                                // Thực hiện trừ kho sản phẩm khi ví tiền đã nhận được
                                product.StockQuantity -= detail.Quantity;
                                if (product.StockQuantity < 0) product.StockQuantity = 0;

                                orderItemInfos.Add(new OrderItemInfo
                                {
                                    ProductName = product.Name,
                                    Quantity = detail.Quantity,
                                    UnitPrice = detail.UnitPrice
                                });
                            }
                            totalAmount += detail.Quantity * detail.UnitPrice;
                        }
                    }

                    await _context.SaveChangesAsync();
                    await dbTransaction.CommitAsync();

                    // Kích hoạt gửi Email thông báo biên lai cho khách hàng
                    await SendOrderEmailSafe(order.CustomerId, order, orderItemInfos, totalAmount);
                    return true;
                }
                catch (Exception)
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            }
        }

        // ==========================================
        // DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG (GET: api/orders/customer/5)
        // ==========================================
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var orders = await _context.Orders
                .Where(o => o.CustomerId == customerId)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.Id,
                    o.OrderDate,
                    o.Status,
                    o.Notes,
                    o.ShippingAddress,
                    o.ShippingPhone,
                    o.ShippingName,
                    StatusText = o.Status == 0 ? "Chờ duyệt" : o.Status == 1 ? "Đang giao" : "Đã xong",
                    Items = o.OrderDetails!.Select(od => new
                    {
                        od.ProductId,
                        ProductName = od.Product != null ? od.Product.Name : "",
                        ProductImage = od.Product != null ? od.Product.ImageUrl : "",
                        od.Quantity,
                        od.UnitPrice
                    }).ToList(),
                    Total = o.OrderDetails!.Sum(od => od.Quantity * od.UnitPrice)
                })
                .ToListAsync();

            return Ok(orders);
        }

        // ==========================================
        // HELPER: GỬI EMAIL XÁC NHẬN ĐƠN HÀNG (AN TOÀN)
        // ==========================================
        private async Task SendOrderEmailSafe(int customerId, Order order, List<OrderItemInfo> items, decimal totalAmount)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer != null && !string.IsNullOrWhiteSpace(customer.Email))
                {
                    await _emailService.SendOrderConfirmationEmailAsync(
                        customer.Email,
                        customer.FullName,
                        order.Id,
                        order.OrderDate,
                        order.ShippingName ?? customer.FullName,
                        order.ShippingPhone ?? customer.Phone ?? "",
                        order.ShippingAddress ?? customer.Address ?? "",
                        order.PaymentMethod,
                        items,
                        totalAmount
                    );
                    Console.WriteLine($"[EMAIL] Đã gửi email thành công cho đơn hàng #{order.Id} tới {customer.Email}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR] Không thể gửi email cho đơn hàng #{order.Id}: {ex.Message}");
            }
        }
    }

    // Các class DTO Request giữ nguyên cấu trúc của bạn
    public class CreateOrderRequest
    {
        public int CustomerId { get; set; }
        public string? Notes { get; set; }
        public string? ShippingAddress { get; set; }
        public string? ShippingPhone { get; set; }
        public string? ShippingName { get; set; }
        public string PaymentMethod { get; set; } = "COD";
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}