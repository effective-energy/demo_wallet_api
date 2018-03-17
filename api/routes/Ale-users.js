const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const randomstring = require('randomstring');

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 25,
  auth: {
    user: 'crowdsystems78@gmail.com',
    pass: '12345678ALE'
  }
});

const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');

router.delete('/logout', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aletoken.find({user_token: user_token})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'Token not found'
      })
    }
    Aleusers.find({_id: decode_token.user_id})
    .exec()
    .then(result_found_user => {
      if (result_found_user.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        })
      }
      Aletoken.delete({user_token: req.body.token})
      .exec()
      .then(result_delete_token => {
        return res.status(200).json({
          message: 'Token success deleted'
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
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/check-login', (req, res, next) => {
  if (req.body.token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  let decode_user_token = jwt.verify(req.body.token, process.env.JWT_KEY);
  Aletoken.find({user_token: req.body.token})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'Token not found'
      })
    }
    Aleusers.find({_id: decode_user_token.userId})
    .exec()
    .then(result_found_user => {
      if (result_found_user.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        })
      }
      return res.status(200).json(result_found_user);
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
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.user_id})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found by token'
      })
    }

    let newRatingUser = Number(result_found[0].rating + req.body.rating);
    if(!isNaN(newRatingUser)) newRatingUser = result_found[0].rating;

    Aleusers.update(
      { type: req.params.typeId },
      { rating: newRatingUser }
    )
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

router.post('/enable-two-auth', (req, res, next) => {
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
      if (
        speakeasy.time.verify({
          secret: req.body.secret,
          encoding: 'base32',
          token: req.body.token
        })
      ) {
        Aleusers.update({ _id: req.params.teamId }, { twoauth: req.body.secret, isTwoAuth: true })
        .exec()
        .then(result_update => {
          res.status(200).json({
            message: 'User model success updated'
          })
        })
        .catch(err => {
          res.status(500).json({
            error: err
          })
        });
      } else {
        res.status(500).json({
          message: 'Failed to verify'
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

router.post('/disable-two-auth', (req, res, next) => {
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
      if(!result_found_user[0].isTwoAuth) {
        return res.status(500).json({
          message: 'Two auth already disabled'
        })
      } else {
        Aleusers.update({ _id: req.params.teamId }, { isTwoAuth: false })
        .exec()
        .then(result_enable_twoauth => {
          return res.status(200).json({
            message: 'Two auth success enable'
          })
        })
        .catch(err => {
          return res.status(500).json({
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

router.post('/changeEmail', (req, res, next) => {
  
});

router.post('/changePassword', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.user_id})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found!'
      })
    }

    if (req.body.new !== req.body.repeat) {
      return res.status(200).json({
        message: 'Passwords do not match'
      })
    }

    if (bcrypt.compareSync(req.body.old, result_found[0].password)) {
      bcrypt.hash(req.body.new, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: err
          });
        }

        Aleusers.update(
          { _id: result_found[0]._id },
          { password: hash }
        )
        .exec()
        .then(result_change_password => {
          return res.status(200).json({
            message: 'Password update!'
          })  
        })
        .catch(err => {
          res.status(500).json({
            error: err
          });
        });
      })
    }
    else {
      return res.status(401).json({
        message: 'Passwords is incorrect'
      })
    }
  })
  .catch(err => {
    res.status(500).json({
      error: err
    })
  });
});

router.post('change-basic-info', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.user_id})
  .exec(result_found => {
    if(result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    const updateOps = {};
    for(const ops of req.body.data) {
      updateOps[ops.propName] = ops.value;
    }
    Aleusers.update({ _id: req.params.teamId }, { $set: updateOps })
    .exec()
    .then(result_update => {
      res.status(200).json({
        message: 'User model success updated'
      })
    })
    .catch(err => {
      res.status(500).json({
        error: err
      })
    });
  })
  .then()
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

router.post('/confirm-reg', (req, res, next) => {
  let confirm_token = jwt.verify(req.body.token, process.env.JWT_KEY);
  if (confirm_token.email === undefined || confirm_token.name === undefined || confirm_token.password === undefined) {
    return res.status(500).json({
      message: 'Invalid token'
    })
  }
  Aleusers.find({email: confirm_token.email})
  .exec()
  .then(result_found => {
    if (result_found.length !== 0) {
      const token = jwt.sign({
        email: result_found[0].email,
        userId: result_found[0]._id
      }, process.env.JWT_KEY, {
        expiresIn: "30d"
      });

      res.status(200).json({
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
      name: confirm_token.name,
      email: confirm_token.email,
      password: confirm_token.password,
      isTwoAuth: false,
      twoAuthRecovery: "",
      walletsList: [],
      rating: -1,
      competence: [],
      change_token: ""
    });

    newAleUser.save()
    .then(result => {
      const token = jwt.sign({
        email: result.email,
        userId: result._id
      }, process.env.JWT_KEY, {
        expiresIn: "30d"
      });

      res.status(200).json({
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
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.user_id}).find()
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: "User not found by email"
      })
    }
    let newPassword = randomstring.generate(16);
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({
          error: err
        });
      }
      Aleusers.update(
        {_id: result_found[0]._id},
        { password: hash }
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
          if (error) {
            return res.status(500).json({
              error: error
            })
          }
          return res.status(200).json({
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

router.post('/restore-2fa', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    bcrypt.compare(req.body.password, result_found[0].password, (err, result) => {
      if (err) {
        return res.status(401).json({
          message: 'incorrect password'
        });
      }
      if (result) {
        if(result_found[0].twoauth === req.body.secret) {
          let secret = speakeasy.generateSecret({length: 20});
          res.status(200).json({ 
            secret: secret.base32,
            qrPath: encodeURIComponent(secret.otpauth_url)
          });
          return Aleusers.update(
            { _id: result_found[0]._id },
            { twoauth: secret.base32 }
          )
          .exec()
          .then(result => {
            return res.status(200).json({ 
              secret: secret.base32,
              qrPath: encodeURIComponent(secret.otpauth_url)
            });
          })
          .catch(err => {
            res.status(500).json({
              error: err
            })
          });
        } else {
          return res.status(401).json({
            message: 'incorrect secret code'
          })
        }
      }
      return res.status(401).json({
        message: 'Auth failed'
      });
    });
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
    if (result_found.length !== 0) {
      return res.status(200).json({
        message: 'User already exist!'
      })
    }

    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
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
          if (error) {
            return res.status(500).json({
              error: error
            })
          }
          return res.status(200).json({
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
    if (result_login.length == 0) {
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
            userId: result_found[0]._id,
            randomData: randomstring.generate(16)
          }, process.env.JWT_KEY, {
            expiresIn: "30d"
          });

          const newUserToken = new Aletoken({
            _id: new mongoose.Types.ObjectId(),
            user_token: token
          });

          newUserToken.save()
          .then(result_save_token => {
            return res.status(200).json({
              message: 'Auth success',
              user_token: token,
              twoauth_status: result_found[0].isTwoAuth
            });
          })
          .catch(err => {
            return res.status(500).json({
              error: err
            })
          })
        } else {
          return res.status(401).json({
            message: 'Auth failed'
          });
        }
      } else {
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
    })
  })
  .catch(err => {
    return res.status(500).json({
      error: err
    })
  })
});

// router.post('/login/confirm', (req, res, next) => {
//   Aleusers.find({email: req.body.email})
//   .exec()
//   .then(result_found => {
//     if(result_found.length === 0) {
//       return res.status(404).json({
//         message: 'User not found'
//       })
//     }
//     bcrypt.compare(req.body.password, result_found[0].password, (err, result) => {
//       if (err) {
//         return res.status(401).json({
//           message: 'Auth failed'
//         });
//       }
//       if (result) {
//         const token = jwt.sign({
//           email: result_found[0].email,
//           userId: result_found[0]._id,
//           randomData: randomstring.generate(16)
//         }, process.env.JWT_KEY, {
//           expiresIn: "30d"
//         });

//         const newUserToken = new Aletoken({
//           _id: new mongoose.Types.ObjectId(),
//           user_token: token
//         });
//         newUserToken
//         .save()
//         .then(result_save_token => {
//           return res.status(200).json({
//             message: 'Auth success',
//             user_token: token
//           });
//         })
//         .catch(err => {
//           return res.status(500).json({
//             error: err
//           })
//         })
//       } else {
//         return res.status(401).json({
//           message: 'Auth failed'
//         });
//       }
//     })
//   })
//   .catch(err => {
//     return res.status(500).json({
//       error: err
//     })
//   })
// });

router.get('/get-user-data', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.user_id})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User is not found'
      })
    }
    return res.status(200).json({
      message: 'User is found',
      name: result_found[0].name,
      email: result_found[0].email
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
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found!'
      })
    }
    if (result_found[0].isTwoAuth) {
      return res.status(200).json({
        message: 'Authorization was successful. Enter the two-factor code.'
      })
    } else {
      bcrypt.compare(req.body.password, result_found[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: 'Incorrect password'
          });
        }
        if (result) {
          const token = jwt.sign({
            email: result_found[0].email,
            user_id: result_found[0]._id,
            randomData: randomstring.generate(16)
          }, process.env.JWT_KEY, {
            expiresIn: "30d"
          });

          const newUserToken = new Aletoken({
            _id: new mongoose.Types.ObjectId(),
            user_token: token
          });
          newUserToken
          .save()
          .then(result_save_token => {
            return res.status(200).json({
              message: 'Auth success',
              user_token: token,
              twoauth_status: result_found[0].isTwoAuth
            });
          })
          .catch(err => {
            return res.status(500).json({
              error: err
            })
          })
        } else {
          return res.status(401).json({
            message: 'Auth failed'
          });
        }
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