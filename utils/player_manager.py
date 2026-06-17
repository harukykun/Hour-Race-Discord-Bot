from datetime import datetime, timezone, timedelta
from typing import Any
from utils.db import get_pool
DEFAULT_BALANCE: int = 10000000
'Số dư mặc định khi tạo người chơi mới.'
DAILY_REWARD: int = 1000000
'Phần thưởng điểm danh hàng ngày.'

def _record_to_dict(record) -> dict[str, Any]:
    return {'user_id': record['user_id'], 'balance': record['balance'], 'last_daily': record['last_daily']}

async def get_player(user_id: str) -> dict[str, Any]:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow('SELECT user_id, balance, last_daily FROM players WHERE user_id = $1', user_id)
        if row is not None:
            return _record_to_dict(row)
        row = await conn.fetchrow('INSERT INTO players (user_id, balance) VALUES ($1, $2) RETURNING user_id, balance, last_daily', user_id, DEFAULT_BALANCE)
        return _record_to_dict(row)

async def update_balance(user_id: str, amount: int) -> int:
    await get_player(user_id)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow('UPDATE players SET balance = GREATEST(0, balance + $1) WHERE user_id = $2 RETURNING balance', amount, user_id)
        return row['balance']

async def has_enough_balance(user_id: str, amount: int) -> bool:
    player = await get_player(user_id)
    return player['balance'] >= amount

async def claim_daily(user_id: str) -> dict[str, Any]:
    player = await get_player(user_id)
    now = datetime.now(timezone.utc)
    last_daily = player['last_daily']
    if last_daily is not None:
        if last_daily.date() == now.date():
            tomorrow = datetime.combine(now.date() + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
            remaining = tomorrow - now
            hours, remainder = divmod(int(remaining.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)
            return {'success': False, 'time_remaining': f'{hours} giờ {minutes} phút {seconds} giây', 'message': f'Bạn đã điểm danh hôm nay rồi! Quay lại sau {hours} giờ {minutes} phút {seconds} giây.', 'balance': player['balance']}
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow('UPDATE players SET balance = balance + $1, last_daily = $2 WHERE user_id = $3 RETURNING balance', DAILY_REWARD, now, user_id)
    new_balance: int = row['balance']
    return {'success': True, 'reward': DAILY_REWARD, 'message': f'Điểm danh thành công ngày {now.day}/{now.month}! Bạn nhận được 🪙 {DAILY_REWARD:,} xu.', 'balance': new_balance}

async def get_leaderboard(limit: int=10) -> list[dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT user_id, balance FROM players ORDER BY balance DESC LIMIT $1', limit)
    return [{'user_id': r['user_id'], 'balance': r['balance']} for r in rows]