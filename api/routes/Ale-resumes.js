const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Aleresume = require('../models/Ale-resumes');

router.get('/', (req, res, next) => {
  Aleresume.find()
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

router.post('/resume', (req, res, next) => {
  let newResume = new Aleresume({
    _id: new mongoose.Types.ObjectId(),
    description: req.body.description,
    minimal_salary: req.body.minimal_salary,
    skills: req.body.skills
  })
  newResume.save()
  .then(result_create_offer => {
    return res.status(200).json({
      message: 'New resume successfully created',
      resumeModel: result_create_offer
    })
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.get('/resume/:resumeId', (req, res, next) => {
 // Get resume by ID
});

router.delete('/resume/:resumeId', (req, res, next) => {
 // Delete resume By id
});

module.exports = router;