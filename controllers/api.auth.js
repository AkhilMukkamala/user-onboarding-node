const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

let createApiKey = require('./../utils').createApiKey;
let secretkeys = require('../config/secrets.config');
var crypto = require('crypto');
let User = require('./../models/users.model');
let responseCodes = require('./../config/response-codes.config');
let utils = require('./../utils');

// Sign Up!

router.post('/signup', (req, res) => {
    let {
        name,
        email,
        password,
        confirmPassword
    } = req.body;
    if (name && email && password && confirmPassword) {
        if (password !== confirmPassword) {
            return res.status(400).json({
                status: 'failed',
                message: responseCodes["password-mismatch"]
            });
        }
        let apiKey = createApiKey();
        bcrypt.hash(password, 15, (error, hashedPassword) => {
            if (hashedPassword) {
                let user = {
                    name: name,
                    email: email,
                    password: hashedPassword,
                    apiKey: apiKey
                };
                User.create(user, (error, response) => {
                    if (response) {
                        var randomToken = crypto.randomBytes(20);
                        var emailVerifyToken = crypto.createHash('sha1').update(randomToken + user.email).digest('hex');
                        User.findOneAndUpdate({
                            email: user.email
                        }, {
                            emailVerificationToken: emailVerifyToken
                        }, {
                            new: true
                        }).exec((err, details) => {
                            if (err || !details) {
                                let httpStatus = err ? 500 : 400;
                                return res.status(httpStatus).json({
                                    status: 'failed',
                                    message: err || responseCodes["no-user-found"]
                                })
                            } else {
                                let uri = `${req.protocol}` + '://' + `${req.hostname}` + '/api/email-verification/' + `${emailVerifyToken}`;
                                utils.sendMail(user.email, 'Brand Verification', `<a href ="${uri}" target="_blank">Verify Account</a>`)
                                    .then(data => {})
                                return res.status(200).json({
                                    status: 'success',
                                    message: responseCodes["account-create-success"]
                                })
                            }
                        })
                    } else {
                        if (error.code == 11000) {
                            return res.status(400).json({
                                status: 'failed',
                                message: responseCodes["account-exists"]
                            });
                        }
                        return res.status(500).json({
                            status: 'failed',
                            message: error
                        });
                    }
                });
            }

            if (error || !hashedPassword) {
                return res.status(500).json({
                    status: 'failed',
                    message: error || responseCodes['error-hashing-password']
                });
            }
        });
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes['required-fields-missing']
        });
    }
});


// Email Verification!

router.get('/email-verification/:token', (req, res) => {
    User.findOne({
        emailVerificationToken: req.params.token
    }).exec((err, verified) => {
        if (err || !verified) {
            let httpStatus = err ? 500 : 400;
            return res.status(httpStatus).json({
                status: 'failed',
                message: err || responseCodes["resend-email"]
            })
        } else {
            User.findOneAndUpdate({
                emailVerificationToken: req.params.token
            }, {
                isEmailVerified: true
            }, {
                new: true
            }).exec((error, state) => {
                if (error || !state) {
                    let httpStatus = error ? 500 : 400;
                    return res.status(httpStatus).json({
                        status: 'failed',
                        message: error || responseCodes["resend-email"]
                    })
                } else {
                    return res.status(200).redirect(`https://google.com/reset?_id=${state._id}`);
                }
            });
        }
    })
});


router.post('/resend-email', (req, res) => {
    let {
        email
    } = req.body;
    if (email) {
        User.findOne({
            email: email
        }).exec((error, user) => {
            if (error || !user) {
                let httpStatus = error ? 500 : 400;
                return res.status(httpStatus).json({
                    status: 'failed',
                    message: error || responseCodes["no-user-found"]
                })
            } else {
                let userEmailToken = user.emailVerificationToken;
                if (userEmailToken) {
                    let uri = `${req.protocol}` + '://' + `${req.hostname}` + '/api/email-verification/' + `${userEmailToken}`;
                    utils.sendMail(user.email, 'Brand Verification - Resent', `<a href ="${uri}" target="_blank">Verify Account</a>`)
                        .then(data => {})
                    return res.status(200).json({
                        status: 'success',
                        message: responseCodes["mail-sent"]
                    })
                } else {
                    var randomToken = crypto.randomBytes(20);
                    var emailVerifyToken = crypto.createHash('sha1').update(randomToken + user.email).digest('hex');
                    User.findOneAndUpdate({
                        email: user.email
                    }, {
                        emailVerificationToken: emailVerifyToken
                    }, {
                        new: true
                    }).exec((err, details) => {
                        if (err || !details) {
                            let httpStatus = err ? 500 : 400;
                            return res.status(httpStatus).json({
                                status: 'failed',
                                message: err || responseCodes["no-user-found"]
                            })
                        } else {
                            let uri = `${req.protocol}` + '://' + `${req.hostname}` + '/api/verify-email/' + `${emailVerifyToken}`;
                            utils.sendMail(user.email, 'Brand Verification - Resent', `<a href ="${uri}" target="_blank">Verify Account</a>`)
                                .then(data => {})
                            return res.status(200).json({
                                status: 'success',
                                message: responseCodes["mail-sent"]
                            })
                        }
                    })
                }
            }
        });
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes['required-fields-missing']
        });
    }
})


// Reactivate account!


router.post('/reactivate-account/:token', (req, res) => {
    User.findOne({
        emailVerificationToken: req.params.token
    }).exec((err, verified) => {
        if (err || !verified) {
            let httpStatus = err ? 500 : 400;
            return res.status(httpStatus).json({
                status: 'failed',
                message: err || responseCodes["resend-email"]
            })
        } else {
            User.findOneAndUpdate({
                emailVerificationToken: req.params.token
            }, {
                isActive: true
            }, {
                new: true
            }).exec((error, state) => {
                if (error || !state) {
                    let httpStatus = error ? 500 : 400;
                    return res.status(httpStatus).json({
                        status: 'failed',
                        message: error || responseCodes["resend-email"]
                    })
                } else {
                    return res.status(200).redirect(`https://google.com/reset?_id=${state._id}`);
                }
            });
        }
    })
});

// Sign In!

router.post('/signin', (req, res) => {
    let {
        email,
        password
    } = req.body;
    if (email && password) {
        User.findOne({
            email: email
        }).exec((error, data) => {
            if (error || !data) {
                let httpStatus = error ? 500 : 400;
                return res.status(httpStatus).json({
                    status: 'failed',
                    message: error || responseCodes["no-user-found"]
                })
            } else {
                if (data.isActive === false) {
                    var randomToken = crypto.randomBytes(20);
                    var reactivateAccountToken = crypto.createHash('sha1').update(randomToken + data.email).digest('hex');
                    User.findOneAndUpdate({
                        email: user.email
                    }, {
                        emailVerificationToken: reactivateAccountToken
                    }, {
                        new: true
                    }).exec((err, details) => {
                        if (err || !details) {
                            let httpStatus = err ? 500 : 400;
                            return res.status(httpStatus).json({
                                status: 'failed',
                                message: err || responseCodes["no-user-found"]
                            })
                        } else {
                            let uri = `${req.protocol}` + '://' + `${req.hostname}:${process.env.PORT}` + '/api/reactivate-account/' + `${reactivateAccountToken}`;
                            utils.sendMail(user.email, 'Reactivate Account', `<a href ="${uri}" target="_blank">ReActivate Account</a>`)
                                .then(data => {})
                            return res.status(200).json({
                                status: 'success',
                                message: responseCodes["reactivate-account"]
                            })
                        }
                    })
                } else {
                    User.authenticate(email, password, (error, user) => {
                        if (error || !user) {
                            let httpStatus = error ? 500 : 400;
                            return res.status(httpStatus).json({
                                status: 'failed',
                                message: error || responseCodes["no-user-found"]
                            })
                        } else {
                            user = req.session.user = {
                                _id: user._id,
                                name: user.name,
                                email: user.email,
                                apiKey: user.apiKey,
                                role: user.role,
                            }
                            if (user.isActive == false) {
                                // TODO
                                console.log('Hi Inactive!');
                            } else {
                                let token = jwt.sign(user, secretkeys.secret, {
                                    expiresIn: '3h'
                                });
                                res.status(200).json({
                                    status: 'success',
                                    token: token,
                                    message: responseCodes['login-successfull']
                                });
                            }
                        }
                    });
                }
            }
        })
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes["required-fields-missing"]
        })
    }
});

//  Change Password!

router.post('/change-password', (req, res) => {
    let {
        _id,
        password,
        confirmPassword
    } = req.body;
    if (_id && password && confirmPassword) {
        if (password == confirmPassword) {
            User.hashPassword(_id, password, (error, hashedPwd) => {
                if (error || !hashedPwd) {
                    let httpStatus = error ? 500 : 400;
                    return res.status(httpStatus).json({
                        status: 'failed',
                        message: error || responseCodes["no-user-found"]
                    })
                } else {
                    User.findByIdAndUpdate(_id, {
                        password: hashedPwd
                    }, {
                        new: true
                    }).then(data => {
                        return res.json({
                            status: 'success',
                            message: responseCodes["password-updated"]
                        })
                    })
                }
            })
        } else {
            return res.status(400).json({
                status: 'failed',
                message: responseCodes["password-mismatch"]
            })
        }
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes["required-fields-missing"]
        })
    }
})

// Generate API Key!

router.post('/generate-api-key', (req, res) => {
    let {
        _id
    } = req.body;
    if (_id) {
        User.setApiKey(_id, (error, key) => {
            if (key) {
                return res.status(200).json({
                    status: 'success',
                    response: key
                })
            } else {
                return res.status(500).json({
                    status: 'failed',
                    message: error
                })
            }
        })
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes["missing-required-fields"]
        })
    }
})

// Reset Password: Token!

router.get('/reset-password/:token', (req, res) => {
    User.findOne({
        passwordResetToken: req.params.token,
        passwordResetExpires: {
            $gt: Date.now()
        }
    }).exec((error, verified) => {
        if (error || !verified) {
            let httpStatus = error ? 500 : 400;
            return res.status(httpStatus).json({
                status: 'failed',
                message: error || responseCodes["password-token-expired"]
            })
        } else {
            // Redirect Here
            return res.status(200).redirect(`https://google.com/reset?_id=${verified._id}`);
        }
    })
})

// Reset Password!

router.post('/reset-password', (req, res) => {
    let {
        email
    } = req.body;
    if (email) {
        User.findOne({
            email: email
        }).exec((error, user) => {
            if (error || !user) {
                let httpStatus = error ? 500 : 400;
                return res.status(httpStatus).json({
                    status: 'failed',
                    message: error || responseCodes["no-user-found"]
                })
            } else {
                var randomToken = crypto.randomBytes(20);
                var passwordResetToken = crypto.createHash('sha1').update(randomToken + email).digest('hex');
                User.findByIdAndUpdate({
                    _id: user._id
                }, {
                    passwordResetToken: passwordResetToken,
                    passwordResetExpires: Date.now() + 86400000
                }, {
                    upsert: true,
                    new: true
                }).exec((err, details) => {
                    if (err || !details) {
                        let httpStatus = err ? 500 : 400;
                        return res.status(httpStatus).json({
                            status: 'failed',
                            message: err || responseCodes["no-user-found"]
                        })
                    } else {
                        let uri = `${req.protocol}` + '://' + `${req.hostname}:${process.env.PORT}` + '/api/reset-password/' + `${passwordResetToken}`;
                        // + `${req.app.settings.port}`
                        utils.sendMail(user.email, 'Reset your Password', `<a href ="${uri}" target="_blank">Reset Password</a>`)
                            .then(data => {})
                        return res.status(200).json({
                            status: 'success',
                            message: responseCodes["mail-sent"]
                        })
                    }
                })
            }
        })
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes["required-fields-missing"]
        })
    }
})

// Deactivate Account!

router.post('/deactivate-account', (req, res) => {
    let {
        _id
    } = req.body;
    if (_id) {
        User.deactivate(_id, (error, result) => {
            if (error || !result) {
                let httpStatus = error ? 500 : 400;
                return res.status(httpStatus).json({
                    status: 'failed',
                    message: error || responseCodes["no-user-found"]
                })
            } else {
                return res.status(200).json({
                    status: 'success',
                    response: result
                })
            }
        })
    } else {
        return res.status(400).json({
            status: 'failed',
            message: responseCodes["missing-required-fields"]
        })
    }
})


// router.post

module.exports = router;
