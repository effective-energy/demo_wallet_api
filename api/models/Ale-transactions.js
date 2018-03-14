const mongoose = require('mongoose');

const aleTransactionsSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	walletAddress: {
		type: String,
		required: true
	},
	walletDestination: {
		type: String,
		required: true
	},
	count: {
		type: Number,
		required: true
	},
	timestamp: {
		type: Number,
		required: true
	},
	balanceInfo: {
		before: Number,
		after: Number
	},
	__v: {
		type: Number,
		select: false
	}
});

module.exports = mongoose.model('Aletransactions', aleTransactionsSchema)