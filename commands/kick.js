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
            return interaction.reply({
                content: '❌ I could not find that member.',
                ephemeral: true
            });
        }

        // Prevent kicking yourself
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick yourself.',
                ephemeral: true
            });
        }

        // Prevent kicking the bot
        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot kick myself.',
                ephemeral: true
            });
        }

        // Prevent kicking the server owner
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: '❌ The server owner cannot be kicked.',
                ephemeral: true
            });
        }

        // Prevent kicking members with equal or higher roles
        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.reply({
                content: '❌ You cannot kick a member with an equal or higher role than yours.',
                ephemeral: true
            });
        }

        // Prevent the bot from kicking members above its role
        if (!member.kickable) {
            return interaction.reply({
                content: '❌ I cannot kick this member because their highest role is equal to or higher than mine.',
                ephemeral: true
            });
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

            await interaction.reply(
                `👢 **${member.user.tag}** has been kicked.\n` +
                `**Reason:** ${reason}`
            );
        } catch (error) {
            console.error('Kick error:', error);

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