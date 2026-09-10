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
            return interaction.reply({
                content: '❌ I could not find that member.',
                ephemeral: true
            });
        }

        // Prevent timing out yourself
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot timeout yourself.',
                ephemeral: true
            });
        }

        // Prevent timing out the bot
        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot timeout myself.',
                ephemeral: true
            });
        }

        // Prevent timing out the server owner
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: '❌ The server owner cannot be timed out.',
                ephemeral: true
            });
        }

        // Prevent moderators from timing out equal/higher roles
        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.reply({
                content: '❌ You cannot timeout a member with an equal or higher role than yours.',
                ephemeral: true
            });
        }

        // Prevent the bot from timing out equal/higher roles
        if (!member.moderatable) {
            return interaction.reply({
                content: '❌ I cannot timeout this member because their highest role is equal to or higher than mine.',
                ephemeral: true
            });
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

            await interaction.reply(
                `⏱️ **${member.user.tag}** has been timed out for **${minutes} minute(s)**.\n` +
                `**Reason:** ${reason}`
            );
        } catch (error) {
            console.error('Timeout error:', error);

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