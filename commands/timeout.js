const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { logModerationAction } = require('../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Temporarily timeout a member')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member you want to timeout')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('minutes')
                .setDescription('How many minutes the timeout should last')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const minutes = interaction.options.getInteger('minutes');
        const reason =
            interaction.options.getString('reason') ||
            'No reason provided';

        if (!member) {
            return interaction.editReply(
                '❌ I could not find that member.'
            );
        }

        if (member.id === interaction.user.id) {
            return interaction.editReply(
                '❌ You cannot timeout yourself.'
            );
        }

        if (member.id === interaction.client.user.id) {
            return interaction.editReply(
                '❌ I cannot timeout myself.'
            );
        }

        if (member.id === interaction.guild.ownerId) {
            return interaction.editReply(
                '❌ The server owner cannot be timed out.'
            );
        }

        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.editReply(
                '❌ You cannot timeout a member with an equal or higher role than yours.'
            );
        }

        if (!member.moderatable) {
            return interaction.editReply(
                '❌ I cannot timeout this member because their highest role is equal to or higher than mine.'
            );
        }

        try {
            await member.timeout(minutes * 60 * 1000, reason);

            await logModerationAction({
                guildId: interaction.guild.id,
                userId: member.id,
                moderatorId: interaction.user.id,
                action: 'TIMEOUT',
                reason
            });

            await interaction.editReply(
                `⏱️ **${member.user.tag}** has been timed out for **${minutes} minute(s)**.\n` +
                `**Reason:** ${reason}`
            );

        } catch (error) {
            console.error('Timeout error:', error);

            await interaction.editReply(
                '❌ Something went wrong while executing this command.'
            );
        }
    },
};