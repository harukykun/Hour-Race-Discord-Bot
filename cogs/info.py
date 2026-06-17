import discord
from discord.ext import commands
from utils import player_manager, race_manager
from cogs.ui_components import create_help_embed, create_leaderboard_embed

class Info(commands.Cog):

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name='help')
    async def help_command(self, ctx: commands.Context):
        try:
            embed = create_help_embed(race_manager.HORSE_COUNT)
            await ctx.reply(embed=embed)
        except Exception as e:
            print(f'Error in help command: {e}')
            await ctx.reply('❌ Đã xảy ra lỗi khi hiển thị hướng dẫn.')

    @commands.command(name='leaderboard')
    async def leaderboard(self, ctx: commands.Context):
        try:
            top_players = await player_manager.get_leaderboard(10)
            if not top_players:
                await ctx.reply('❌ Chưa có bet thủ nào trong bảng xếp hạng.')
                return
            entries = []
            for player in top_players:
                user_id = int(player['user_id'])
                balance = player['balance']
                user = self.bot.get_user(user_id)
                if not user:
                    try:
                        user = await self.bot.fetch_user(user_id)
                    except discord.NotFound:
                        user = None
                username = user.display_name if user else f'ID: {user_id}'
                entries.append((username, balance))
            embed = create_leaderboard_embed(entries)
            await ctx.reply(embed=embed)
        except Exception as e:
            print(f'Error in leaderboard command: {e}')
            await ctx.reply('❌ Đã xảy ra lỗi khi tải bảng xếp hạng.')

async def setup(bot: commands.Bot):
    await bot.add_cog(Info(bot))