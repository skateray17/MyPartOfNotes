const express = require('express');
const UserRegistration = require('../models/user-registration');
const UserLogon = require('../models/user-logon');
const AccountController = require('../controllers/account');
const User = require('../models/user');
const UserSession = require('../models/user-session');
const mailer = require('../models/mailer');
const ApiResponse = require('../models/api-response');
const UserPasswordReset = require('../models/user-pwd-reset');
const UserPasswordResetFinal = require('../models/user-pwd-reset-final');
const UserPasswordResetRemember = require('../models/user-pwd-reset-remember');

const router = express.Router();

router.route('/account/register').post((req, res) => {
    const accountController = new AccountController(User, req.session, UserSession, mailer);
    const userRegistration = new UserRegistration(req.body);
    if (!userRegistration.email) {
        res.status(400).send(' ');
    }
    const apiResponse1 = accountController.getUserFromUserRegistration(userRegistration);
    res.set('Access-Control-Allow-Origin', req.headers.origin);
    if (!apiResponse1.success) {
        return apiResponse1;
    }
    accountController.register(apiResponse1.extras.user, (err, apiResponse2) => 
                                res.send(apiResponse2));
});

router.route('/account/logon').post((req, res) => {
    const userSession = new UserSession();
    const accountController = new AccountController(User, req.session, userSession, mailer);
    const userLogon = new UserLogon(req.body);
    res.set('Access-Control-Allow-Origin', 'http://localhost:42550');
    accountController.logon(userLogon, (err, response) => res.send(response));
});

router.route('/account/logoff').post((req, res) => {
    const accountController = new AccountController(User, req.session, UserSession, mailer);
    accountController.logoff();
    res.send(new ApiResponse({ success: 'true' }));
});

router.route('/account/resetpassword').post((req, res) => {
        const accountController = new AccountController(User, req.session, UserSession, mailer);
        const userPasswordReset = new UserPasswordReset(req.body);
        accountController.resetPassword(userPasswordReset, (err, response) => 
                                                                    res.send(response));
    });

router.route('/account/resetpasswordfinal').post((req, res) => {
        const accountController = new AccountController(User, req.session, UserSession, mailer);
        const userPasswordResetFinal = new UserPasswordResetFinal(req.body);
        accountController.resetPasswordFinal(userPasswordResetFinal, (err, response) => 
                                                                            res.send(response));
    });

router.route('/account/resetpasswordremember').post((req, res) => {
    const accountController = new AccountController(User, req.session, UserSession, mailer);
    const userPasswordResetRemember = new UserPasswordResetRemember(req.body);
    accountController.resetPasswordRemember(userPasswordResetRemember, (err, response) => 
                                                                        res.send(response));
});

router.route('/account/test').post((req, res) => {
    User.remove({}).exec();
    User.find({}, (err, res1) => console.log(res1));
    res.send('');
});

module.exports = router;
