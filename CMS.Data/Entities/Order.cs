//sinh vien: nguyen vu hiep
//mssv:2123110161
//ngay tao:15/5/26

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Data.Entities
{
    public class Order
    {
        [Key]
        public int Id { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.Now;

        public int CustomerId { get; set; }

        public int Status { get; set; } // 0: Chờ duyệt, 1: Đang giao, 2: Đã xong

        public string? Notes { get; set; }

        public string? ShippingAddress { get; set; }
        public string? ShippingPhone { get; set; }
        public string? ShippingName { get; set; }

        public string PaymentMethod { get; set; } = "COD"; // "COD" hoặc "VNPay"
        public string? TransactionId { get; set; } // Mã giao dịch VNPay (nếu có)

        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        public virtual ICollection<OrderDetail>? OrderDetails { get; set; }
    }
}

