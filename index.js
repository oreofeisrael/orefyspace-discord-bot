require('dotenv').config();

const express = require('express');

const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const { generateAIResponse } = require('./ai/gemini');
const db = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// ==============================
// HEALTH SERVER
// ==============================

const app = express();

app.get('/', (req, res) => {
    res.send('Orefyspace.com Discord Bot is online.');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Health server running on port ${PORT}`);
});


// ==============================
// BOT READY
// ==============================

client.once('clientReady', async () => {
    console.log(`✅ ${client.user.tag} is online!`);

    try {
        for (const [guildId] of client.guilds.cache) {
            await db.query(
                `INSERT INTO guild_settings (guild_id)
                 VALUES ($1)
                 ON CONFLICT (guild_id) DO NOTHING`,
                [guildId]
            );
        }

        console.log('⚙️ Guild settings initialized.');
    } catch (error) {
        console.error('❌ Guild settings initialization error:', error);
    }
});


// ==============================
// SLASH COMMANDS
// ==============================

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    let command;

    try {
        command = require(`./commands/${interaction.commandName}.js`);
    } catch (error) {
        console.error(
            `❌ Could not load command "${interaction.commandName}":`,
            error
        );

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ This command could not be loaded.',
                ephemeral: true
            }).catch(() => {});
        }

        return;
    }

    try {
        // Acknowledge the interaction immediately.
        // This gives the command more time to complete its work.
        await interaction.deferReply();

        await command.execute(interaction);

    } catch (error) {
        console.error(
            `❌ Command error [/${interaction.commandName}]:`,
            error
        );

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(
                    '❌ Something went wrong while executing this command.'
                );
            } else {
                await interaction.reply({
                    content: '❌ Something went wrong while executing this command.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error(
                '❌ Could not send command error response:',
                replyError.message
            );
        }
    }
});


// ==============================
// AI MENTION SYSTEM
// ==============================

client.on('messageCreate', async (message) => {
    console.log('📩 Message received:', message.content);

    if (message.author.bot) return;

    if (!message.mentions.has(client.user)) return;

    const prompt = message.content
        .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
        .trim();

    console.log('🤖 AI prompt:', prompt);

    if (!prompt) {
        return message.reply(
            '🤖 Hey! You mentioned me. What would you like to know?'
        );
    }

    try {
        await message.channel.sendTyping();

        console.log('🧠 Sending request to Gemini...');

        const answer = await generateAIResponse(prompt);

        console.log('✅ Gemini response received');

        if (!answer) {
            return message.reply(
                '❌ I could not generate a response right now.'
            );
        }

        // Discord messages have a 2,000 character limit
        if (answer.length <= 2000) {
            await message.reply(answer);
            return;
        }

        // Split longer responses into multiple messages
        for (let i = 0; i < answer.length; i += 2000) {
            const chunk = answer.slice(i, i + 2000);

            if (i === 0) {
                await message.reply(chunk);
            } else {
                await message.channel.send(chunk);
            }
        }

    } catch (error) {
        console.error('❌ Gemini AI response error:');
        console.error(error);

        await message.reply(
            '❌ Sorry, I could not connect to Gemini right now.'
        );
    }
});


// ==============================
// CLIENT ERROR HANDLER
// ==============================

client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});


// ==============================
// LOGIN
// ==============================

client.login(process.env.DISCORD_TOKEN);