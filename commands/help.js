const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View Orefyspace.com bot commands'),

    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🤖 Orefyspace.com')
            .setDescription('Here are the commands currently available:')
            .addFields(
                {
                    name: '🏓 General',
                    value: '`/ping` — Check if the bot is online\n`/help` — View this help menu'
                }
            )
            .setFooter({
                text: 'Orefyspace.com • More features coming soon'
            });

        await interaction.editReply({
            embeds: [helpEmbed]
        });
    },
};