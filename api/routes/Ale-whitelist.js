const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Alewhitelist = require('../models/Ale-whitelist');

function isValidEmail (email) {
    let re = /\S+@\S+\.\S+/;
    return re.test(email);
}

router.post('/new', (req, res, next) => {
    if (!isValidEmail(req.body.email)) {
        return res.status(422).json({
            message: 'Invalid email'
        })
    }
    Alewhitelist.find({ email: req.body.email })
    .exec()
    .then(result => {
        if (result.length !== 0) {
            return res.status(409).json({
                message: 'Email already exist'
            })
        }
        let newWhitelist = new Alewhitelist({
          _id: new mongoose.Types.ObjectId(),
          email: req.body.email,
        });

        newWhitelist
        .save()
        .then(result_create => {
          return res.status(200).json({
            message: 'Success add new email to white list',
          });
        })
        .catch(err => {
          return res.status(500).json({
            message: 'Server error when creating notifications'
          })
        })
    })
    .catch(err => {
        return res.status(500).json({
            message: 'Server error'
        })
    })
});

router.get('/', (req, req, next) => {
    
})

module.exports = router;