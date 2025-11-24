const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();

// Khởi tạo client với các intents cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Khởi tạo collection để lưu trữ lệnh
client.commands = new Collection();

// Khởi tạo collection để lưu trữ người chơi đã đặt cược
client.bets = new Collection();

// Đường dẫn đến thư mục commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Đăng ký các lệnh
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('name' in command && 'execute' in command) {
    client.commands.set(command.name, command);
    console.log(`[INFO] Đã đăng ký lệnh ${command.name}`);
  } else {
    console.log(`[WARNING] Lệnh tại ${filePath} thiếu thuộc tính 'name' hoặc 'execute'`);
  }
}

// Xử lý sự kiện khi bot sẵn sàng
client.once(Events.ClientReady, () => {
  console.log(`[INFO] Đã đăng nhập với tên ${client.user.tag}`);
});

// Xử lý sự kiện khi có tin nhắn
client.on(Events.MessageCreate, async message => {
  // Bỏ qua tin nhắn từ bot hoặc không bắt đầu bằng !
  if (message.author.bot || !message.content.startsWith('!')) return;

  // Phân tích lệnh và tham số
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Kiểm tra xem lệnh có tồn tại không
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    // Thực thi lệnh
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    await message.reply('Đã xảy ra lỗi khi thực hiện lệnh!');
  }
});

// Đăng nhập vào Discord với token

client.login(process.env.TOKEN);

