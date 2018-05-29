const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Alemessages = require('../models/Ale-messages');
const Aleusers = require('../models/Ale-users');

router.get('/', (req, res, next) => {
  Alemessages.find()
  .exec()
  .then(result => {
    return res.status(200).json(result);
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching messages'
    })
  })
});

router.post('/send', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.userId})
  .exec()
  .then(result_found_user => {
    if(result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    const newMessage = new Alemessages({
      _id: new mongoose.Types.ObjectId(),
      senderId: req.body.senderId,
      receiverId: req.body.receiverId,
      messageText: req.body.message
    });

    newMessage.save()
    .then(result => {
      return res.status(200).json({
        message: 'Message successfuly sended'
      })
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when saving message'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

module.exports = router;