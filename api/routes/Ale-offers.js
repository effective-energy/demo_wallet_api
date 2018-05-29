const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Aleoffer = require('../models/Ale-offers');
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
    Aleoffer.find()
    .exec()
    .then(result_found => {
      res.status(200).json(result_found)
    })
    .catch(err => {
      res.status(500).json({
        message: 'Server error when searching for an offers'
      })
    });
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.get('/offer/:offerId', (req, res, next) => {
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
    Aleoffer.find({_id: req.params.offerId})
    .exec()
    .then(result_found => {
      if(result_found.length === 0) {
        return res.status(404).json({
          message: 'Offer not found'
        })
      }
      return res.status(200).json(result_found[0])
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching for an offers'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
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
  Aleusers.find({_id: decode_token.userId})
  .exec()
  .then(result_found_user => {
    if(result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    let newOffer = new Aleoffer({
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      description: req.body.description,
      owner_id: decode_token.userId,
      price: req.body.price,
      requirements: req.body.requirements,
      timestamp: new Date().getTime(),
      deadline: req.body.deadline,
      tests: req.body.tests,
      is_apply: false,
      is_submited: false,
      is_completed: false,
      contractor_id: ""
    })
    newOffer.save()
    .then(result_create_offer => {
      return res.status(200).json({
        message: 'New offer successfully created',
        offerModel: result_create_offer
      })
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when creating an offer'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.delete('/offer/:offerId', (req, res, next) => {
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
    Aleoffer.find({_id: req.params.offerId})
    .exec()
    .then(result_found => {
      if(result_found.length === 0) {
        return res.status(404).json({
          message: 'Offer not found'
        })
      }
      router.delete('/:id', (req, res, next) => {
        Aleoffer.remove({_id: req.params.offerId})
        .exec()
        .then(result_remove => {
          res.status(200).json({
            message: 'Offer deleted'
          });
        })
        .catch(err => {
          res.status(500).json({
            message: 'Server error when deleting an offer'
          })
        });
      });
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching an offer'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.put('/offer/:offerId', (req, res, next) => {
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
    Aleoffer.find({_id: req.params.offerId})
    .exec()
    .then(result_found => {
      if(result_found.length === 0) {
        return res.status(404).json({
          message: 'Offer not found'
        })
      }
      const updateOps = {};
      for(const ops of req.body.data) {
        updateOps[ops.propName] = ops.value;
      }
      Aleoffer.update({ _id: req.params.offerId }, { $set: updateOps })
      .exec()
      .then(result_changed => {
        res.status(200).json({
          message: 'Offer successfully changed',
          offerModel: result_changed
        })
      })
      .catch(err => {
        res.status(500).json({
          message: 'Server error when changing an offer'
        })
      });
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching an offer'
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