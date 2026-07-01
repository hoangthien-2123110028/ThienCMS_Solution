using System;
using System.ComponentModel.DataAnnotations;

namespace CMS.Data.Entities
{
    public class Banner
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Tiêu đề banner là bắt buộc")]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Ảnh banner là bắt buộc")]
        public string ImageUrl { get; set; } = string.Empty;

        public string? LinkUrl { get; set; }

        public string Position { get; set; } = "HomeHero";

        public int SortOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
