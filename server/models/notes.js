const mongoose = require('mongoose');

const NotesSchema = new mongoose.Schema({
    email: String,
    notes: Array,
    tags: Array,
    folders: Array,
});

module.exports = mongoose.model('Notes', NotesSchema);
