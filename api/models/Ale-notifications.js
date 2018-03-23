const mongoose = require('mongoose');

const alenotificationsSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	user_id: {
		type: String,
		required: true
	},
	text: {
		type: String,
		required: true
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Alenotifications', alenotificationsSchema);