const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { logModerationAction } = require('../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member you want to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

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
                '❌ You cannot ban yourself.'
            );
        }

        if (member.id === interaction.client.user.id) {
            return interaction.editReply(
                '❌ I cannot ban myself.'
            );
        }

        if (member.id === interaction.guild.ownerId) {
            return interaction.editReply(
                '❌ The server owner cannot be banned.'
            );
        }

        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.editReply(
                '❌ You cannot ban a member with an equal or higher role than yours.'
            );
        }

        if (!member.bannable) {
            return interaction.editReply(
                '❌ I cannot ban this member because their highest role is equal to or higher than mine.'
            );
        }

        try {
            await member.ban({ reason });

            await logModerationAction({
                guildId: interaction.guild.id,
                userId: member.id,
                moderatorId: interaction.user.id,
                action: 'BAN',
                reason
            });

            await interaction.editReply(
                `🔨 **${member.user.tag}** has been banned.\n` +
                `**Reason:** ${reason}`
            );

        } catch (error) {
            console.error('Ban error:', error);

            await interaction.editReply(
                '❌ Something went wrong while executing this command.'
            );
        }
    },
};