const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
    sessionId: String,
    userId: String
});

module.exports = mongoose.model('UserSession', UserSessionSchema);
