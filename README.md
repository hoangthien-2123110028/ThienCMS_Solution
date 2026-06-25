# Hướng dẫn chạy dự án

## 1. Chạy Backend

Mở solution bằng Visual Studio và thực hiện:

* Restore các package NuGet.
* Thiết lập project Backend làm Startup Project.
* Nhấn **F5** hoặc chọn **Start Debugging** để chạy ứng dụng.

Hoặc sử dụng Terminal:

```bash
dotnet restore
dotnet run
```

---

## 2. Chạy Frontend

Di chuyển đến thư mục FrontEnd:

```bash
cd FrontEnd
```

Cài đặt các package:

```bash
npm install
```

Khởi động ứng dụng:

```bash
npm start
```

Sau khi chạy thành công, ứng dụng sẽ hoạt động tại:

```text
http://localhost:3000
```

---

## 3. Cấu hình Git Ignore

Dự án đã loại bỏ các thư mục không cần thiết khỏi Git thông qua file `.gitignore`.

Các thư mục và file được bỏ qua:

```gitignore
# Node modules
node_modules/

# Build ASP.NET
bin/
obj/

# Visual Studio
.vs/

# User files
*.user
*.suo

# Logs
*.log

# Environment
.env
```

Nếu các thư mục này đã được đưa lên Git trước đó, chạy:

```bash
git rm -r --cached node_modules
git rm -r --cached bin
git rm -r --cached obj

git commit -m "Remove generated files from repository"
git push
```

---

## 4. Yêu cầu môi trường

* .NET SDK
* Visual Studio 2022 hoặc mới hơn
* Node.js và npm

Kiểm tra phiên bản:

```bash
dotnet --version
node -v
npm -v
```
