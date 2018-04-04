const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const randomstring = require('randomstring');

const frontUrl = 'http://localhost:8080/#';

var transporter = nodemailer.createTransport({
  host: '',
  port: '',
  secure: '',
  auth: {
    user: '',
    pass: ''
  }
});

const Aleusers = require('../models/Ale-users');
const Aletoken = require('../models/Ale-token');
const Alewallet = require('../models/Ale-wallets');
const Alenotifications = require('../models/Ale-notifications');

router.post('/change-name', (req, res, next) => {
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
      return Aleusers.update(
        { _id: result_found_user[0]._id },
        { name: req.body.newName }
      )
      .exec()
      .then(result_change_name => {
        return res.status(200).json({
          message: 'User name success update'
        })
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when update user data'
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
      message: 'Server error when searching for a user by token'
    })
  })
});

router.post('/recovery-confirm', (req, res, next) => {
  let recoveryToken = jwt.verify(req.body.recoveryToken, process.env.JWT_KEY);
  if(recoveryToken.email === undefined || recoveryToken.salt === undefined) return res.status(200).json({
    message: 'Token is invalid'
  })
  Aleusers.find({email: recoveryToken.email, change_token: recoveryToken.salt})
  .exec()
  .then(result_found => {
    if(result_found.length === 0) {
      return res.status(200).json({
        message: 'User not found'
      })
    }
    let newPassword = randomstring.generate(16);
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({
          error: err
        });
      }
      Aleusers.update({_id: result_found[0]._id}, { '$set': {
        password: hash,
        change_token: ""
      }})
      .exec()
      .then(result_reset_password => {
        return res.status(200).json({
          message: 'Passwords success recovery',
          newPassword: newPassword
        });
      })
      .catch(err => {
        res.status(500).json({
          message: 'Server error when update user data'
        });
      });
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching user by email'
    })
  })
});

router.post('/recovery', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if(result_found.length === 0) {
      return res.status(200).json({
        message: 'User not found'
      })
    }

    let salt = randomstring.generate(16)

    let generrateRecoveryLink = jwt.sign({
      email: req.body.email,
      salt: salt
    }, process.env.JWT_KEY, {
      expiresIn: "30d"
    });

    Aleusers.update(
      {_id: result_found[0]._id},
      { change_token: salt }
    )
    .then(result_update_token => {
      const mailOptions = {
        from: 'demo.alehub@gmail.com',
        to: req.body.email,
        subject: 'Recovery password',
        html: `
          <table align="center" cellpadding="0" cellspacing="0" width="600">
            <tbody>
              <tr>
                <td align="center" bgcolor="#ffd24f" style="padding: 10px 0 10px 0;">
                  <h1 style="font-family: Tahoma;font-weight: 500;">
                    <a href="https://alehub.io" target="_blank" style="color: #2a2d30;">ALEHUB.IO</a>
                  </h1>
                </td>
              </tr>
              <tr>
                <td bgcolor="#2a2d30" style="padding: 40px 30px 40px 30px;color: #fff;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="540" valign="top">
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr style="text-align: center;font-family: Tahoma;">
                            <td>
                              <h1 style="font-weight: 500;">Confirmation of registration</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 25px 0 0 0;font-family: Tahoma;">
                              Your link to recovery your account - <a style="color: #fff;" href="${frontUrl}/recover-confirm/${generrateRecoveryLink}">${frontUrl}/recover-confirm/${generrateRecoveryLink}</a>.<br /> The link is valid for 30 days.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td bgcolor="#232323" style="padding: 30px 30px 30px 30px;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="color:#fff;font-family:Tahoma;text-align: center;">© Alehub.io 2018</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        `
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          return res.status(500).json({
            message: 'Server error when send email'
          })
        }
        return res.status(200).json({
          message: 'Link successfully sent'
        })
      });
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when changed user data'
      })
    })

  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching user by email'
    })
  })
});

router.post('/restore-secret', (req, res, next) => {
  Aleusers.find({ twoAuthRecovery: req.body.secret})
  .exec()
  .then(result_found_user => {
    if(result_found_user.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    let secret = speakeasy.generateSecret({length: 20});
    res.status(200).json({ 
      secret: secret.base32,
      qrPath: encodeURIComponent(secret.otpauth_url)
    });
    return Aleusers.update(
      { _id: result_found_user[0]._id },
      { twoAuthRecovery: secret.base32 }
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
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching user by secret two-auth'
    })
  })
});

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
    Aleusers.find({_id: decode_token.userId})
    .exec()
    .then(result_found_user => {
      if (result_found_user.length === 0) {
        return res.status(404).json({
          message: 'User not found'
        })
      }
      Aletoken.remove({user_token: user_token})
      .exec()
      .then(result_delete_token => {
        return res.status(200).json({
          message: 'Token success deleted'
        })
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when deleted user-token'
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
        message: 'Server error when searching user by id'
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
  Aleusers.find()
  .exec()
  .then(result_found => {
    res.status(200).json(result_found)
  })
  .catch(err => {
    res.status(500).json({
      message: 'Server error when searching users'
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
  Aleusers.find({_id: decode_token.userId})
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

router.get('/generate-qr', (req, res, next) => {
  let secret = speakeasy.generateSecret({length: 20});
  return res.status(200).json({ 
    secret: secret.base32,
    qr_path: encodeURIComponent(secret.otpauth_url)
  });
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
    Aleusers.find({_id: decode_token.userId})
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
        Aleusers.update({ _id: decode_token.userId }, { '$set': {
          twoAuthRecovery: req.body.secret,
          isTwoAuth: true
        }})
        .exec()
        .then(result_update => {
          res.status(200).json({
            message: 'User model success updated'
          })
        })
        .catch(err => {
          res.status(500).json({
            message: 'Server error when changed user data'
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
    Aleusers.find({_id: decode_token.userId})
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
        if (
          speakeasy.time.verify({
            secret: req.body.secret,
            encoding: 'base32',
            token: req.body.token
          })
          ) {
          Aleusers.update({ _id: decode_token.userId }, { isTwoAuth: false })
        .exec()
        .then(result_enable_twoAuthRecovery => {
          return res.status(200).json({
            message: 'Two auth success disable'
          })
        })
        .catch(err => {
          return res.status(500).json({
            message: 'Server error when changed user data'
          })
        })
      }
      else {
        res.status(500).json({
          message: 'Failed to verify'
        })
      }
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

router.post('/confirm-change-email', (req, res, next) => {
  let decode_token = jwt.verify(req.body.confirmToken, process.env.JWT_KEY);
  let user_token = jwt.verify(req.headers.authorization, process.env.JWT_KEY);
  if (decode_token.length === 0 || user_token.length === 0) {
    return res.status(404).json({
      message: 'User token or confirm token not sent'
    })
  }
  Aletoken.find({user_token: req.headers.authorization})
  .exec()
  .then(result_found_token => {
    if(result_found_token.length === 0) {
      return res.status(404).json({
        message: 'Token not found'
      })
    }
    Aleusers.find({email: decode_token.oldEmail})
    .exec()
    .then(result => {
      if(result.length === 0) {
        return res.status(200).json({
          message: 'User not found'
        })
      }
      if(result[0].email_token !== decode_token.token) {
        return res.status(200).json({
          message: 'Invalid token'
        })
      }
      if(decode_token.isChange) {
        Aleusers.update({ _id: decode_token.userId }, { '$set': {
          email_token: "",
          email: decode_token.email
        }})
        .exec()
        .then(result_change_email => {
          Aletoken.remove({user_token: req.headers.authorization})
          .exec()
          .then(result_delete_token => {

            const userToken = jwt.sign({
              email: decode_token.email,
              userId: result[0]._id
            }, process.env.JWT_KEY, {
              expiresIn: "30d"
            });

            const newUserToken = new Aletoken({
              _id: new mongoose.Types.ObjectId(),
              user_token: userToken
            });
            newUserToken.save()
            .then(result_save_token => {
              return res.status(200).json({
                message: 'Success change email',
                user_token: userToken,
                user_email: decode_token.email
              });
            })
            .catch(err => {
              return res.status(500).json({
                message: 'Server error when creating an user-token'
              })
            })

          })
          .catch(err => {
            return res.status(500).json({
              message: 'Server error when deleted user-token'
            })
          })
        })
        .catch(err => {
          return res.status(500).json({
            message: 'Server error when deleted old user token'
          })
        })
      } else {
        Aleusers.update(
          { _id: decode_token.userId },
          { email_token: "" }
        )
        .exec()
        .then(result_cancel_change_email => {
          return res.status(200).json({
            message: 'Cancellation of mail changes was successful'
          })
        })
        .catch(err => {
          return res.status(500).json({
          message: 'Server error when change user data'
          })
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

router.post('/change-email', (req, res, next) => {
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
      if(result_found_user[0].isTwoAuth !== true) {
        return res.status(200).json({
          message: 'Enable Two auth'
        })
      }
      Aleusers.find({email: req.body.email})
      .exec()
      .then(result_check_exist_email => {
        if(result_check_exist_email.length !== 0) {
          return res.status(500).json({
            message: 'User already exist'
          })
        }
        if (
        speakeasy.time.verify({
          secret: result_found_user[0].twoAuthRecovery,
          encoding: 'base32',
          token: req.body.token
        })
      ) {

        let emailToken = randomstring.generate(16);

        let confirmToken = jwt.sign({
          email: req.body.email,
          userId: decode_token.userId,
          salt: randomstring.generate(16),
          token: emailToken,
          isChange: true,
          oldEmail: result_found_user[0].email
        }, process.env.JWT_KEY, {
          expiresIn: "30d"
        });

        let cancelToken = jwt.sign({
          email: req.body.email,
          userId: decode_token.userId,
          salt: randomstring.generate(16),
          token: emailToken,
          isChange: false,
          oldEmail: result_found_user[0].email
        }, process.env.JWT_KEY, {
          expiresIn: "30d"
        });
      Aleusers.update(
          { _id: result_found_user[0]._id },
          { email_token: emailToken }
        )
        .then(result_update_email_token => {
          transporter.sendMail({
            from: 'demo.alehub@gmail.com',
            to: req.body.email,
            subject: 'Confirm mail change',
            html: `
              <table align="center" cellpadding="0" cellspacing="0" width="600">
                <tbody>
                  <tr>
                    <td align="center" bgcolor="#ffd24f" style="padding: 10px 0 10px 0;">
                      <h1 style="font-family: Tahoma;font-weight: 500;">
                        <a href="https://alehub.io" target="_blank" style="color: #2a2d30;">ALEHUB.IO</a>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#2a2d30" style="padding: 40px 30px 40px 30px;color: #fff;">
                      <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td width="540" valign="top">
                            <table cellpadding="0" cellspacing="0" width="100%">
                              <tr style="text-align: center;font-family: Tahoma;">
                                <td>
                                  <h1 style="font-weight: 500;">Confirmation of registration</h1>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 25px 0 0 0;font-family: Tahoma;">
                                  To change email, follow the link - <a style="color: #fff;" href="${frontUrl}/confirmation-change-email/${confirmToken}">${frontUrl}/confirmation-change-email/${confirmToken}</a>. <br /> The link is valid for 30 days.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#232323" style="padding: 30px 30px 30px 30px;">
                      <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="color:#fff;font-family:Tahoma;text-align: center;">© Alehub.io 2018</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            `
          }, function(error, info) {
            if (error) {
              return res.status(500).json({
                message: 'Server error when send email'
              })
            }
            transporter.sendMail({
              from: 'demo.alehub@gmail.com',
              to: result_found_user[0].email,
              subject: 'Confirm mail change',
              html: `
                <table align="center" cellpadding="0" cellspacing="0" width="600">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#ffd24f" style="padding: 10px 0 10px 0;">
                        <h1 style="font-family: Tahoma;font-weight: 500;">
                          <a href="https://alehub.io" target="_blank" style="color: #2a2d30;">ALEHUB.IO</a>
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td bgcolor="#2a2d30" style="padding: 40px 30px 40px 30px;color: #fff;">
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td width="540" valign="top">
                              <table cellpadding="0" cellspacing="0" width="100%">
                                <tr style="text-align: center;font-family: Tahoma;">
                                  <td>
                                    <h1 style="font-weight: 500;">Confirmation of registration</h1>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 25px 0 0 0;font-family: Tahoma;">
                                    Someone requested a change of mail for your account. If this is not done by you, go for the link - <a style="color: #fff;" href="${frontUrl}/confirmation-change-email/${cancelToken}">${frontUrl}/confirmation-change-email/${cancelToken}</a>. <br /> The link is valid for 30 days.
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td bgcolor="#232323" style="padding: 30px 30px 30px 30px;">
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="color:#fff;font-family:Tahoma;text-align: center;">© Alehub.io 2018</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              `
            }, function(error, info) {
              if (error) {
                return res.status(500).json({
                  message: 'Server error when send email'
                })
              }
              return res.status(200).json({
                message: 'Mails success sent'
              })
            });
          });
        })
        .catch(err => {
          return res.status(500).json({
            message: 'Server error when change user data'
          })
        })

      } else {
        res.status(500).json({
          message: 'Failed to verify'
        })
      }
      })
      .catch(err => {
        return res.status(500).json({
          message: 'Server error when searching user by email'
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

router.post('/changePassword', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.userId})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found!'
      })
    }

    if (
        speakeasy.time.verify({
          secret: result_found[0].twoAuthRecovery,
          encoding: 'base32',
          token: req.body.token
        })
      ) {
      if (bcrypt.compareSync(req.body.old, result_found[0].password)) {
        bcrypt.hash(req.body.new, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              message: 'Server error when encrypted user password'
            });
          }

          Aleusers.update(
            { _id: result_found[0]._id },
            { password: hash }
          )
          .exec()
          .then(result_change_password => {
            return res.status(200).json({
              message: 'Password update'
            })  
          })
          .catch(err => {
            res.status(500).json({
              message: 'Server error when update user password'
            });
          });
        })
      }
      else {
        return res.status(401).json({
          message: 'Passwords is incorrect'
        })
      }
    } else {
      res.status(500).json({
        message: 'Failed to verify'
      })
    }
  })
  .catch(err => {
    res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  });
});

router.post('/change-basic-info', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.userId})
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
        message: 'Server error when searching for a user by token'
      })
    });
  })
  .then()
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching token'
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
    if(result_found.length !== 0) {
      return res.status(200).json({
        message: 'User already exist'
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
      change_token: "",
      email_token: "",
      disabled_wallets: []
    });
    newAleUser.save()
    .then(result_save_user => {
      const newAleToken = new Aletoken({
        _id: new mongoose.Types.ObjectId(),
        user_token: jwt.sign({
          email: result_save_user.email,
          userId: result_save_user._id
        }, process.env.JWT_KEY, {
          expiresIn: "30d"
        })
      });

      newAleToken.save()
      .then(result_save_token => {
        return res.status(200).json({
          message: 'User created!',
          user_token: newAleToken.user_token,
          user_id: result_save_user._id
        });
      })
      .catch(err => {
        return res.status(503).json({
          message: 'Server error when created user-token'
        })
      })
    })
    .catch(err => {
      return res.status(502).json({
        message: 'Server error when created new user'
      })
    })
  })
});

router.post('/change-password', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.userId}).find()
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
          message: 'Server error when encrypted user password'
        });
      }
      Aleusers.update(
        {_id: result_found[0]._id},
        { password: hash }
      )
      .exec()
      .then(result_reset_password => {

        const mailOptions = {
          from: 'demo.alehub@gmail.com',
          to: result_found[0].email,
          subject: 'Restore password',
          html: `
            <table align="center" cellpadding="0" cellspacing="0" width="600">
              <tbody>
                <tr>
                  <td align="center" bgcolor="#ffd24f" style="padding: 10px 0 10px 0;">
                    <h1 style="font-family: Tahoma;font-weight: 500;">
                      <a href="https://alehub.io" target="_blank" style="color: #2a2d30;">ALEHUB.IO</a>
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#2a2d30" style="padding: 40px 30px 40px 30px;color: #fff;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="540" valign="top">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr style="text-align: center;font-family: Tahoma;">
                              <td>
                                <h1 style="font-weight: 500;">Confirmation of registration</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 25px 0 0 0;font-family: Tahoma;">
                                New password - <span style="color: #fff;">${newPassword}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#232323" style="padding: 30px 30px 30px 30px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#fff;font-family:Tahoma;text-align: center;">© Alehub.io 2018</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          `
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            return res.status(500).json({
              message: 'Server error when send email'
            })
          }
          return res.status(200).json({
            message: 'New password send to E-mail'
          });
        });

      })
      .catch(err => {
        res.status(500).json({
          message: 'Server error when change user password'
        });
      });
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
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
        if(result_found[0].twoAuthRecovery === req.body.secret) {
          let secret = speakeasy.generateSecret({length: 20});
          res.status(200).json({ 
            secret: secret.base32,
            qrPath: encodeURIComponent(secret.otpauth_url)
          });
          return Aleusers.update(
            { _id: result_found[0]._id },
            { twoAuthRecovery: secret.base32 }
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
              message: 'Server error when generate qr-code'
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
      message: 'Server error when searching user by email'
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
          message: 'Server error when encrypted user password'
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
          from: 'demo.alehub@gmail.com',
          to: req.body.email,
          subject: 'Confirmation register',
          html: `
            <table align="center" cellpadding="0" cellspacing="0" width="600">
              <tbody>
                <tr>
                  <td align="center" bgcolor="#ffd24f" style="padding: 10px 0 10px 0;">
                    <h1 style="font-family: Tahoma;font-weight: 500;">
                      <a href="https://alehub.io" target="_blank" style="color: #2a2d30;">ALEHUB.IO</a>
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#2a2d30" style="padding: 40px 30px 40px 30px;color: #fff;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="540" valign="top">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr style="text-align: center;font-family: Tahoma;">
                              <td>
                                <h1 style="font-weight: 500;">Confirmation of registration</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 25px 0 0 0;font-family: Tahoma;">
                                To complete the registration, click the link - <a style="color: #fff;" href="${frontUrl}/registration/confirmationuser/${confirmLink}">${frontUrl}/registration/confirmationuser/${confirmLink}</a>. <br /> The link is valid for 30 days.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#232323" style="padding: 30px 30px 30px 30px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#fff;font-family:Tahoma;text-align: center;">© Alehub.io 2018</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          `
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            return res.status(500).json({
              message: 'Server error when send email'
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
      message: 'Server error when searching user by email'
    })
  })
});

router.post('/login/2fa', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    bcrypt.compare(req.body.password, result_found[0].password, (err, result) => {
      if (result) {
        if (speakeasy.time.verify({
          secret: result_found[0].twoAuthRecovery,
          encoding: 'base32',
          token: req.body.token
        })) {
          const token = jwt.sign({
            email: result_found[0].email,
            userId: result_found[0]._id
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
              twoAuthRecovery_status: result_found[0].isTwoAuth
            });
          })
          .catch(err => {
            return res.status(500).json({
              message: 'Server error when creating an user-token'
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
      message: 'Server error when searching user by email'
    })
  })
});

router.get('/get-user-data', (req, res, next) => {
  let user_token = req.headers.authorization;
  let decode_token = jwt.verify(user_token, process.env.JWT_KEY);
  if (decode_token.length === 0) {
    return res.status(404).json({
      message: 'User token not sent'
    })
  }
  Aleusers.find({_id: decode_token.userId})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User is not found'
      })
    }
    Alewallet.find({address: result_found[0].walletsList})
    .exec()
    .then(result_found_wallets => {

      let foundedWallet = result_found_wallets;

      let filterWallets = result_found[0].disabled_wallets.reduce(function(a,b) {
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
          message: 'User is found',
          name: result_found[0].name,
          email: result_found[0].email,
          isTwoAuth: result_found[0].isTwoAuth,
          walletsList: resultWallets,
          haveTransactions: false
        })
      } else {

        let sumTransaction = resultWallets.reduce((total, amount) => total.total_transactions + amount.total_transactions);
        let totalCountTransactions = false;
        if(sumTransaction !== 0) totalCountTransactions = true;
        return res.status(200).json({
          message: 'User is found',
          name: result_found[0].name,
          email: result_found[0].email,
          isTwoAuth: result_found[0].isTwoAuth,
          walletsList: result_found[0].walletsList,
          haveTransactions: totalCountTransactions
        })
      }
    })
    .catch(err => {
      return res.status(500).json({
        message: 'Server error when searching wallets by user'
      })
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching for a user by token'
    })
  })
});

router.get('/user-wallets', (req, res, next) => {
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
    if(result_found.length === 0) {
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
        let foundedWallet = result_found.filter(wallet => result_found_user[0].walletsList.includes(wallet.address));

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
      return res.status(200).json(resultWallets);
      })
      .catch(err => {
        res.status(500).json({
          message: 'Server error when searching wallet an user'
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

router.post('/login', (req, res, next) => {
  Aleusers.find({email: req.body.email})
  .exec()
  .then(result_found => {
    if (result_found.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    bcrypt.compare(req.body.password, result_found[0].password, (err, result) => {
      if(!result) {
        return res.status(401).json({
          message: 'Incorrect password'
        });
      }

      if (result_found[0].isTwoAuth) {
        return res.status(200).json({
          statusLogin: 200,
          message: 'Authorization was successful. Enter the two-factor code.'
        })
      }

      if (result) {
        const token = jwt.sign({
          email: result_found[0].email,
          userId: result_found[0]._id
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
            twoAuthRecovery_status: result_found[0].isTwoAuth
          });
        })
        .catch(err => {
          return res.status(500).json({
            message: 'Server error when creating an user-token'
          })
        })
      } else {
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
    })
  })
  .catch(err => {
    return res.status(500).json({
      message: 'Server error when searching user by email'
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
      message: 'Server error when deleting user'
    })
  });
});

module.exports = router;