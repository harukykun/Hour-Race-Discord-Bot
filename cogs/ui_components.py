from __future__ import annotations
from typing import TYPE_CHECKING, Callable
import discord
if TYPE_CHECKING:
    pass

class Colors:
    GOLD = 16766720
    SUCCESS = 3066993
    ERROR = 15158332
    INFO = 3447003
    ALLIN = 16729344
    RACE = 10181046
    WARNING = 16753920
    DARK_GOLD = 12092939

def format_coins(amount: int) -> str:
    return f'{amount:,} coin'

def create_progress_bar(current: int, total: int, length: int=20) -> str:
    if total <= 0:
        return '▱' * length
    ratio = max(0.0, min(1.0, current / total))
    filled = round(ratio * length)
    return '▰' * filled + '▱' * (length - filled)

def create_balance_embed(user: discord.User | discord.Member, balance: int) -> discord.Embed:
    embed = discord.Embed(title='💰 Số Dư Tài Khoản', description=f'```\n╔══════════════════════════╗\n║  🏦  {format_coins(balance):^20s}  ║\n╚══════════════════════════╝\n```', color=Colors.GOLD)
    embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)
    embed.set_footer(text=f'Chủ tài khoản: {user.display_name}', icon_url=user.display_avatar.url)
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_bet_embed(user: discord.User | discord.Member, result: dict, is_all_in: bool, horse_name: str, horse_number: int, bet_amount: int) -> discord.Embed:
    success: bool = result.get('success', False)
    if success and is_all_in:
        embed = discord.Embed(title='🔥🔥🔥 ALL-IN! 🔥🔥🔥', description=f'**{user.display_name}** đã liều mạng ALL-IN!\n\n```diff\n+ Mã Nương #{horse_number} — {horse_name}\n+ Số tiền: {format_coins(bet_amount)}\n```\n*Được ăn cả, ngã ra đê!* 🎰💥', color=Colors.ALLIN)
        embed.set_thumbnail(url=user.display_avatar.url)
    elif success and (not is_all_in):
        embed = discord.Embed(title='🎲 Bet Thành Công!', description=f'**{user.display_name}** đã chọn mã nương!\n\n```yaml\nMã Nương: #{horse_number} — {horse_name}\nBet  : {format_coins(bet_amount)}\n```', color=Colors.SUCCESS)
    else:
        embed = discord.Embed(title='❌ Bet Thất Bại', description=result.get('message', 'Đã xảy ra lỗi.'), color=Colors.ERROR)
    remaining = result.get('balance', 0)
    embed.add_field(name='💼 Số Dư Còn Lại', value=f'**{format_coins(remaining)}**', inline=False)
    embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_daily_embed(user: discord.User | discord.Member, result: dict) -> discord.Embed:
    success: bool = result.get('success', False)
    if success:
        reward = result.get('reward', 0)
        balance = result.get('balance', 0)
        embed = discord.Embed(title='🎁 Quà Hàng Ngày', description=f'Chúc mừng **{user.display_name}**!\n\n```diff\n+ Bạn nhận được: {format_coins(reward)}\n```', color=Colors.SUCCESS)
        embed.add_field(name='🏦 Số Dư Hiện Tại', value=f'**{format_coins(balance)}**', inline=False)
        embed.set_thumbnail(url=user.display_avatar.url)
    else:
        time_remaining = result.get('time_remaining', '???')
        embed = discord.Embed(title='⏰ Chưa Đến Giờ Nhận Quà', description=f'**{user.display_name}**, bạn đã nhận quà hôm nay rồi!\n\n```\n⏳ Thời gian còn lại: {time_remaining}\n```\n*Hãy quay lại sau nhé!* 😊', color=Colors.ERROR)
    embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_help_embed(horse_count: int) -> discord.Embed:
    embed = discord.Embed(title='🏇 Bot Uma Musume — Hướng Dẫn', description='Chào bạn **Mambo** đây! 🎉\nDưới đây là danh sách các lệnh bạn có thể sử dụng.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color=Colors.INFO)
    embed.add_field(name='📋 `!prerace`', value='Bắt đầu giai đoạn chuẩn bị đua.\nHiển thị danh sách mã nương và mở Bet.', inline=False)
    embed.add_field(name='🚀 `!race`', value='Bỏ qua đếm ngược và cho xuất phát luôn!\n(Chỉ dùng khi đang trong giai đoạn `!prerace`)', inline=False)
    embed.add_field(name=f'🎲 `!bet <1-{horse_count}> <số coin | all>`', value='Bet cho mã nương yêu thích.\nDùng `all` để **ALL-IN** 🔥', inline=False)
    embed.add_field(name='💰 `!balance`', value='Xem số dư tài khoản hiện tại.', inline=False)
    embed.add_field(name='🏆 `!leaderboard`', value='Xem bảng xếp hạng đại gia.', inline=False)
    embed.add_field(name='🎁 `!daily`', value='Nhận quà hàng ngày (mỗi 24 giờ).', inline=False)
    embed.set_footer(text='💡 Tip: Dùng !prerace để bắt đầu một chặng đua mới!')
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_leaderboard_embed(entries: list[tuple[str, int]]) -> discord.Embed:
    medals = {1: '🥇', 2: '🥈', 3: '🥉'}
    lines: list[str] = []
    for rank, (name, balance) in enumerate(entries, start=1):
        medal = medals.get(rank, f'`#{rank}`')
        lines.append(f'{medal} **{name}** — {format_coins(balance)}')
        lines.append('┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈')
    if not lines:
        description = '*Chưa có ai trong bảng xếp hạng.*'
    else:
        description = '\n'.join(lines[:-1])
    embed = discord.Embed(title='🏆 Bảng Xếp Hạng Bét Thủ', description=description, color=Colors.GOLD)
    embed.set_footer(text=f'Tổng cộng {len(entries)} Bét Thủ trong bảng xếp hạng.')
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_prerace_embed(horses: dict[int, str], time_left: int, total_time: int=60) -> discord.Embed:
    color = Colors.ERROR if time_left <= 10 else Colors.WARNING
    bar = create_progress_bar(time_left, total_time)
    horse_list = '\n'.join((f'` {num} ` 🏇 **{name}**' for num, name in sorted(horses.items())))
    embed = discord.Embed(title='📋 DANH SÁCH CÁC MÃ NƯƠNG — CHUẨN BỊ KHỞI TRANH', description=f'```\n⏱️ Còn lại: {time_left}s\n{bar}\n```\n\n{horse_list}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎲 Dùng `!bet <stt mã nương> <coin | all>` để Bet!', color=color)
    embed.set_footer(text='Chặng đua sẽ bắt đầu khi hết thời gian chuẩn bị!')
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_race_start_embed() -> discord.Embed:
    embed = discord.Embed(title='🏇 CHẶNG ĐUA BẮT ĐẦU!', description='```\n🔔🔔🔔  XUẤT PHÁT!  🔔🔔🔔\n```\n\nCác mã nương đã vào vạch xuất phát…\n**Cổng đã mở — Mã Nương phi nước đại!** 🐎💨\n\n*Hãy cổ vũ cho mã nương của bạn!*', color=Colors.RACE)
    embed.timestamp = discord.utils.utcnow()
    return embed

def create_live_race_embed(track_content: str, leader_text: str=None) -> discord.Embed:
    embed = discord.Embed(color=Colors.RACE, description=track_content)
    if leader_text:
        embed.add_field(name='🎙️ Bình Luận Trực Tiếp', value=leader_text, inline=False)
    return embed

def create_race_result_embed(rank1_names: str, rank2_names: str, bet_results: list[dict], get_horse_name_func: Callable[[int], str]) -> discord.Embed:
    embed = discord.Embed(title='🏁 KẾT QUẢ CHUNG CUỘC', description=f'🥇 Hạng 1 (x3.6): {rank1_names}\n🥈 Hạng 2 (x2.0): {rank2_names}', color=Colors.GOLD)
    top1_winners: list[str] = []
    top2_winners: list[str] = []
    allin_losers: list[str] = []
    for br in bet_results:
        name: str = br.get('user_name', '???')
        horse_num: int = br.get('horse_number', 0)
        horse_name: str = get_horse_name_func(horse_num)
        bet_amt: int = br.get('bet_amount', 0)
        payout: int = br.get('payout', 0)
        rank: int | None = br.get('rank')
        is_all_in: bool = br.get('is_all_in', False)
        if rank == 1:
            line = f'**{name}** — #{horse_num} {horse_name}\nCược {format_coins(bet_amt)} → Nhận **{format_coins(payout)}**'
            top1_winners.append(line)
        elif rank == 2:
            line = f'**{name}** — #{horse_num} {horse_name}\nCược {format_coins(bet_amt)} → Nhận **{format_coins(payout)}**'
            top2_winners.append(line)
        elif is_all_in and rank is None:
            line = f'**{name}** — mất {format_coins(bet_amt)}'
            allin_losers.append(line)
    if top1_winners:
        embed.add_field(name='🤑 Bet thủ Hạng 1 (x3.6)', value='\n\n'.join(top1_winners), inline=False)
    if top2_winners:
        embed.add_field(name='😋 Bet thủ Hạng 2 (x2.0)', value='\n\n'.join(top2_winners), inline=False)
    if allin_losers:
        embed.add_field(name='💀 Đổi Đời Thất Bại', value='\n'.join(allin_losers), inline=False)
    if not top1_winners and (not top2_winners):
        embed.add_field(name='🏠 Nhà Cái', value='**Nhà cái húp trọn!** 🤣', inline=False)
    embed.set_footer(text='Dùng !prerace để bắt đầu Chặng đua mới!')
    embed.timestamp = discord.utils.utcnow()
    return embed