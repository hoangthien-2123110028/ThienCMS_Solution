/*
 * Sinh Vien:Pham Nguyen Hoang Thien
 * Ma sv:2123110028
 * Ngay tao:14-05-2026
 * Version:1.0
 * 
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CMS.Data.Entities
{
    //thuc the danh muc bai viet
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
       

        //quan he 1-n voi bai viet
        public ICollection<Post> Posts { get; set; }
    }
}
