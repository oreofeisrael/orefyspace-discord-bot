const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testmod')
        .setDescription('Check Orefyspace.com moderation permissions'),

    async execute(interaction) {
        const permissions = interaction.guild.members.me.permissions;

        const kick = permissions.has(PermissionFlagsBits.KickMembers);
        const ban = permissions.has(PermissionFlagsBits.BanMembers);
        const timeout = permissions.has(PermissionFlagsBits.ModerateMembers);

        await interaction.reply(
            `🛡️ **Orefyspace.com Moderation Check**\n\n` +
            `${kick ? '✅' : '❌'} Kick Members\n` +
            `${ban ? '✅' : '❌'} Ban Members\n` +
            `${timeout ? '✅' : '❌'} Timeout Members`
        );
    },
};