import math
from typing import Optional
from utils import race_manager, player_manager
TOP1_MULTIPLIER: float = 3.6
TOP2_MULTIPLIER: float = 2.0
MAX_BETS_PER_USER: int = 3
_bets: dict[str, list[dict]] = {}

async def get_balance(user_id: str) -> int:
    player = await player_manager.get_player(user_id)
    return player['balance'] if player else 0

async def place_bet(user_id: str, horse_number: int, amount: int, is_all_in: bool=False) -> dict:
    if race_manager.is_race_in_progress():
        return {'success': False, 'message': 'Không thể đặt cược khi cuộc đua đang diễn ra!'}
    user_bets: list[dict] = _bets.get(user_id, [])
    if len(user_bets) >= MAX_BETS_PER_USER:
        return {'success': False, 'message': 'Bạn chỉ được cược tối đa 3 mã ngựa!'}
    if horse_number < 1 or horse_number > race_manager.HORSE_COUNT:
        return {'success': False, 'message': 'Số mã nương không hợp lệ.'}
    if amount <= 0:
        return {'success': False, 'message': 'Tiền cược phải lớn hơn 0.'}
    if not await player_manager.has_enough_balance(user_id, amount):
        player = await player_manager.get_player(user_id)
        balance = player['balance'] if player else 0
        return {'success': False, 'message': f'Không đủ tiền. Số dư: {balance}.'}
    new_balance: int = await player_manager.update_balance(user_id, -amount)
    user_bets.append({'horse_number': horse_number, 'amount': amount, 'is_all_in': is_all_in})
    _bets[user_id] = user_bets
    return {'success': True, 'message': f'Đã ủng hộ thêm **{amount} coin** cho mã nương **{horse_number}**. (Vé {len(user_bets)}/{MAX_BETS_PER_USER})\nSố dư còn lại: {new_balance}.', 'balance': new_balance}

def get_bet(user_id: str) -> Optional[list[dict]]:
    return _bets.get(user_id) or None

def get_all_bets() -> dict[str, list[dict]]:
    return _bets

def clear_all_bets() -> None:
    _bets.clear()

async def process_bet_results(rank1_horses: list[int], rank2_horses: list[int]) -> list[dict]:
    results: list[dict] = []
    for user_id, user_bets in _bets.items():
        for bet in user_bets:
            horse_number: int = bet['horse_number']
            amount: int = bet['amount']
            is_all_in: bool = bet['is_all_in']
            win_amount: int = 0
            won: bool = False
            rank_type: Optional[str] = None
            if horse_number in rank1_horses:
                won = True
                win_amount = math.floor(amount * TOP1_MULTIPLIER)
                rank_type = 'top1'
            elif horse_number in rank2_horses:
                won = True
                win_amount = math.floor(amount * TOP2_MULTIPLIER)
                rank_type = 'top2'
            if won:
                new_balance = await player_manager.update_balance(user_id, win_amount)
                results.append({'userId': user_id, 'won': True, 'horseNumber': horse_number, 'betAmount': amount, 'winAmount': win_amount, 'newBalance': new_balance, 'isAllIn': is_all_in, 'rankType': rank_type})
            else:
                player = await player_manager.get_player(user_id)
                current_balance = player['balance'] if player else 0
                results.append({'userId': user_id, 'won': False, 'horseNumber': horse_number, 'betAmount': amount, 'winAmount': 0, 'newBalance': current_balance, 'isAllIn': is_all_in, 'rankType': None})
    return results