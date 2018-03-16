const mongoose = require('mongoose');

const aletokenSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	user_token: {
		type: String,
		required: true
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Aletoken', aletokenSchema);