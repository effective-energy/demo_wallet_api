const mongoose = require('mongoose');

const aleWalletSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	name: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	balance: {
		type: Number,
		required: true
	},
	total_transactions: {
		type: Number,
		required: true
	},
	seed: {
		type: String,
		required: true
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Alewallet', aleWalletSchema)