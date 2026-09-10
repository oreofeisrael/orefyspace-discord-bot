const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const db = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View a member\'s warning history')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The member whose warnings you want to view')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');

        try {
            const result = await db.query(
                `SELECT id, moderator_id, reason, created_at
                 FROM warnings
                 WHERE guild_id = $1 AND user_id = $2
                 ORDER BY created_at DESC`,
                [interaction.guild.id, user.id]
            );

            if (result.rows.length === 0) {
                return interaction.reply({
                    content: `✅ **${user.tag}** has no warnings.`,
                    ephemeral: true
                });
            }

            const warningList = result.rows
                .map((warning, index) =>
                    `**${index + 1}.** ⚠️ ${warning.reason}\n` +
                    `Moderator: <@${warning.moderator_id}>\n` +
                    `Date: <t:${Math.floor(new Date(warning.created_at).getTime() / 1000)}:f>`
                )
                .join('\n\n');

            const warningsEmbed = new EmbedBuilder()
                .setTitle(`⚠️ Warning History`)
                .setDescription(`Warnings for **${user.tag}**`)
                .addFields({
                    name: `Total Warnings: ${result.rows.length}`,
                    value: warningList
                })
                .setFooter({
                    text: 'Orefyspace.com Moderation'
                });

            await interaction.reply({
                embeds: [warningsEmbed]
            });

        } catch (error) {
            console.error('Warnings database error:', error);

            await interaction.reply({
                content: '❌ I could not retrieve the warning history.',
                ephemeral: true
            });
        }
    },
};