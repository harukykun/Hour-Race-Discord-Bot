import discord
from discord.ext import commands
from utils import bet_manager, race_manager
from cogs.ui_components import create_bet_embed

class Betting(commands.Cog):

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name='bet')
    async def bet(self, ctx: commands.Context, *args):
        if len(args) < 2:
            await ctx.reply('❌ Sai Syntax. Sử dụng: `!bet <số_mã_nương> <tiền>` hoặc `!bet <số_mã_nương> allin`')
            return
        try:
            horse_number = int(args[0])
            user_id = str(ctx.author.id)
            is_all_in = False
            amount_str = args[1].lower()
            if amount_str == 'allin' or amount_str == 'all':
                is_all_in = True
                amount = await bet_manager.get_balance(user_id)
            else:
                amount = int(args[1])
            if amount <= 0:
                await ctx.reply('❌ Trắng dé rồi thì không có quyền all in nhá cu?')
                return
            result = await bet_manager.place_bet(user_id, horse_number, amount, is_all_in)
            horse_name = ''
            if result['success']:
                horse_name = race_manager.get_horse_name(horse_number)
            embed = create_bet_embed(ctx.author, result, is_all_in, horse_name, horse_number, amount)
            await ctx.reply(embed=embed)
        except ValueError:
            await ctx.reply('❌ Số liệu không hợp lệ. Số mã nương và số tiền phải là số nguyên dương.')
        except Exception as e:
            print(f'Error in bet command: {e}')
            await ctx.reply('❌ Đã xảy ra lỗi khi đặt cược.')

async def setup(bot: commands.Bot):
    await bot.add_cog(Betting(bot))