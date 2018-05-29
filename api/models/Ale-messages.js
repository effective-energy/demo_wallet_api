const mongoose = require('mongoose');

const alemessagesSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	senderId: {
		type: String,
		required: true
	},
	receiverId: {
		type: String,
		required: true
	},
	messageText: {
		type: String,
		required: true
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Alemessages', alemessagesSchema)