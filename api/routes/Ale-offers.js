const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Aleoffer = require('../models/Ale-offers');

router.get('/', (req, res, next) => {
  Aleoffer.find()
  .exec()
  .then(result_found => {
    res.status(200).json(result_found)
  })
  .catch(err => {
    res.status(500).json({
      error: err
    })
  });
});

router.get('/offer/:offerId', (req, res, next) => {
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
      error: err
    })
  })
});

router.post('/offer', (req, res, next) => {
  let newOffer = new Aleoffer({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    description: req.body.description,
    owner_wallet: req.body.owner_wallet,
    price: req.body.price,
    requirements: req.body.requirements,
    deadline: req.body.deadline,
    tests: req.body.tests
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
      error: err
    })
  })
});

router.delete('/offer/:offerId', (req, res, next) => {
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
          error: err
        })
      });
    });
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.put('/offer/:offerId', (req, res, next) => {
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
        error: err
      })
    });
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

module.exports = router;