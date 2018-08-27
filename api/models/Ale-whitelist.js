const mongoose = require('mongoose');

const aleWhitelistSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true
    },
    __v: {
        type: Number,
        select: false
    }
});

module.exports = mongoose.model('Alewhitelist', aleWhitelistSchema);