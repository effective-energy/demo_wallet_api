const mongoose = require('mongoose');

const aleofferSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	owner_wallet: {
		type: String,
		required: true
	},
	contractor_wallet: {
		type: String,
		required: true
	},
	requiments: {
		type: Array,
		required: false
	},
	timestamp: {
		type: Number,
		required: false
	},
	title: {
		type: String,
		required: true
	},
	rating: {
		type: Number,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	deadline: {
		type: Number,
		required: true
	},
	is_apply: {
		type: Boolean,
		required: true
	},
	is_submited: {
		type: Boolean,
		required: true
	},
	is_completed: {
		type: Boolean,
		required: true
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Aleoffer', aleofferSchema)