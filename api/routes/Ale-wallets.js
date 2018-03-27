const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sha256 = require('sha256');
const bip39 = require('bip39');
const randomstring = require('randomstring');
const https = require('https');

const Alewallet = require('../models/Ale-wallets');
const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');

router.get('/crypto', (req, res, next) => {
  https.get('https://api.coinmarketcap.com/v1/ticker/', (resp) => {
    let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        let allCrypto = JSON.parse(data);
        let supportedCrypto = ['BTC', 'ETH', 'BCH', 'LTC', 'DASH'];

        let foundedWallet = allCrypto.filter(item => supportedCrypto.includes(item.symbol));
        let foundedCrypto = [];
        foundedWallet.forEach(function(crypto) {
          foundedCrypto.push({
            symbol: crypto.symbol,
            price: crypto.price_usd
          })
        });
        return res.status(200).json(foundedCrypto);
      });
  }).on("error", (err) => {
    return res.status(500).json({
      message: 'Server error when searching cryptocurrency'
    })
  });
});

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
    Aleusers.find({_id: decode_token.userId})
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
          address: randomstring.generate(47),
          total_transactions: 0
        });
        newAleWallet.save()
        .then(result => {
          Aleusers.update({ _id: decode_token.userId }, {
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
              message: 'Error adding user wallet'
            })
          })
        })
        .catch(err => {
          return res.status(500).json({
            message: 'Error when creating wallet'
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

router.get('/', (req, res, next) => {
  Alewallet.find()
  .exec()
  .then(result_found => {
    res.status(200).json(result_found)
  })
  .catch(err => {
    res.status(500).json({
      message: 'Server error when searching wallets'
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
    Aleusers.find({_id: decode_token.userId})
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
          Alewallet.update({_id: result_found_wallet[0]._id}, { '$set': {
            name: req.body.newWalletName
          }})
          .exec()
          .then(result_rename_wallet => {
            return res.status(200).json({
              message: 'Wallet name changed'
            })
          })
          .catch(err => {
            return res.status(505).json({
              message: 'Server error when rename wallet'
            })
          })
        }
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when searching wallet'
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
    Aleusers.find({_id: decode_token.userId})
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
          message: 'Server error when searching wallets'
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

router.get('/getWalletInfo/:walletAddress', (req, res, next) => {
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
      Alewallet.find({address: req.params.walletAddress})
      .exec()
      .then(result_found_wallet => {
        if(result_found_wallet.length === 0) {
          return res.status(200).json({
            message: 'Wallet not found'
          })
        }

        let foundedWallet = result_found_wallet;

        let filterWallets = result_found_user[0].disabled_wallets.reduce(function(a,b) {
          if (a.indexOf(b) < 0 ) a.push(b);
          return a;
        },[]);

        for(let i=0;i<foundedWallet.length;i++) {
          for(let j=0;j<filterWallets.length;j++) {
            if(foundedWallet[i].address === filterWallets[j]) {
              foundedWallet[i] = '';
            }
          }
        }

        let resultWallets = foundedWallet.filter(item => {
          return item.length !== 0
        })

        if(resultWallets.length === 0) {
          return res.status(200).json({
            message: 'Wallet not found'
          })
        } else {
          return res.status(200).json(resultWallets[0])
        }
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when searching wallets'
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

router.get('/seed', (req, res, next) => {
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
      return res.status(201).json({
        seed: bip39.generateMnemonic().split(' ')
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

router.delete('/:address', (req, res, next) => {
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
      if(result_found_user[0].walletsList.indexOf(req.params.address) === -1) {
        return res.status(200).json({
          message: 'This wallet does not belong to the user found'
        })
      }
      Aleusers.update({ _id: decode_token.userId }, {
        $push: { disabled_wallets: req.params.address }
      })
      .exec()
      .then(result_delete => {
        return res.status(200).json({
          message: 'Wallet successfully disabled by this user'
        })
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when deleted wallet'
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
    Aleusers.find({_id: decode_token.userId})
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
            message: 'Server error when searching wallets'
          })
        })
      } else {
        return res.status(200).json({
          message: 'Incorrect mnemonic!'
        })
      }
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

module.exports = router;