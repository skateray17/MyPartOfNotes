const express = require('express');
const UserRegistration = require('../models/user-registration');
const AccountController = require('../controllers/account');
const User = require('../models/user');
const UserSession = require('../models/user-session');
const mailer = require('../models/mailer');

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
    console.log(req);
    res.send('');
});

module.exports = router;
