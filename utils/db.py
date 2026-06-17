import asyncpg
from typing import Optional
_pool: Optional[asyncpg.Pool] = None
_SCHEMA_SQL = '\nCREATE TABLE IF NOT EXISTS players (\n    user_id   TEXT PRIMARY KEY,\n    balance   BIGINT NOT NULL DEFAULT 10000000,\n    last_daily TIMESTAMPTZ DEFAULT NULL\n);\n'

async def init_db(database_url: str) -> asyncpg.Pool:
    global _pool
    _pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)
    async with _pool.acquire() as conn:
        await conn.execute(_SCHEMA_SQL)
    print('✅ Kết nối PostgreSQL thành công!')
    return _pool

async def close_db() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        print('🔌 Đã đóng kết nối PostgreSQL.')

def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError('Database chưa được khởi tạo. Gọi init_db() trước.')
    return _pool