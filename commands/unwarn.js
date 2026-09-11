const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const db = require('../database');
const { logModerationAction } = require('../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remove a warning from a member')
        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('The warning ID to remove')
                .setMinValue(1)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const warningId = interaction.options.getInteger('id');

        try {
            const result = await db.query(
                `SELECT *
                 FROM warnings
                 WHERE id = $1 AND guild_id = $2`,
                [warningId, interaction.guild.id]
            );

            if (result.rows.length === 0) {
                return interaction.editReply(
                    `❌ Warning #${warningId} was not found in this server.`
                );
            }

            const warning = result.rows[0];

            const member = await interaction.guild.members
                .fetch(warning.user_id)
                .catch(() => null);

            if (member) {
                if (member.id === interaction.user.id) {
                    return interaction.editReply(
                        '❌ You cannot remove your own warning.'
                    );
                }

                if (member.id === interaction.client.user.id) {
                    return interaction.editReply(
                        '❌ I cannot have warnings removed.'
                    );
                }

                if (member.id === interaction.guild.ownerId) {
                    return interaction.editReply(
                        '❌ The server owner cannot have warnings removed.'
                    );
                }

                if (
                    member.roles.highest.position >=
                    interaction.member.roles.highest.position
                ) {
                    return interaction.editReply(
                        '❌ You cannot remove warnings for a member with an equal or higher role than yours.'
                    );
                }
            }

            await db.query(
                `DELETE FROM warnings
                 WHERE id = $1 AND guild_id = $2`,
                [warningId, interaction.guild.id]
            );

            await logModerationAction({
                guildId: interaction.guild.id,
                userId: warning.user_id,
                moderatorId: interaction.user.id,
                action: 'UNWARN',
                reason: warning.reason
            });

            await interaction.editReply(
                `✅ **Warning #${warning.id}** has been removed.\n` +
                `**Reason:** ${warning.reason}`
            );

        } catch (error) {
            console.error('Unwarn database error:', error);

            await interaction.editReply(
                '❌ I could not remove that warning.'
            );
        }
    },
};