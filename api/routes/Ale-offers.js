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

module.exports = router;