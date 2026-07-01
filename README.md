# 🐾 PetShop – Hệ thống Quản lý Nội dung & Thương mại Điện tử

> **PetShop** là một hệ thống web fullstack kết hợp **Quản lý nội dung (CMS)** và **Thương mại điện tử (E-Commerce)**, được xây dựng bằng **ASP.NET Core 8** (Backend) và **React 19** (Frontend).

---

# 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Tính năng chính](#-tính-năng-chính)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [API Endpoints](#-api-endpoints)
- [Tác giả](#-tác-giả)

---

# 🌐 Tổng quan

**PetShop** cung cấp hai phần chính:

| Thành phần | Mô tả |
|---|---|
| 🖥️ **Trang Admin** (MVC) | Giao diện quản trị sử dụng ASP.NET MVC với Razor Views, dành cho quản lý sản phẩm, đơn hàng, bài viết, banner, danh mục, khách hàng và tài khoản. |
| 🛍️ **Trang khách hàng** (React SPA) | Giao diện mua sắm hiện đại dành cho người dùng cuối, bao gồm trang chủ, danh sách sản phẩm, giỏ hàng, thanh toán, blog và quản lý tài khoản. |

Hai phần giao tiếp với nhau thông qua **RESTful API**, được thiết kế tách biệt rõ ràng giữa frontend và backend.

---

# 🛠️ Công nghệ sử dụng

## Backend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| ASP.NET Core | 8.0 | Web framework chính |
| Entity Framework Core | 8.0 | ORM – truy vấn cơ sở dữ liệu |
| SQL Server | — | Hệ quản trị CSDL |
| Swagger / Swashbuckle | 10.x | Tài liệu API tự động |
| Cookie Authentication | — | Xác thực người dùng Admin |

## Frontend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 19.x | Thư viện xây dựng UI |
| React Router DOM | 7.x | Điều hướng SPA |
| React Icons | 5.x | Bộ icon |
| React Hot Toast | 2.x | Thông báo toast |
| Create React App | 5.x | Công cụ khởi tạo & build |

---

# 🏗️ Kiến trúc hệ thống

```text
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                  │
├──────────────────────┬──────────────────────────────┤
│   React SPA (:3000)  │   Admin MVC (Razor Views)    │
│   Trang khách hàng   │   Trang quản trị             │
└──────────┬───────────┴──────────┬───────────────────┘
           │ REST API             │ MVC Controller
           ▼                     ▼
┌─────────────────────────────────────────────────────┐
│            ASP.NET Core 8 Backend (:5xxx)           │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ API Controllers │  │ MVC Controllers + Views │  │
│  └────────┬────────┘  └────────────┬─────────────┘  │
│           └────────────┬───────────┘                │
│                        ▼                            │
│           ┌────────────────────────┐                │
│           │ Entity Framework Core  │                │
│           └────────────┬───────────┘                │
└────────────────────────┼────────────────────────────┘
                         ▼
              ┌─────────────────────┐
              │ SQL Server Database │
              │    (PetShop_DB)     │
              └─────────────────────┘
```

Dự án được tổ chức theo mô hình **3 tầng (3-layer)**:

- **PetShop.Frontend** – Giao diện người dùng (React SPA)
- **PetShop.Backend** – Tầng xử lý logic & API (ASP.NET Core MVC + Web API)
- **PetShop.Data** – Tầng dữ liệu (Entity Framework Core, Entities, Migrations)

---

# ✨ Tính năng chính

## 🛍️ Phía khách hàng (Frontend React)

- Trang chủ – Hero banner, sản phẩm nổi bật, bài viết mới nhất
- Danh sách sản phẩm – Tìm kiếm, lọc theo danh mục, phân trang
- Chi tiết sản phẩm – Hình ảnh, mô tả, thêm vào giỏ hàng
- Giỏ hàng – Thêm/xóa sản phẩm, cập nhật số lượng
- Thanh toán – Nhập thông tin giao hàng, đặt hàng
- Blog – Danh sách bài viết, chi tiết bài viết
- Đăng ký / Đăng nhập – Tài khoản khách hàng
- Quản lý hồ sơ – Cập nhật thông tin cá nhân, địa chỉ
- Lịch sử đơn hàng – Xem danh sách đơn hàng đã đặt

## 🖥️ Phía quản trị (Backend MVC)

- Quản lý sản phẩm – CRUD sản phẩm, hình ảnh sản phẩm
- Quản lý danh mục – Danh mục bài viết & danh mục sản phẩm
- Quản lý đơn hàng – Xem, cập nhật trạng thái đơn hàng
- Quản lý bài viết – CRUD bài viết/blog
- Quản lý banner – Thêm/sửa/xóa banner quảng cáo
- Quản lý khách hàng – Xem danh sách khách hàng
- Quản lý tài khoản Admin – Đăng nhập, phân quyền

---

# 🚀 Cài đặt & Chạy dự án

## Yêu cầu hệ thống

- .NET 8 SDK
- Node.js (>=18)
- SQL Server hoặc SQL Server Express

## 1. Clone dự án

```bash
git clone https://github.com/<your-username>/PetShop.git
cd PetShop
```

## 2. Cấu hình Database

Mở file:

```
PetShop.Backend/appsettings.json
```

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<SERVER_NAME>;Database=PetShop_DB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

## 3. Tạo Database

```bash
cd PetShop.Backend
dotnet ef database update
```

## 4. Chạy Backend

```bash
dotnet run
```

Backend:

```
https://localhost:5xxx
```

Swagger:

```
https://localhost:5xxx/swagger
```

Tài khoản Admin mặc định:

```
admin
admin123
```

## 5. Chạy Frontend

```bash
cd PetShop.Frontend
npm install
npm start
```

Frontend:

```
http://localhost:3000
```

---

# 📁 Cấu trúc thư mục

```text
PetShop/
├── PetShop.Backend/
├── PetShop.Data/
├── PetShop.Frontend/
├── PetShop.sln
└── README.md
```

---

# 📡 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | /api/products | Lấy danh sách sản phẩm |
| GET | /api/products/{id} | Lấy chi tiết sản phẩm |
| GET | /api/categories | Lấy danh mục sản phẩm |
| GET | /api/banners | Lấy danh sách banner |
| GET | /api/posts | Lấy danh sách bài viết |
| POST | /api/customerauth/register | Đăng ký tài khoản |
| POST | /api/customerauth/login | Đăng nhập |
| GET | /api/orders | Lấy đơn hàng của khách |
| POST | /api/orders | Tạo đơn hàng mới |

Swagger UI:

```
/swagger
```

---

# 👤 Tác giả

**Hoàng Thiện**

---

# 📄 License

Dự án được phát triển cho mục đích học tập và nghiên cứu.