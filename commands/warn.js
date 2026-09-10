const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const db = require('../database');
const { logModerationAction } = require('../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member and save the warning')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member you want to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        if (!member) {
            return interaction.reply({
                content: '❌ I could not find that member.',
                ephemeral: true
            });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn yourself.',
                ephemeral: true
            });
        }

        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot warn myself.',
                ephemeral: true
            });
        }

        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: '❌ The server owner cannot be warned.',
                ephemeral: true
            });
        }

        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.reply({
                content: '❌ You cannot warn a member with an equal or higher role than yours.',
                ephemeral: true
            });
        }

        try {
            await db.query(
                `INSERT INTO warnings (guild_id, user_id, moderator_id, reason)
                 VALUES ($1, $2, $3, $4)`,
                [
                    interaction.guild.id,
                    member.id,
                    interaction.user.id,
                    reason
                ]
            );

            await logModerationAction({
                guildId: interaction.guild.id,
                userId: member.id,
                moderatorId: interaction.user.id,
                action: 'WARN',
                reason
            });

            await interaction.reply(
                `⚠️ **${member.user.tag}** has been warned.\n` +
                `**Reason:** ${reason}`
            );
        } catch (error) {
            console.error('Warning database error:', error);

            await interaction.reply({
                content: '❌ I could not save the warning to the database.',
                ephemeral: true
            });
        }
    },
};