const mongoose = require('mongoose');

const alenotificationsSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	user_id: {
		type: String,
		required: true
	},
	isDeleted: {
		type: Boolean,
		required: true
	},
	isSubtitle: {
		type: Boolean,
		required: true
	},
	date: {
		type: Number,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	subTitle: {
		type: String,
		required: false
	},
	changes: {
		type: Array,
		required: false
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Alenotifications', alenotificationsSchema);