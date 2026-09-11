const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { logModerationAction } = require('../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member you want to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
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
                '❌ You cannot kick yourself.'
            );
        }

        if (member.id === interaction.client.user.id) {
            return interaction.editReply(
                '❌ I cannot kick myself.'
            );
        }

        if (member.id === interaction.guild.ownerId) {
            return interaction.editReply(
                '❌ The server owner cannot be kicked.'
            );
        }

        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.editReply(
                '❌ You cannot kick a member with an equal or higher role than yours.'
            );
        }

        if (!member.kickable) {
            return interaction.editReply(
                '❌ I cannot kick this member because their highest role is equal to or higher than mine.'
            );
        }

        try {
            await member.kick(reason);

            await logModerationAction({
                guildId: interaction.guild.id,
                userId: member.id,
                moderatorId: interaction.user.id,
                action: 'KICK',
                reason
            });

            await interaction.editReply(
                `👢 **${member.user.tag}** has been kicked.\n` +
                `**Reason:** ${reason}`
            );

        } catch (error) {
            console.error('Kick error:', error);

            await interaction.editReply(
                '❌ Something went wrong while executing this command.'
            );
        }
    },
};