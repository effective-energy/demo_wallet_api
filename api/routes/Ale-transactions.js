const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Aletransactions = require('../models/Ale-transactions');
const Alenotifications = require('../models/Ale-notifications');
const Alewallet = require('../models/Ale-wallets');
const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');

router.post('/list', (req, res, next) => {
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
      if(req.body.addresses === undefined || req.body.addresses.length === 0) {
        return res.status(200).json({
          message: 'Addresess list is empty'
        })
      }
      Aletransactions
      .find({
        $or: [
          {
            'walletAddress': req.body.addresses
          },
          {
            'walletDestination': req.body.addresses
          }
        ]
      })
      .exec()
      .then(result => {

        let transactionsList = [];

        for(let i=0;i<req.body.addresses.length;i++) {
          if(result.filter(item => { return item.walletAddress === req.body.addresses[i] || item.walletDestination === req.body.addresses[i]}).length === 0) {
            transactionsList.push({
              address: req.body.addresses[i],
              transactions: []
            })
          } else {
            transactionsList.push({
              address: req.body.addresses[i],
              transactions: result.filter(wallet => {
                return req.body.addresses[i].includes(wallet.walletAddress) || req.body.addresses[i].includes(wallet.walletDestination)
              })
            })
          }
        }

        let sortTransactions = transactionsList.sort(function(a,b) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });

        return res.status(200).json(sortTransactions)
      })
      .catch(err => {
        return res.status(500).json({
          error: err
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
    Aleusers.find({_id: decode_token.userId})
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
        var foundTransactions = result.filter(item => {
          return item.walletAddress === req.params.walletAddress || item.walletDestination === req.params.walletAddress
        });
        for(let i=0;i<foundTransactions.length;i++) {
          if(req.params.walletAddress === foundTransactions[i].walletDestination) {
            foundTransactions[i].balanceInfo.before = foundTransactions[i].balanceInfoDest.before;
            foundTransactions[i].balanceInfo.after = foundTransactions[i].balanceInfoDest.after;
          }
          foundTransactions[i].balanceInfoDest = {}
        }

        let sortTransactions = foundTransactions.sort(function(a,b) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        return res.status(200).json(sortTransactions)
      })
      .catch(err => {
        res.status(500).json({
          message: 'Server error when searching an transactions'
        })
      });
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

router.post('/send', (req, res, body) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Alewallet.find({ address: req.body.walletAddress })
  .exec()
  .then(check => {
    if(check.length !== 0) {
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
                after: Number(check[0].balance) - Number(req.body.count.toFixed(8))
              },
              balanceInfoDest: {
                before: check_dest[0].balance.toFixed(8),
                after: Number(check_dest[0].balance) + Number(req.body.count.toFixed(8))
              }
            });
            aleNewTransactions
            .save()
            .then(result_create => {
              let updateBalance = Number(check[0].balance) - Number(req.body.count);
              let updateTotalTransactions = Number(check[0].total_transactions) + 1;
              Alewallet.update({ address: check[0].address }, { '$set': {
                balance: updateBalance,
                total_transactions: updateTotalTransactions
              }})
              .exec()
              .then(success_send => {
                let updateBalanceDest = Number(check_dest[0].balance) + Number(req.body.count);
                let updateTotalTransactionsDest = Number(check_dest[0].total_transactions) + 1;

                Alewallet.update({ address: check_dest[0].address }, { '$set': {
                  balance: updateBalanceDest,
                  total_transactions: updateTotalTransactionsDest
                }})
                .exec()
                .then(success_send_dest => {

                  let newNotifications = new Alenotifications({
                    _id: new mongoose.Types.ObjectId(),
                    user_id: decode_token.userId,
                    isDeleted: false,
                    isSubtitle: false,
                    date: new Date().getTime(),
                    title: `You **sent** <span class="deleted">${req.body.count}</span> ALE from the address **${req.body.walletAddress}** to the address **${req.body.walletDestination}**`,
                    subTitle: "",
                    changes: []
                  });

                  newNotifications
                  .save()
                  .then(result_save_notifications => {
                  Aleusers.find({walletsList: req.body.walletDestination})
                    .exec()
                    .then(result => {
                      let foundedUsers = [];
                      for(let i=0;i<result.length;i++) {
                        foundedUsers.push({
                          _id: new mongoose.Types.ObjectId(),
                          user_id: result[i]._id,
                          isDeleted: false,
                          isSubtitle: false,
                          date: new Date().getTime(),
                          title: `You **received** <span class="accepted">${req.body.count}</span> ALE from **${req.body.walletAddress}** to the address **${req.body.walletDestination}**`,
                          subTitle: "",
                          changes: []
                        })
                      }
                      Alenotifications.create(foundedUsers, function (err, jellybean, snickers) {
                        return res.status(201).json({
                          message: 'Success send',
                          model: success_send_dest
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
                      message: 'Server error when creating notifications'
                    })
                  })
                })
                .catch(err => {
                  return res.status(504).json({
                    message: 'Server error while updating user balance'
                  })
                })
              })
              .catch(err => {
                return res.status(503).json({
                  message: 'Server error while updating user balance'
                })
              })
            })
            .catch(err => {
              return res.status(201).json({
                message: 'Server error when creating transaction'
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
          message: 'Server error while searching for wallet'
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
      message: 'Server error while searching for wallet'
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
      message: 'Server error when searching an transactions'
    })
  });
});

module.exports = router;