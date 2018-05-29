const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Aleresume = require('../models/Ale-resumes');
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
    if (result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    Aleresume.find()
    .exec
    .then(result_found_resumes => {
      return res.status(200).json(result_found_resumes);
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching resume'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.post('/resume', (req, res, next) => {
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
    if (result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    let newResume = new Aleresume({
      _id: new mongoose.Types.ObjectId(),
      owner_id: result_found_user[0]._id,
      rating: result_found_user[0].rating,
      description: req.body.description,
      minimal_salary: req.body.minimal_salary,
      skills: req.body.skills,
      timestamp: new Date().getTime(),
      last_update: new Date().getTime()
    });

    newResume.save()
    .then(result_create_offer => {
      return res.status(200).json({
        message: 'New resume successfully created',
        resumeModel: result_create_offer
      })
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when creating resume'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.get('/resume/:resumeId', (req, res, next) => {
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
    if (result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    Aleresume.find({_id: req.params.resumeId})
    .exec()
    .then(result_found_resume => {
      if (result_found_resume.length === 0) {
        return res.status(404).json({
          message: 'Resume not found'
        })
      }
      return res.status(200).json(result_found_resume[0])
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching resume'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.delete('/resume/:resumeId', (req, res, next) => {
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
    if (result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    Aleresume.find({owner_id: result_found_user[0]._id})
    .exec()
    .then(result_found_resume => {
      if (result_found_resume.length === 0) {
        return res.status(404).json({
          message: 'Resume does not belong to this user'
        })
      }
      Aleresume.delete({_id: req.params.resumeId})
      .exec()
      .then(result_delete_resume => {
        return res.status(200).json({
          message: 'Resume successfully deleted'
        })
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when deleting resume'
        })
      })
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching resume'
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