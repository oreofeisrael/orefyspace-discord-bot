require('dotenv').config();

const { REST, Routes } = require('discord.js');

const commands = [
    require('./commands/ping.js').data.toJSON(),
    require('./commands/help.js').data.toJSON(),
    require('./commands/kick.js').data.toJSON(),
    require('./commands/testmod.js').data.toJSON(),
    require('./commands/timeout.js').data.toJSON(),
    require('./commands/ban.js').data.toJSON(),
    require('./commands/warn.js').data.toJSON(),
    require('./commands/warnings.js').data.toJSON(),
    require('./commands/unwarn.js').data.toJSON(),
    require('./commands/modlogs.js').data.toJSON()
];

const rest = new REST({ version: '10' }).setToken(
    process.env.DISCORD_TOKEN
);

(async () => {
    try {
        console.log('🔄 Registering Orefyspace.com commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('✅ Successfully registered Orefyspace.com commands!');
    } catch (error) {
        console.error(error);
    }
})();