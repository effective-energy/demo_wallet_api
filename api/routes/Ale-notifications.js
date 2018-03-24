const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Alenotifications = require('../models/Ale-notifications');
const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');

router.get('/all', (req, res, next) => {
  Alenotifications.find()
  .exec()
  .then(result_found => {
    return res.status(200).json(result_found)
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error on receiving notifications'
    })
  })
});

router.post('/', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aletoken.find({user_token: user_token})
  .exec()
  .then(result_found_token => {
    if(result_found_token.length === 0) {
      return res.status(404).json({
        message: 'Token not found'
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
      let newNotifications = new Alenotifications({
        _id: new mongoose.Types.ObjectId(),
        user_id: decode_token.userId,
        text: req.body.text,
        isDeleted: req.body.isDeleted,
        isSubtitle: req.body.isSubtitle,
        date: new Date().getTime(),
        title: req.body.title,
        subTitle: req.body.subTitle,
        changes: req.body.changes
      });
      newNotifications.save()
      .then(result_save => {
        return res.status(200).json({
          message: 'Notifications success save',
          notificationsModel: result_save
        })
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when creating a new notification'
        })
      })
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching for a user by token'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching token'
    })
  })
});

router.get('/', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aletoken.find({user_token: user_token})
  .exec()
  .then(result_found_token => {
    if(result_found_token.length === 0) {
      return res.status(404).json({
        message: 'Token not found'
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
      Alenotifications.find({user_id: decode_token.userId})
      .exec()
      .then(result_found => {
        return res.status(200).json(result_found)
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error on receiving notifications'
        })
      })
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching for a user by token'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching token'
    })
  })
});

module.exports = router;