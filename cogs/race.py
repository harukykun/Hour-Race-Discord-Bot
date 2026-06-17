import asyncio
import discord
from discord.ext import commands
from utils import race_manager, bet_manager
from cogs.ui_components import create_prerace_embed, create_race_start_embed, create_race_result_embed, Colors

class Race(commands.Cog):

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.force_start = False

    @commands.command(name='prerace')
    async def prerace(self, ctx: commands.Context):
        if race_manager.is_race_in_progress():
            await ctx.reply('❌ Đang có cuộc đua diễn ra rồi, đợi xong đã!')
            return
        if race_manager.is_prerace_in_progress():
            await ctx.reply('❌ Cổng cược đang mở rồi, nhanh tay đặt cược đi!')
            return
        try:
            race_manager.set_prerace_status(True)
            self.force_start = False
            horses = race_manager.generate_race_names()
            time_left = 60
            total_time = 60
            embed = create_prerace_embed(horses, time_left, total_time)
            msg = await ctx.reply(embed=embed)
            for _ in range(12):
                if self.force_start:
                    await msg.edit(content='🚫 **ĐÃ ĐÓNG CỔNG ỦNG HỘ SỚM!**', embed=None)
                    break
                await asyncio.sleep(5)
                if self.force_start:
                    await msg.edit(content='🚫 **ĐÃ ĐÓNG CỔNG ỦNG HỘ SỚM!**', embed=None)
                    break
                time_left -= 5
                if time_left > 0:
                    updated_embed = create_prerace_embed(horses, time_left, total_time)
                    await msg.edit(embed=updated_embed)
                else:
                    await msg.edit(content='🚫 **ĐÃ HẾT GIỜ ỦNG HỘ!**', embed=None)
                    await ctx.send('🏁 **Hệ thống tự động bắt đầu Chặng đua!**')
                    await self._run_race(ctx, from_prerace=True)
        except Exception as e:
            print(f'Error in prerace: {e}')
            race_manager.set_prerace_status(False)
            await ctx.reply('❌ Đã xảy ra lỗi khi mở cổng cược.')

    @commands.command(name='race')
    async def race_cmd(self, ctx: commands.Context):
        if not race_manager.is_prerace_in_progress():
            await ctx.reply('❌ Chưa mở cổng ủng hộ! Hãy dùng lệnh `!prerace` trước.')
            return
        if race_manager.is_race_in_progress():
            await ctx.reply('❌ Đang có Chặng đua diễn ra rồi, đợi xong đã!')
            return
        self.force_start = True
        await self._run_race(ctx, from_prerace=False)

    async def _run_race(self, ctx: commands.Context, from_prerace: bool=False):
        try:
            bets = bet_manager.get_all_bets()
            if not bets:
                if from_prerace:
                    race_manager.set_prerace_status(False)
                    await ctx.send('❌ Không có ai cược cả, hủy cuộc đua! Trả lại cổng cược.')
                else:
                    await ctx.reply('❌ Không có bet thủ nào tham gia, lấy ai đua?')
                return
            race_manager.set_race_status(True)
            race_manager.set_prerace_status(False)
            start_embed = create_race_start_embed()
            await ctx.send(embed=start_embed)
            await asyncio.sleep(2)
            positions = [0] * race_manager.HORSE_COUNT
            track_length = race_manager.TRACK_LENGTH
            initial_track = race_manager.create_race_status_message(positions, track_length)
            from cogs.ui_components import create_live_race_embed
            status_msg = await ctx.send(embed=create_live_race_embed(initial_track, '*Các mã nương đã sẵn sàng ở vạch xuất phát!*'))
            commentary_history = ['*Các mã nương đã sẵn sàng ở vạch xuất phát!*']
            while not race_manager.is_race_finished(positions, track_length):
                positions = race_manager.simulate_race_step(positions, track_length)
                new_track = race_manager.create_race_status_message(positions, track_length)
                leader_text = race_manager.create_leading_horse_message(positions)
                commentary_history.append(f'*{leader_text}*')
                if len(commentary_history) > 6:
                    commentary_history.pop(0)
                full_commentary = '\n'.join(commentary_history)
                await status_msg.edit(embed=create_live_race_embed(new_track, full_commentary))
                await asyncio.sleep(3)
            podium = race_manager.get_podium(positions)
            rank1 = podium['rank1']
            rank2 = podium['rank2']
            bet_results = await bet_manager.process_bet_results(rank1, rank2)
            rank1_names = ' và '.join([f'**{race_manager.get_horse_name(num)}** (#{num})' for num in rank1])
            rank2_names = ' và '.join([f'**{race_manager.get_horse_name(num)}** (#{num})' for num in rank2]) if rank2 else 'Không có'
            result_embed = create_race_result_embed(rank1_names, rank2_names, bet_results, race_manager.get_horse_name)
            await ctx.send(embed=result_embed)
        except Exception as e:
            print(f'Error in race loop: {e}')
            await ctx.send('❌ Lỗi cmnr hệ thống đền tiền tự chịu trách nhiệm.')
        finally:
            bet_manager.clear_all_bets()
            race_manager.set_race_status(False)
            race_manager.set_prerace_status(False)

async def setup(bot: commands.Bot):
    await bot.add_cog(Race(bot))