const db = require('./database');

async function logModerationAction({
    guildId,
    userId,
    moderatorId,
    action,
    reason = null
}) {
    await db.query(
        `INSERT INTO moderation_logs
        (guild_id, user_id, moderator_id, action, reason)
        VALUES ($1, $2, $3, $4, $5)`,
        [guildId, userId, moderatorId, action, reason]
    );
}

module.exports = {
    logModerationAction
};