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
            return interaction.reply({
                content: '❌ I could not find that member.',
                ephemeral: true
            });
        }

        // Prevent banning yourself
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban yourself.',
                ephemeral: true
            });
        }

        // Prevent banning the bot
        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot ban myself.',
                ephemeral: true
            });
        }

        // Prevent banning the server owner
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: '❌ The server owner cannot be banned.',
                ephemeral: true
            });
        }

        // Prevent moderators from banning equal/higher roles
        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.reply({
                content: '❌ You cannot ban a member with an equal or higher role than yours.',
                ephemeral: true
            });
        }

        // Prevent the bot from banning equal/higher roles
        if (!member.bannable) {
            return interaction.reply({
                content: '❌ I cannot ban this member because their highest role is equal to or higher than mine.',
                ephemeral: true
            });
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

            await interaction.reply(
                `🔨 **${member.user.tag}** has been banned.\n` +
                `**Reason:** ${reason}`
            );
        } catch (error) {
            console.error('Ban error:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '❌ Something went wrong while executing this command.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Something went wrong while executing this command.',
                    ephemeral: true
                });
            }
        }
    },
};