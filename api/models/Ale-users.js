const mongoose = require('mongoose');

const aleUsersSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isTwoAuth: {
    type: Boolean,
    required: true
  },
  twoAuthRecovery: {
    type: String,
    required: false
  },
  walletsList: {
    type: Array,
    required: false
  },
  rating: {
    type: Number,
    required: true
  },
  competence: {
    type: Array,
    required: false
  },
  change_token: {
    type: String,
    required: false,
  },
  email_token: {
    type: String,
    required: false,
  },
  disabled_wallets: {
    type: Array,
    required: true
  },
  __v: {
    type: Number,
    select: false
  }
});

module.exports = mongoose.model('Aleusers', aleUsersSchema);