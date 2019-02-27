const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
	name: { type: String, required: true },
	imagePath: { type: String, required: true },
	creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Team', teamSchema);