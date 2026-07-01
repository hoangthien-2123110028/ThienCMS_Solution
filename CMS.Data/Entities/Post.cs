
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CMS.Data.Entities
{
    public class Post
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? ImageUrl { get; set; }

        public int CategoryId { get; set; }

        // THÊM DẤU ? VÀO ĐÂY: Để ModelState không bắt lỗi thuộc tính này khi nhận từ Form
        public Category? Category { get; set; }
    }
}

