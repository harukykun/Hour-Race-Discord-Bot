# 🏇 Horse Race Discord Bot

<div align="center">

![Horse Racing](https://img.shields.io/badge/🐎-Horse%20Racing-success?style=for-the-badge)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

**Bot Discord đua ngựa cá cược vui nhộn được xây dựng bằng Node.js và discord.js v14**

*this whole project is done by claude 🤣*

</div>

---

## ✨ Tính năng chính

🎯 **Đặt cược thông minh** - Đặt cược vào ngựa yêu thích (1-5) với chiến lược riêng

🏁 **Đua ngựa sống động** - Mô phỏng cuộc đua ngựa với hiệu ứng trực quan hấp dẫn

💰 **Hệ thống tiền tệ** - Bắt đầu với 1000 coin, thắng nhận gấp đôi số cược

🎁 **Quà hàng ngày** - Nhận 500 coin miễn phí mỗi ngày

🏆 **Bảng xếp hạng** - Cạnh tranh với bạn bè để trở thành người giàu nhất

---

## 🚀 Cài đặt nhanh

### Yêu cầu hệ thống
- **Node.js** v16.9.0 trở lên
- **npm** hoặc **yarn**

### 📦 Bước 1: Clone dự án
```bash
git clone https://github.com/Hungvip69/Horse-race-bot-discord
cd Horse-race-bot-discord
```

### 📋 Bước 2: Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### ⚙️ Bước 3: Cấu hình bot
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_bot_client_id_here
```

### 🎮 Bước 4: Khởi chạy bot
```bash
npm start
# hoặc
node index.js
```

---

## 🎯 Hướng dẫn sử dụng

> **Prefix:** `!` - Sử dụng cho tất cả các lệnh

### 📋 Danh sách lệnh

| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `!bet <ngựa> <số_tiền>` | Đặt cược vào ngựa (1-5) | `!bet 3 100` |
| `!race` | Bắt đầu cuộc đua ngựa | `!race` |
| `!balance` | Kiểm tra số dư hiện tại | `!balance` |
| `!leaderboard` | Xem bảng xếp hạng | `!leaderboard` |
| `!daily` | Nhận quà tặng hàng ngày | `!daily` |
| `!help` | Hiển thị trợ giúp | `!help` |

### 🎲 Luật chơi

1. 💰 **Vốn khởi đầu:** Mỗi người chơi nhận 1000 coin
2. 🎯 **Đặt cược:** Chọn ngựa số 1-5 và đặt cược
3. 🏁 **Bắt đầu đua:** Sử dụng `!race` để khởi động cuộc đua
4. 🏆 **Thắng cược:** Nhận gấp đôi số tiền đã cược
5. 💸 **Thua cược:** Mất toàn bộ số tiền đã đặt
6. 🎁 **Quà hàng ngày:** 500 coin miễn phí mỗi 24 giờ

---

## 📁 Cấu trúc dự án

```
bot-horse-race/
├── 📂 commands/           # Các lệnh của bot
│   ├── 💰 balance.js      # Kiểm tra số dư
│   ├── 🎯 bet.js          # Đặt cược
│   ├── 🎁 daily.js        # Quà hàng ngày
│   ├── ❓ help.js         # Trợ giúp
│   ├── 🏆 leaderboard.js  # Bảng xếp hạng
│   └── 🏇 race.js         # Đua ngựa
├── 📂 data/               # Dữ liệu lưu trữ
│   └── 👥 players.json    # Thông tin người chơi
├── 📂 utils/              # Tiện ích hỗ trợ
│   ├── 🎲 betManager.js   # Quản lý cược
│   ├── 👤 playerManager.js # Quản lý người chơi
│   └── 🏁 raceManager.js  # Quản lý đua ngựa
├── 🔧 .env                # Cấu hình môi trường
├── 📝 .env.example        # Mẫu cấu hình
├── 🚫 .gitignore          # Loại trừ file
├── ⚡ index.js            # File khởi chạy chính
├── 📦 package.json        # Thông tin dự án
└── 📖 README.md           # Tài liệu hướng dẫn
```

---

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng! 

### Cách đóng góp:
1. 🍴 Fork dự án này
2. 🌿 Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push lên branch (`git push origin feature/AmazingFeature`)
5. 🔄 Mở Pull Request

### Báo lỗi:
- 🐛 Tạo **Issue** mới với mô tả chi tiết
- 💡 Đề xuất tính năng mới
- 📝 Cải thiện tài liệu

---

## 📄 Giấy phép

Dự án này được phân phối dưới **Giấy phép ISC**.

---

<div align="center">

### 🌟 Nếu bạn thấy dự án hữu ích, hãy cho một Star! ⭐

**Made with 💖 by [Hungvip69](https://github.com/Hungvip69)**

</div>
