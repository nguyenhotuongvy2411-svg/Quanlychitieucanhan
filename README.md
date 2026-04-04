# Quản Lý Chi Tiêu Cá Nhân

Ứng dụng web quản lý tài chính cá nhân được xây dựng bằng Node.js, Express.js, MongoDB và EJS.

## ✨ Tính năng

- 🔐 **Đăng nhập/Đăng ký** - Hệ thống xác thực người dùng an toàn
- 💰 **Quản lý giao dịch** - Theo dõi thu nhập và chi tiêu
- 📊 **Ngân sách thông minh** - Đặt giới hạn chi tiêu theo danh mục
- 🎯 **Mục tiêu tài chính** - Theo dõi tiến độ đạt mục tiêu
- 📈 **Dashboard** - Tổng quan tài chính với biểu đồ và thống kê
- 📱 **Responsive** - Giao diện thân thiện trên mọi thiết bị

## 🚀 Cài đặt và chạy

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
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Truy cập ứng dụng:**
   - Mở trình duyệt và truy cập: `http://localhost:3000`

## 📁 Cấu trúc dự án

```
quanlychitieucanhan/
├── models/                 # Mongoose models
│   ├── User.js            # Model người dùng
│   ├── Category.js        # Model danh mục
│   ├── Transaction.js     # Model giao dịch
│   ├── Budget.js          # Model ngân sách
│   ├── Goal.js            # Model mục tiêu
│   └── index.js           # Export tất cả models
├── routes/                 # Express routes
│   ├── index.js           # Trang chủ và dashboard
│   └── auth.js            # Authentication routes
├── views/                  # EJS templates
│   ├── partials/          # Layout components
│   │   ├── navbar.ejs     # Navigation bar
│   │   └── footer.ejs     # Footer
│   ├── auth/              # Authentication views
│   │   ├── login.ejs      # Trang đăng nhập
│   │   └── register.ejs   # Trang đăng ký
│   ├── index.ejs          # Trang chủ
│   ├── dashboard.ejs      # Dashboard
│   └── layout.ejs         # Main layout
├── public/                 # Static files
│   ├── css/
│   │   └── style.css      # Custom styles
│   └── js/
│       └── main.js        # Client-side JavaScript
├── middleware/             # Express middleware
│   └── auth.js            # Authentication middleware
├── .env                    # Environment variables
├── package.json            # Dependencies và scripts
├── server.js               # Main application file
└── README.md               # Documentation
```

## 🔧 Cấu hình

### Biến môi trường (.env)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quanlychitieucanhan
SESSION_SECRET=your-secret-key-here
```

### Cấu hình MongoDB

Ứng dụng sử dụng MongoDB để lưu trữ dữ liệu. Bạn có thể:

1. **MongoDB Local:**
   - Cài đặt MongoDB Community Server
   - Mặc định: `mongodb://localhost:27017/quanlychitieucanhan`

2. **MongoDB Atlas (Cloud):**
   - Tạo cluster trên MongoDB Atlas
   - Lấy connection string và cập nhật `MONGODB_URI`

## 🎨 Giao diện

### Trang chủ
- Landing page với giới thiệu tính năng
- Call-to-action buttons cho đăng ký/đăng nhập

### Đăng nhập/Đăng ký
- Form validation phía client và server
- Password strength indicator
- Responsive design

### Dashboard
- Tổng quan tài chính tháng hiện tại
- Giao dịch gần đây
- Ngân sách và mục tiêu đang hoạt động
- Quick actions

## 🔒 Bảo mật

- **Password hashing** với bcrypt
- **Session-based authentication**
- **Input validation** với express-validator
- **XSS protection** với proper escaping
- **CSRF protection** (có thể thêm sau)

## 📊 API Endpoints

### Authentication
- `GET /auth/login` - Trang đăng nhập
- `POST /auth/login` - Xử lý đăng nhập
- `GET /auth/register` - Trang đăng ký
- `POST /auth/register` - Xử lý đăng ký
- `GET /auth/logout` - Đăng xuất

### Main Routes
- `GET /` - Trang chủ
- `GET /dashboard` - Dashboard (yêu cầu đăng nhập)

## 🚀 Tính năng sắp tới

- [ ] Quản lý danh mục chi tiêu/thu nhập
- [ ] Thêm/sửa/xóa giao dịch
- [ ] Báo cáo và biểu đồ chi tiết
- [ ] Xuất dữ liệu Excel/PDF
- [ ] Nhắc nhở ngân sách
- [ ] Đồng bộ hóa đa thiết bị
- [ ] API RESTful
- [ ] Mobile app

## 🛠️ Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Database:** MongoDB với Mongoose ODM
- **Frontend:** EJS templates, Bootstrap 5, Vanilla JavaScript
- **Authentication:** Session-based với express-session
- **Validation:** express-validator
- **Styling:** Bootstrap 5, Custom CSS
- **Icons:** Font Awesome

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Liên hệ

- Email: your-email@example.com
- GitHub: [your-github-username](https://github.com/your-github-username)
- LinkedIn: [your-linkedin-profile](https://linkedin.com/in/your-linkedin-profile)

---

**Lưu ý:** Đây là phiên bản beta. Một số tính năng có thể chưa hoàn thiện. Vui lòng báo cáo bugs và góp ý để cải thiện ứng dụng!
- `paymentMethod` - Phương thức thanh toán (cash, credit_card, debit_card, bank_transfer, other)
- `note` - Ghi chú
- `tags` - Từ khóa
- `status` - Trạng thái (pending, completed, cancelled)
- `attachments` - Tệp đính kèm

**Chỉ mục:**
- `userId` + `date`
- `userId` + `categoryId`
- `userId` + `type`

---

### 4. **Budget Model** (Budget.js)
Quản lý ngân sách hàng tháng

**Các trường chính:**
- `userId` - ID người dùng
- `categoryId` - ID danh mục
- `name` - Tên ngân sách
- `limitAmount` - Giới hạn chi tiêu
- `spentAmount` - Số tiền đã chi
- `month` - Tháng (YYYY-MM)
- `year` - Năm
- `alertThreshold` - Ngưỡng cảnh báo (0-100%)
- `isAlert` - Đã cảnh báo?
- `status` - Trạng thái (active, completed, paused)

**Các trường ảo (Virtual):**
- `usagePercentage` - Phần trăm đã dùng

**Chỉ mục:**
- `userId` + `month`
- `userId` + `categoryId`

---

### 5. **Goal Model** (Goal.js)
Quản lý mục tiêu tài chính

**Các trường chính:**
- `userId` - ID người dùng
- `name` - Tên mục tiêu
- `description` - Mô tả
- `targetAmount` - Số tiền mục tiêu
- `currentAmount` - Số tiền đã tiết kiệm
- `category` - Loại mục tiêu (savings, investment, education, travel, home, car, health, other)
- `priority` - Ưu tiên (low, medium, high)
- `deadline` - Thời hạn hoàn thành
- `status` - Trạng thái (active, on-hold, completed, cancelled)
- `icon` - Biểu tượng
- `color` - Màu sắc
- `completedAt` - Ngày hoàn thành

**Các trường ảo (Virtual):**
- `progressPercentage` - Phần trăm hoàn thành
- `daysRemaining` - Số ngày còn lại
- `isOverdue` - Đã quá hạn?

**Chỉ mục:**
- `userId` + `status`
- `userId` + `deadline`

---

## Cách sử dụng

### Import các models
```javascript
// Từ file index.js
const { User, Category, Transaction, Budget, Goal } = require('./models');

// Hoặc import trực tiếp
const User = require('./models/User');
const Transaction = require('./models/Transaction');
```

### Ví dụ tạo giao dịch mới
```javascript
const transaction = await Transaction.create({
  userId: '660a1f2b3c4d5e6f7g8h9i0j',
  categoryId: '660a1f2b3c4d5e6f7g8h9i0k',
  amount: 50000,
  type: 'expense',
  description: 'Mua cơm trưa',
  date: new Date(),
  paymentMethod: 'cash'
});
```

### Ví dụ tạo mục tiêu
```javascript
const goal = await Goal.create({
  userId: '660a1f2b3c4d5e6f7g8h9i0j',
  name: 'Tiết kiệm cho du lịch',
  targetAmount: 10000000,
  currentAmount: 0,
  category: 'travel',
  priority: 'high',
  deadline: new Date('2026-12-31')
});
```

---

## Yêu cầu
- Node.js
- MongoDB
- Mongoose
- bcryptjs (để mã hóa mật khẩu)

## Cài đặt dependencies
```bash
npm install mongoose bcryptjs
```
