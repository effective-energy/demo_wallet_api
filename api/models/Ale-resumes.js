const mongoose = require('mongoose');

const aleresumeSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	owner_id: {
		type: String,
		required: true
	},
	rating: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	minimal_salary: {
		type: Number,
		required: true
	},
	skills: {
		type: Array,
		required: false
	},
	timestamp: {
		type: Number,
		required: true
	},
	last_update: {
		type: Number,
		required: false
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Aleresume', aleresumeSchema);