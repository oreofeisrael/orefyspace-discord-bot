const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if Orefyspace.com is online'),

    async execute(interaction) {
        await interaction.reply('🏓 Pong! Orefyspace.com is online.');
    },
};