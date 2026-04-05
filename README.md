# Quản Lý Tài Chính Cá Nhân

Ứng dụng quản lý tài chính cá nhân với các chức năng quản lý người dùng, giao dịch, danh mục, ngân sách, mục tiêu, báo cáo và thống kê.

## Chức năng chính

### 1. Quản lý người dùng
- Đăng ký tài khoản với `name`, `email`, `password`, `currency`
- Đăng nhập bằng JWT
- Cập nhật thông tin cá nhân: `name`, `email`, `password`, `currency`
- Xem thông tin tài khoản: `name`, `email`, `currency`

### 2. Quản lý giao dịch
- Thêm mới giao dịch: `income`, `expense`, `transfer`
- Thông tin giao dịch: `amount`, `category`, `description`, `date`, `paymentMethod`
- Sửa và xóa giao dịch
- Tìm kiếm giao dịch theo danh mục và khoảng thời gian
- Sắp xếp giao dịch theo `amount` (tăng/giảm) hoặc `date`
- Lọc giao dịch theo `type` (income/expense/transfer), `category`, `paymentMethod`

### 3. Quản lý danh mục
- CRUD danh mục thu/chi (ví dụ: ăn uống, di chuyển, lương, giải trí)
- Mỗi danh mục gắn với loại `income` hoặc `expense`
- Kiểm tra tồn tại danh mục để tránh trùng lặp khi thêm mới

### 4. Quản lý ngân sách
- Tạo, sửa, xóa ngân sách theo danh mục và tháng/năm
- Thiết lập `BAmount` cho mỗi danh mục
- Tự động cộng dồn chi tiêu `expense` vào ngân sách tương ứng
- Cảnh báo khi chi tiêu vượt quá ngân sách hoặc khi còn lại dưới mức an toàn
- Hiển thị báo cáo số tiền còn lại trong mỗi ngân sách

### 5. Quản lý mục tiêu
- Tạo mục tiêu tiết kiệm: `name`, `targetAmount`, `deadline`
- Hiển thị danh sách mục tiêu, tìm kiếm theo tên, sắp xếp theo hạn
- Cập nhật và xóa mục tiêu
- Mỗi khi người dùng tạo giao dịch kiểu `transfer`, giá trị `GAmount` sẽ tăng dần
- So sánh `GAmount` với `goal` để đánh giá tiến độ hoàn thành

### 6. Báo cáo và thống kê
- Tổng thu, tổng chi theo tháng
- Số dư theo ngày: `total income - total expense` đến ngày chọn
- Top 3 danh mục chi tiêu nhiều nhất trong tháng
- Báo cáo số tiền còn lại trong mỗi ngân sách
- Tiến độ hoàn thành mục tiêu tiết kiệm: `% hoàn thành`, `amount saved`, `amount remaining`
- Thống kê chi tiêu theo tuần (nhóm theo ngày trong tuần, tổng tiền, tổng lần chi, trung bình chi tiêu)
- Liệt kê chi tiết chi tiêu theo từng ngày trong tuần

## Truy vấn/Analytics (ghi chú độ khó)
- [Ag] Lấy tất cả người dùng và tổng giao dịch của từng người
- [Ag] Tổng chi theo từng danh mục trong tháng
- [D] Tìm giao dịch có số tiền lớn hơn mức trung bình của user
- [D] Lấy danh sách giao dịch kèm tổng tiền
- [Ag] Tìm danh mục chi tiêu cao nhất trong tháng
- [D] Tổng tiền tiết kiệm được trong mục tiêu
- [Ag] Tổng thu, tổng chi theo tháng (chung chung, không theo danh mục)
- [Ag/D] Số dư theo ngày cụ thể (kể cả hiện tại)
- [Ag] Top 3 danh mục chi tiêu nhiều nhất trong tháng (sử dụng `$lookup`)
- [D] Tiến độ hoàn thành mục tiêu
- [Ag] Thống kê chi tiêu theo ngày trong tuần (phân tích xu hướng)
- [Ag] Tổng hợp báo cáo tài chính cá nhân theo tháng
- [D] Tìm giao dịch theo danh mục/khoảng thời gian
- [D] Lọc giao dịch theo loại/danh mục/phương thức thanh toán
- [D] Sắp xếp giao dịch theo số tiền/ngày
- [D] Kiểm tra danh mục tồn tại khi thêm mới
- [Ag] Lấy danh sách ngân sách kèm cảnh báo (còn bao nhiêu tiền trong ngân sách)
- [Ag] Tổng hợp số tiền còn lại trong mỗi ngân sách đến thời điểm hiện tại
- [D] Tìm mục tiêu theo tên
- [D] Sắp xếp mục tiêu theo hạn
- [Ag] Liệt kê chi tiêu chi tiết theo từng ngày trong tuần

> Ghi chú: Các đề mục có `(D)` là dễ, `(Ag)` là nâng cao.

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- MongoDB (local hoặc cloud)
- npm hoặc yarn

### Cài đặt

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd quanlychitieucanhan
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình MongoDB:**
   - Cài đặt MongoDB local hoặc sử dụng MongoDB Atlas
   - Cập nhật `MONGODB_URI` trong file `.env`

4. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```

5. **Truy cập:**
   - `http://localhost:3000`

## Cấu trúc dự án

- `models/` - Mongoose models cho User, Category, Transaction, Budget, Goal
- `routes/` - Express routes
- `views/` - EJS templates
- `public/` - Static files
- `middleware/` - Middleware xác thực
- `server.js` - Main application entrypoint

## Mô tả các module chính

### User
- Đăng ký, đăng nhập JWT, cập nhật profile, xem thông tin

### Transaction
- Thêm/sửa/xóa giao dịch
- Tìm kiếm, lọc, sắp xếp giao dịch

### Category
- CRUD danh mục thu/chi
- Kiểm tra trùng danh mục

### Budget
- Quản lý ngân sách theo tháng/năm
- Cảnh báo khi chi tiêu vượt hạn mức
- Báo cáo số tiền còn lại

### Goal
- Quản lý mục tiêu tiết kiệm
- Tiến độ hoàn thành theo `targetAmount`
- Tìm kiếm và sắp xếp mục tiêu

## Biến môi trường

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quanlychitieucanhan
SESSION_SECRET=your-secret-key-here
```

## Các endpoint chính

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `PUT /auth/profile`
- `GET /auth/profile`
- `GET /auth/logout`

### Transaction
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `GET /transactions`

### Category
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`
- `GET /categories`

### Budget
- `POST /budgets`
- `PUT /budgets/:id`
- `DELETE /budgets/:id`
- `GET /budgets`

### Goal
- `POST /goals`
- `PUT /goals/:id`
- `DELETE /goals/:id`
- `GET /goals`

## Gợi ý triển khai

- Dùng JWT cho xác thực người dùng
- Mỗi `Transaction` liên kết với `userId` và `categoryId`
- Budget ghi nhận `BAmount` và `spentAmount`
- Goal ghi nhận `GAmount` và `targetAmount`
- Dùng aggregation MongoDB để xây báo cáo nâng cao

## Ghi chú

- Phân biệt rõ `income`, `expense`, `transfer`
- `transfer` dùng cho tiết kiệm/mục tiêu nội bộ
- Mỗi danh mục chỉ thuộc một loại: `income` hoặc `expense`
- Mục tiêu tiết kiệm chỉ tăng khi giao dịch `transfer`
- Ngân sách chỉ giảm khi giao dịch `expense`
