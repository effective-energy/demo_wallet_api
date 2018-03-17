const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sha256 = require('sha256');
const bip39 = require('bip39');
const randomstring = require('randomstring');

const Alewallet = require('../models/Ale-wallets');
const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');

router.post('/new', (req, res, next) => {
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
      let seed = req.body.seed.join().replace(/,/g , " ");
      if(bip39.validateMnemonic(seed)) {
        const newAleWallet = new Alewallet({
          _id: new mongoose.Types.ObjectId(),
          name: req.body.name,
          balance: 100,
          seed: sha256(req.body.seed.join().replace(/,/g , " ")),
          address: randomstring.generate(47)
        });
        newAleWallet.save()
        .then(result => {
          Aleusers.update({ _id: req.body.userId }, {
            $push: { walletsList: newAleWallet.address }
          })
          .exec()
          .then(result_create_new_wallet => {
            return res.status(201).json({
              message: 'New wallet success create!',
              walletModel: newAleWallet
            })
          })
          .catch(error => {
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
      } else {
        return res.status(500).json({
          message: 'Incorrect mnemonic!'
        })
      }
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
  Alewallet.find()
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

router.post('/rename', (req, res, next) => {
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
      Alewallet.find({address: req.body.walletAddress})
      .exec()
      .then(result_found_wallet => {
        if(result_found_wallet.length === 0) {
          return res.status(404).json({
            message: 'Wallet not found'
          })
        }
        if(result_found_user[0].walletsList.indexOf(req.body.walletAddress) === -1) {
          return res.status(404).json({
            message: 'The user does not have such a wallet'
          })
        } else {
          Alewallet.update({address: req.body.newWalletName}, {
            name: req.body.walletName
          })
          .exec()
          .then(result_rename_wallet => {
            return res.status(200).json({
              message: 'Wallet name changed'
            })
          })
          .catch(err => {
            return res.status(505).json({
              error: err
            })
          })
        }
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
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/addressInfo', (req, res, next) => {
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
      Alewallet.find()
      .exec()
      .then(result_found => {
        let foundedWallet = result_found.filter(wallet => req.body.addresses.includes(wallet.address));
        return res.status(200).json({
          foundedAddresses: foundedWallet
        });
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

router.get('/seed', (req, res, next) => {
  return res.status(201).json({
    seed: bip39.generateMnemonic().split(' ')
  })
});

router.delete('/delete/:id', (req, res, next) => {
  Alewallet.remove({ _id: req.params.id })
  .exec()
  .then(result => {
    res.status(200).json(result);
  })
  .catch(err => {
    res.status(500).json({
      error: err
    })
  });
});

router.post('/redeem', (req, res, next) => {
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
      let seed = req.body.seed.join().replace(/,/g , " ");
      if(bip39.validateMnemonic(seed)) {
        Alewallet.find({ seed: sha256(seed) })
        .exec()
        .then(result => {
          if(result.length !== 0) {
            return res.status(201).json({
              walletInfo: result[0]
            })
          } else {
            return res.status(404).json({
              message: 'Wallet not found'
            })
          }
        })
        .catch(err => {
          return res.status(500).json({
            error: err
          })
        })
      } else {
        return res.status(500).json({
          message: 'Incorrect mnemonic!'
        })
      }
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

module.exports = router;