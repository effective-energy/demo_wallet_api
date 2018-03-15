const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 25,
  auth: {
    user: 'crowdsystems78@gmail.com',
    pass: '12345678ALE'
  }
});

const Aleusers = require('../models/Ale-users');

router.get('/', (req, res, next) => {
  Aleusers.find()
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

router.post('/setRating', (req, res, next) => {
  let userToken = req.headers.authorization;
  let decodeToken = jwt.verify(userToken, process.env.JWT_KEY);
  if(decodeToken.userId !== req.body.userId) {
    return res.status(401).json({
      error: 'Wrong token!'
    })
  }
  Aleusers.find({email: decodeToken.email})
  .exec()
  .then(result_found => {
    if(result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found by token'
      })
    }
    let newRatingUser = result_found[0].rating + req.body.rating;
    Aleusers.update({ type: req.params.typeId }, { rating: newRatingUser })
    .exec()
    .then(result_set_rating => {
      return res.status(200).json({
        message: 'User rating changed successfully',
        new_rating: newRatingUser
      })
    })
    .then(err => {
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

router.post('/changeEmail', (req, res, next) => {

});

router.post('/changePassword', (req, res, next) => {

});

router.post('changeBasicInfo', (req, res, next) => {

});

router.post('/confirm-reg', (req, res, next) => {
  let confirmToken = jwt.verify(req.body.token, process.env.JWT_KEY);
  if(confirmToken.email === undefined || confirmToken.name === undefined || confirmToken.password === undefined) {
    return res.status(500).json({
      message: 'Invalid token'
    })
  }

  Aleusers.find({email: confirmToken.email})
  .exec()
  .then(result_found => {
    if(result_found.length !== 0) {
      const token = jwt.sign({
        email: result_found[0].email,
        userId: result_found[0]._id
      }, process.env.JWT_KEY, {
        expiresIn: "30d"
      });
      res.status(201).json({
        message: 'User created!',
        user_token: result_found[0],
        user_id: result._id
      });
      return res.status(200).json({
        message: 'Email already exist!',
        user_id: result_found,
        user_token: token
      })
    }
    const newAleUser = new Aleusers({
      _id: new mongoose.Types.ObjectId(),
      name: confirmToken.name,
      email: confirmToken.email,
      password: confirmToken.password,
      isTwoAuth: false,
      twoAuthRecovery: "",
      walletsList: [],
      rating: -1,
      competence: []
    });
    newAleUser
    .save()
    .then(result => {
      const token = jwt.sign({
        email: result.email,
        userId: result._id
      }, process.env.JWT_KEY, {
        expiresIn: "30d"
      });
      res.status(201).json({
        message: 'User created!',
        user_token: token,
        user_id: result._id
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
});

router.post('/restore-password', (req, res, next) => {
  Aleusers.find({email: req.body.email}).find()
  .exec()
  .then(result_found => {
    if(result_found.length === 0) {
      return res.status(404).json({
        message: "User not found by email"
      })
    }

    let newPassword = randomstring.generate(16);

    bcrypt.hash(newPassword, 10, (err, hash) => {
      if(err) {
        return res.status(500).json({
          error: err
        });
      }
      Aleusers.update(
        {_id: result_found[0]._id},
        {password: hash}
      )
      .exec()
      .then(result_reset_password => {

        const mailOptions = {
          from: 'crowdsystems78@gmail.com',
          to: req.body.email,
          subject: 'Restore password',
          text: `New password - ${newPassword}`
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if(error) {
            return res.status(500).json({
              error: error
            })
          }
          return res.status(201).json({
            message: 'New password send to E-mail'
          });
        });
      })
      .catch(err => {
        res.status(500).json({
          error: err
        });
      });
    })
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/new', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if(result_found.length !== 0) {
      return res.status(200).json({
        message: 'User already exist!'
      })
    }

    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if(err) {
        return res.status(500).json({
          error: err
        });
      } else {

        const confirmLink = jwt.sign({
          name: req.body.name,
          email: req.body.email,
          password: hash
        }, process.env.JWT_KEY, {
          expiresIn: "30d"
        });

        const mailOptions = {
          from: 'crowdsystems78@gmail.com',
          to: req.body.email,
          subject: 'Confirmation register',
          text: `To complete the registration, click the link - http://localhost:8081/#/registration/confirmationuser/${confirmLink}. The link is valid for 30 days.`
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if(error) {
            return res.status(500).json({
              error: error
            })
          }
          return res.status(201).json({
            message: 'The registration confirmation link has been sent to your e-mail'
          });
        });
      }
    });
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/login/2fa', (req, res, next) => {
  Aleusers.find({mail: req.body.email})
  .exec()
  .then(result_found => {
    if(result_login.length == 0) {
      return res.status(401).json({
        message: 'User not found'
      });
    }
    bcrypt.compare(req.body.password, user[0].password, (err, result) => {
      if (err) {
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
      if (result) {
        if (speakeasy.time.verify({
          secret: result_found[0].twoauth,
          encoding: 'base32',
          token: req.body.token
        })) {
        const token = jwt.sign({
          email: result_found[0].email,
          userId: result_found[0]._id
        }, process.env.JWT_KEY, {
          expiresIn: "30d"
        });
        return res.status(200).json({
          message: 'Auth success',
          jwt_token: token,
          userId: result_found[0]._id
        });
        }
      }
      return res.status(401).json({
        message: 'Auth failed'
      });
    })
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/login/confirm', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if(result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    bcrypt.compare(req.body.password, result_found[0].password, (err, result) => {
      if (err) {
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
      if (result) {
        if (speakeasy.time.verify({
          secret: result_found[0].twoauth,
          encoding: 'base32',
          token: req.body.token
        })) {
        const token = jwt.sign({
          email: result_found[0].email,
          userId: result_found[0]._id
        }, process.env.JWT_KEY, {
          expiresIn: "30d"
        });
        return res.status(200).json({
          message: 'Authorization was successful.',
          user_token: token,
          user_id: result_found[0]._id
        });
        }
      }
      return res.status(401).json({
        message: 'Auth failed'
      });
    })
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/login', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if(result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found!'
      })
    }
    if(result_login[0].isTwoAuth) {
      return res.status(200).json({
        message: 'Authorization was successful. Enter the two-factor code.'
      })
    } else {
      bcrypt.compare(req.body.password, result_login[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: 'Incorrect password'
          });
        }
        if (result) {
          const token = jwt.sign({
            email: result_login[0].email,
            userId: result_login[0]._id
          }, process.env.JWT_KEY, {
            expiresIn: "30d"
          });
          return res.status(200).json({
            message: 'Auth success',
            user_token: token,
            user_id: result_login[0]._id
          });
        }
        return res.status(401).json({
          message: 'Auth failed'
        });
      })
    }
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.delete('/:userId', (req, res, next) => {
  Aleusers.remove({ _id: req.params.userId })
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

module.exports = router;