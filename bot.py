import os
import asyncio
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import discord
from discord.ext import commands
from dotenv import load_dotenv
from utils.db import init_db, close_db
load_dotenv()
TOKEN = os.getenv('TOKEN')
DATABASE_URL = os.getenv('DATABASE_URL')
PORT = int(os.getenv('PORT', 8080))
ALLOWED_CHANNELS_ENV = os.getenv('ALLOWED_CHANNEL_ID', '')
ALLOWED_CHANNELS = [cid.strip() for cid in ALLOWED_CHANNELS_ENV.split(',') if cid.strip()]
if not TOKEN:
    raise RuntimeError('❌ Thiếu biến môi trường TOKEN! Hãy thêm vào file .env')
if not DATABASE_URL:
    raise RuntimeError('❌ Thiếu biến môi trường DATABASE_URL! Hãy thêm vào file .env')

class HealthHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.write(b'Bot is running')

    def write(self, data: bytes):
        self.wfile.write(data)

    def log_message(self, format, *args):
        pass

def _start_health_server(port: int) -> None:
    server = HTTPServer(('0.0.0.0', port), HealthHandler)
    server.serve_forever()
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix='!', intents=intents, help_command=None)
EXTENSIONS = ['cogs.economy', 'cogs.betting', 'cogs.race', 'cogs.info']

@bot.event
async def on_ready():
    print(f'✅ Bot đã sẵn sàng! Đăng nhập với tên: {bot.user}')
    print(f'📡 Đang phục vụ {len(bot.guilds)} server(s)')

@bot.check
async def globally_block_channels(ctx: commands.Context):
    if not ALLOWED_CHANNELS:
        return True
    return str(ctx.channel.id) in ALLOWED_CHANNELS

@bot.event
async def on_command_error(ctx: commands.Context, error: commands.CommandError):
    if isinstance(error, commands.CheckFailure):
        return
    if isinstance(error, commands.CommandNotFound):
        return
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.reply(f'❌ Thiếu tham số: `{error.param.name}`. Dùng `!help` để xem hướng dẫn.')
        return
    print(f'❌ Lỗi lệnh {ctx.command}: {error}')
    await ctx.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh.')

async def main():
    print('🔌 Đang kết nối PostgreSQL...')
    await init_db(DATABASE_URL)
    for ext in EXTENSIONS:
        try:
            await bot.load_extension(ext)
            print(f'  ✅ Loaded: {ext}')
        except Exception as e:
            print(f'  ❌ Failed to load {ext}: {e}')
    health_thread = threading.Thread(target=_start_health_server, args=(PORT,), daemon=True)
    health_thread.start()
    print(f'🌐 Health check server đang lắng nghe tại cổng {PORT}')
    try:
        await bot.start(TOKEN)
    finally:
        await close_db()
if __name__ == '__main__':
    asyncio.run(main())