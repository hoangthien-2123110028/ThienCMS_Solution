using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // Bắt buộc phải có thư viện này

namespace CMS.Data.Entities
{
    public class Product
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public int StockQuantity { get; set; }

        public string? ImageUrl { get; set; }

        public string? Brand { get; set; }

        public string? Colors { get; set; }

        public int CategoryProductId { get; set; }

        [ForeignKey("CategoryProductId")]
        public CategoryProduct? Category { get; set; }

        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}