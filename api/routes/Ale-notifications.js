const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Alenotifications = require('../models/Ale-notifications');
const Aleusers = require('../models/Ale-users');

router.get('/', (req, res, next) => {
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
});

router.delete('/list', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  if(req.body.list === undefined || req.body.list.length === 0) {
    return res.status(200).json({
      message: 'Notifications list is empty!'
    })
  }
  Alenotifications.find({_id: {$in: req.body.list}})
  .exec()
  .then(result => {
    if(result.length === 0) {
      return res.status(200).json({
        message: 'Notifications list is empty!'
      })
    }
    if(result.length === result.length) {
      Alenotifications.remove({_id: {$in: req.body.list}})
      .exec()
      .then(result_delete => {
        return res.status(200).json({
          message: 'Notifications successfully deleted'
        })
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when deleted notifications'
        })
      })
    } else {
      return res.status(200).json({
        message: 'One or more notifications are not owned by the user!'
      })
    }
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching notifications'
    })
  })
});

module.exports = router;