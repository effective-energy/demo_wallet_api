const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Aletransactions = require('../models/Ale-transactions');
const Alewallet = require('../models/Ale-wallets');
const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');

router.get('/:walletAddress', (req, res, next) => {
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
    Aleusers.find({_id: decode_token._id})
    .exec()
    .then(result_found_user => {
      if(result_found_user.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        })
      }
      Aletransactions.find()
      .exec()
      .then(result => {
        let data = result.filter(item => {
          return item.walletAddress === req.params.walletAddress || item.walletDestination === req.params.walletAddress
        })
        res.status(200).json(data)
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
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/send', (req, res, body) => {
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
    Aleusers.find({_id: decode_token._id})
    .exec()
    .then(result_found_user => {
      if(result_found_user.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        })
      }
      Alewallet.find({ address: req.body.walletAddress })
      .exec()
      .then(check => {
        if(Alewallet.length !== 0) {
          Alewallet.find({ address: req.body.walletDestination })
          .exec()
          .then(check_dest => {
            if(check_dest.length !== 0) {
              if(check[0].balance < req.body.count) {
                return res.status(401).json({
                  message: 'Insufficient funds'
                })
              } else {
                const aleNewTransactions = new Aletransactions({
                  _id: new mongoose.Types.ObjectId(),
                  walletAddress: req.body.walletAddress,
                  walletDestination: req.body.walletDestination,
                  count: req.body.count,
                  timestamp: Date.parse(new Date()),
                  balanceInfo: {
                    before: check[0].balance.toFixed(8),
                    after: check[0].balance - req.body.count.toFixed(8)
                  }
                });
                aleNewTransactions
                .save()
                .then(result_create => {
                  let updateBalance = Number(check[0].balance) - Number(req.body.count);
                  Alewallet.update({ address: check[0].address }, {
                    balance: updateBalance
                  })
                  .exec()
                  .then(success_send => {
                    let updateBalanceDest = Number(check_dest[0].balance) + Number(req.body.count);
                    Alewallet.update({ address: check_dest[0].address }, {
                      balance: updateBalanceDest
                    })
                    .exec()
                    .then(success_send_dest => {
                      res.status(201).json({
                        message: 'Success send',
                        model: send
                      })
                    })
                    .catch(err => {
                      return res.status(504).json({
                        error: err
                      })
                    })
                  })
                  .catch(err => {
                    return res.status(503).json({
                      error: err
                    })
                  })
                })
                .catch(err => {
                  return res.status(201).json({
                    error: err
                  })
                })
              }
            } else {
              return res.status(404).json({
                message: 'Address not found'
              })
            }
          })
          .catch(err => {
            return res.status(502).json({
              error: err
            })
          })
        } else {
          return res.status(404).json({
            message: 'Address not found'
          })
        }
      })
      .catch(error => {
        return res.status(501).json({
          error: err
        })
      })
    })
    .catch(err => {
      return res.status(500).json({
        error: err
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.get('/', (req, res, next) => {
  Aletransactions.find()
  .exec()
  .then(result => {
    res.status(200).json(result)
  })
  .catch(err => {
    res.status(500).json({
      error: err
    })
  });
});

module.exports = router;