const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sha256 = require('sha256');
const bip39 = require('bip39');
const _ = require('underscore');
const randomstring = require('randomstring');

const Alewallet = require('../models/Ale-wallets');
const Aleusers = require('../models/Ale-users');

router.post('/new', (req, res, next) => {
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
      Aleusers.find({_id: req.body.userId}).find()
      .exec()
      .then(result_user_found => {
        if(result_user_found.length === 0) {
          return res.status(404).json({
            message: "User not found"
          })
        }
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
  Alewallet.find({address: req.body.walletAddress})
  .exec()
  .then(result_found_wallet => {
    if(result_found_wallet.length === 0) {
      return res.status(404).json({
        message: 'Wallet not found'
      })
    }
    Aleusers.find({_id: req.body.userId})
    .exec()
    .then(result_found_user => {
      if(result_found_user.length === 0) {
        return res.status(404).json({
          message: 'User not found'
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
});

router.post('/addressInfo', (req, res, next) => {
  Alewallet.find()
  .exec()
  .then(data => {
    let x = [];
    for(let i=0;i<data.length;i++) {
      x.push(data[i].address)
    }
    let g = _.intersection(x, req.body.addresses)
    if(g.length !== 0) {
      let k = [];
      for(let i=0;i<data.length;i++) {
        for(let j=0;j<g.length;j++) {
          if(data[i].address === g[j]) k.push(data[i])
        }
      }
      return res.status(201).json({
        foundedAddresses: k
      })
    } else {
      return res.status(404).json({
        message: "wallets not found"
      })
    }
  })
  .catch(err => {
    res.status(500).json({
      error: err
    })
  });
})

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
});

module.exports = router;