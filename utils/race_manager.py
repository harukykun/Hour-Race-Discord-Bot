import random
from typing import Optional
HORSE_COUNT = 10
TRACK_LENGTH = 15
HORSE_EMOJI = '🏇'
FINISH_EMOJI = '🏁'
HORSE_NAMES_POOL = ['Special Week', 'Silence Suzuka', 'Tokai Teio', 'Mejiro McQueen', 'Gold Ship', 'Vodka', 'Daiwa Scarlet', 'Oguri Cap', 'Symboli Rudolf', 'Rice Shower', 'Grass Wonder', 'El Condor Pasa', 'Air Groove', 'Mayano Top Gun', 'Mihono Bourbon', 'Mejiro Ryan', 'Hishi Amazon', 'Fuji Kiseki', 'Maruzensky', 'Seiun Sky', 'Biwa Hayahide', 'Narita Taishin', 'Winning Ticket', 'Tamamo Cross', 'Super Creek', 'Inari One', 'Haru Urara', 'Twin Turbo', 'Nice Nature', 'Kitasan Black', 'Satono Diamond', 'Curren Chan', 'Agnes Tachyon', 'Manhattan Cafe', 'King Halo', 'Matikanetannhauser', 'Machikane Fukukitaru', 'Narita Brian', 'T.M. Opera O', 'Admire Vega', 'Still in Love', 'Meisho Doto', 'Gentildonna', 'Stay Gold', 'Orfevre', 'Duramente']
_race_in_progress: bool = False
_prerace_in_progress: bool = False
_current_race_names: dict[int, str] = {}

def is_race_in_progress() -> bool:
    return _race_in_progress

def set_race_status(status: bool) -> None:
    global _race_in_progress
    _race_in_progress = status

def is_prerace_in_progress() -> bool:
    return _prerace_in_progress

def set_prerace_status(status: bool) -> None:
    global _prerace_in_progress
    _prerace_in_progress = status

def generate_race_names() -> dict[int, str]:
    global _current_race_names
    _current_race_names = {}
    available = list(HORSE_NAMES_POOL)
    for i in range(1, HORSE_COUNT + 1):
        name = random.choice(available)
        _current_race_names[i] = name
        available.remove(name)
    return _current_race_names

def get_horse_name(number: int) -> str:
    if not _current_race_names:
        generate_race_names()
    return _current_race_names.get(number, f'Mã Nương số {number}')

def get_current_names() -> dict[int, str]:
    if not _current_race_names:
        generate_race_names()
    return _current_race_names

def simulate_race_step(positions: list[int], track_length: int=TRACK_LENGTH) -> list[int]:
    new_positions = list(positions)
    for i in range(HORSE_COUNT):
        if new_positions[i] < track_length - 1:
            chance = random.random()
            if chance < 0.6:
                new_positions[i] += 1
            elif chance < 0.9:
                new_positions[i] += 2
            if new_positions[i] >= track_length - 1:
                new_positions[i] = track_length - 1
    return new_positions

def is_race_finished(positions: list[int], track_length: int=TRACK_LENGTH) -> bool:
    return any((pos >= track_length - 1 for pos in positions))

def get_podium(positions: list[int]) -> dict[str, list[int]]:
    horses = [{'id': i + 1, 'pos': pos} for i, pos in enumerate(positions)]
    horses.sort(key=lambda h: h['pos'], reverse=True)
    max_pos = horses[0]['pos']
    rank1 = [h['id'] for h in horses if h['pos'] == max_pos]
    remaining = [h for h in horses if h['pos'] < max_pos]
    rank2 = []
    if remaining:
        second_max = remaining[0]['pos']
        rank2 = [h['id'] for h in remaining if h['pos'] == second_max]
    return {'rank1': rank1, 'rank2': rank2}

def create_race_status_message(positions: list[int], track_length: int=TRACK_LENGTH) -> str:
    lines = ['🏁 **CUỘC ĐUA ĐANG DIỄN RA!** 🏁', '']
    for i in range(HORSE_COUNT):
        pos = positions[i]
        horse_num = i + 1
        name = get_horse_name(horse_num)
        track_chars = []
        for j in range(track_length):
            if j == pos:
                track_chars.append(HORSE_EMOJI)
            else:
                track_chars.append('▪️' if j % 2 == 0 else '▫️')
        track = ''.join(track_chars)
        finished = f' {FINISH_EMOJI}' if pos >= track_length - 1 else ''
        num_str = f'`#{horse_num:>2}`'
        lines.append(f'{num_str} {track}{finished}')
    return '\n'.join(lines)

def create_leading_horse_message(positions: list[int]) -> str:
    max_pos = max(positions)
    leading = [i + 1 for i, pos in enumerate(positions) if pos == max_pos]
    names = [f'**{get_horse_name(num)}** (#{num})' for num in leading]
    if max_pos == 0:
        return 'Tất cả đang xuất phát rất đều nhau!'
    if len(names) == 1:
        templates = ['{horse} đang bứt phá lên dẫn đầu!', 'Tốc độ kinh hoàng! {horse} đang dẫn trước!', 'Kỹ năng tuyệt vời! {horse} đang giữ vị trí số 1!', 'Khoảng cách đang dần thu hẹp nhưng {horse} vẫn dẫn đầu!', 'Sức mạnh vô song của {horse} đang làm chủ đường đua!', 'Cả khán đài đang nín thở! {horse} dẫn đầu vươn lên!', 'Thật không thể tin nổi, {horse} đang chạy như bay ở vị trí top 1!']
        return f'🏇💨 {random.choice(templates).format(horse=names[0])}'
    else:
        joined_names = ' và '.join(names)
        templates = ['{horses} đang so kè từng centimet một!', 'Cuộc đua đang vô cùng gay cấn giữa {horses}!', 'Không ai nhường ai! {horses} cùng dẫn đầu!', 'Sự cạnh tranh khốc liệt! {horses} đang chạy song song nhau!', 'Vị trí top 1 đang bị giằng co giữa {horses}!']
        return f'🏇💨 {random.choice(templates).format(horses=joined_names)}'

def reset_state() -> None:
    global _race_in_progress, _prerace_in_progress, _current_race_names
    _race_in_progress = False
    _prerace_in_progress = False
    _current_race_names = {}