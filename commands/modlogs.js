const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const db = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('View recent moderation actions')
        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription('Number of logs to display')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const limit = interaction.options.getInteger('limit') || 10;

        try {
            const result = await db.query(
                `SELECT id, user_id, moderator_id, action, reason, created_at
                 FROM moderation_logs
                 WHERE guild_id = $1
                 ORDER BY created_at DESC
                 LIMIT $2`,
                [interaction.guild.id, limit]
            );

            if (result.rows.length === 0) {
                return interaction.editReply(
                    '📋 There are no moderation logs for this server yet.'
                );
            }

            const logList = result.rows
                .map(log =>
                    `**#${log.id} — ${log.action}**\n` +
                    `User: <@${log.user_id}>\n` +
                    `Moderator: <@${log.moderator_id}>\n` +
                    `Reason: ${log.reason || 'No reason provided'}\n` +
                    `Date: <t:${Math.floor(new Date(log.created_at).getTime() / 1000)}:f>`
                )
                .join('\n\n');

            const logsEmbed = new EmbedBuilder()
                .setTitle('🛡️ Moderation Logs')
                .setDescription(logList)
                .setFooter({
                    text: 'Orefyspace.com Moderation'
                });

            await interaction.editReply({
                embeds: [logsEmbed]
            });

        } catch (error) {
            console.error('Moderation logs database error:', error);

            await interaction.editReply(
                '❌ I could not retrieve the moderation logs.'
            );
        }
    },
};