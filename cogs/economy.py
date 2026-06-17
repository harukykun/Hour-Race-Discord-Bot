import discord
from discord.ext import commands
from utils import player_manager
from cogs.ui_components import create_balance_embed, create_daily_embed

class Economy(commands.Cog):

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name='balance')
    async def balance(self, ctx: commands.Context):
        try:
            player = await player_manager.get_player(str(ctx.author.id))
            embed = create_balance_embed(ctx.author, player['balance'])
            await ctx.reply(embed=embed)
        except Exception as e:
            print(f'Error in balance command: {e}')
            await ctx.reply('❌ Đã xảy ra lỗi khi kiểm tra số dư.')

    @commands.command(name='daily')
    async def daily(self, ctx: commands.Context):
        try:
            result = await player_manager.claim_daily(str(ctx.author.id))
            embed = create_daily_embed(ctx.author, result)
            await ctx.reply(embed=embed)
        except Exception as e:
            print(f'Error in daily command: {e}')
            await ctx.reply('❌ Đã xảy ra lỗi khi điểm danh.')

async def setup(bot: commands.Bot):
    await bot.add_cog(Economy(bot))