const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const ApiResponse = require('../models/api-response');
const ApiMessages = require('../models/api-messages');
const UserProfileModel = require('../models/user-profile');
const User = require('../models/user');

class AccountController {
    constructor(userModel, session, userSession, mailer) {
        this.crypto = crypto;
        this.uuidv4 = uuidv4;
        this.ApiResponse = ApiResponse;
        this.ApiMessages = ApiMessages;
        this.UserProfileModel = UserProfileModel;
        this.userModel = userModel;
        this.userSession = userSession;
        this.session = session;
        this.mailer = mailer;
        this.User = User;
    }

    getSession() {
        return this.session;
    }
    
    /**
     * 
     * @param {UserSession} session 
     */
    setSession(session) {
        this.session = session;
    }

    /**
     * 
     * @param {String} password 
     * @param {String} salt 
     * @param {Function} callback 
     */
    hashPassword(password, salt, callback) {
        const iterations = 10000;
        const keyLen = 64;
        this.crypto.pbkdf2(password, salt, iterations, keyLen, 'sha512', callback);
    }

    /**
     * 
     * @param {UserLogon} cnf
     * @param {Function} callback 
     */
    logon(cnf, callback) {
        this.userModel.findOne({ email: cnf.email }, (err, user) => {
            if (err) {
                return callback(err, new this.ApiResponse(
                    { success: false, extras: { msg: this.ApiMessages.DB_ERROR } }));
            }
            if (user) {
                this.hashPassword(cnf.password, user.passwordSalt, (error, passwordHash) => {
                    if (passwordHash.toString('hex') === user.passwordHash) {
                        const userProfileModel = new this.UserProfileModel({
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                        });

                        this.session.userProfileModel = userProfileModel;
                        this.session.myid = this.uuidv4();

                        this.userSession.userId = user._id;
                        this.userSession.sessionId = this.session.myid;

                        this.userSession.save((err1/*, sessionData*/) => {
                            if (err1) {
                                return callback(err, new this.ApiResponse({
                                     success: false, extras: { msg: this.ApiMessages.DB_ERROR } 
                                    }));
                            }
                            return callback(err, new this.ApiResponse({ 
                                success: true, 
                                extras: { 
                                    userProfileModel,
                                    sessionId: this.session.myid,
                                } 
                            }));
                        });   
                    } else {
                        return callback(err, new this.ApiResponse({
                            success: false, extras: { msg: this.ApiMessages.INVALID_PWD }
                        }));
                    }
                });
            } else {
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.EMAIL_NOT_FOUND }
                }));
            } 
        });
    }

    logoff() {
        if (this.session.userProfileModel) {
            delete this.session.userProfileModel;
        }
        if (this.session.myid) {
            delete this.session.myid;
        }
    }

    /**
     * 
     * @param {User} newUser 
     * @param {Function} callback 
     */
    register(newUser, callback) {
        this.userModel.findOne({ email: newUser.email }, (err, user) => {
            if (err) {
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                }));
            }
            if (user) {
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.EMAIL_ALREADY_EXISTS }
                }));
            }
            
            newUser.save((err1, user1) => {
                if (err1) {
                    return callback(err, new this.ApiResponse({
                        success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                    }));
                }
                const userProfileModel = new this.UserProfileModel({
                    email: user1.email,
                    firstName: user1.firstName,
                    lastName: user1.lastName,
                });
                return callback(err, new this.ApiResponse({
                    success: true, extras: { userProfileModel }
                }));
            });
        });
    }

    /**
     * 
     * @param {UserPasswordReset} cnf 
     * @param {Function} callback 
     */
    resetPassword(cnf, callback) {
        this.userModel.findOne({ email: cnf.email }, (err) => {
            if (err) {
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                }));
            }
            const passwordResetHash = this.uuidv4();
            this.session.passwordResetHash = passwordResetHash;
            this.session.emailWhoRequestedPasswordReset = cnf.email;
            this.mailer.sendPasswordResetHash(cnf.email, passwordResetHash);
            return callback(err, new this.ApiResponse({
                success: true, extras: { passwordResetHash }
            }));
        });
    }

    /**
     * 
     * @param {PasswordResetFinal} cnf 
     * @param {Function} callback 
     */
    resetPasswordFinal(cnf, callback) {
        if (!this.session || !this.session.passwordResetHash) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_RESET_EXPIRED }
            }));
        }
        if (this.session.passwordResetHash !== cnf.passwordResetHash) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_RESET_HASH_MISMATCH }
            }));
        }
        if (this.session.emailWhoRequestedPasswordReset !== cnf.email) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_RESET_EMAIL_MISMATCH }
            }));
        }
        if (cnf.newPassword !== cnf.newPasswordConfirm) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_CONFIRM_MISMATCH }
            }));
        }

        const passwordSalt = this.uuidv4();
        this.hashPassword(cnf.newPassword, passwordSalt, (err, passwordHash) => {
            this.userModel.update({ email: cnf.email }, { 
                    passwordHash: passwordHash.toString('hex'), passwordSalt 
                }, (err1) => {
                if (err1) {
                    return callback(err1, new this.ApiResponse({
                        success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                    }));
                }
                return callback(err1, new this.ApiResponse({
                    success: true, extras: null
                }));
            });
        });
    }

    /**
     * 
     * @param {PasswordResetRemember} cnf 
     * @param {Function} callback 
     */
    resetPasswordRemember(cnf, callback) {
        if (cnf.newPassword !== cnf.newPasswordConfirm) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_CONFIRM_MISMATCH }
            }));
        }
        
        this.userModel.findOne({ email: cnf.email }, (err, user) => {
            if (err) {
                return callback(err, new this.ApiResponse(
                    { success: false, extras: { msg: this.ApiMessages.DB_ERROR } }));
            }
            if (user) {
                this.hashPassword(cnf.password, user.passwordSalt, (error, passwordHash) => {
                    if (passwordHash.toString('hex') === user.passwordHash) {
                        const newPasswordSalt = this.uuidv4();
                        this.hashPassword(cnf.newPassword, newPasswordSalt, (err1, newPassHash) => {
                            this.userModel.update({ email: cnf.email }, {
                                        passwordHash: newPassHash.toString('hex'), 
                                        passwordSalt: newPasswordSalt
                                    }, (err2) => {
                                if (err2) {
                                    return callback(err, new this.ApiResponse({ 
                                        success: false, extras: { msg: this.ApiMessages.DB_ERROR } 
                                    }));
                                }
                                return callback(err2, new ApiResponse({
                                    success: true, extras: null
                                }));
                            });
                        }); 
                    } else {
                        return callback(err, new this.ApiResponse({
                            success: false, extras: { msg: this.ApiMessages.INVALID_PWD }
                        }));
                    }
                });
            } else {
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.EMAIL_NOT_FOUND }
                }));
            }             
        });
    }

    /**
     * 
     * @param {UserRegistration} userRegistrationModel 
     */
    getUserFromUserRegistration(userRegistrationModel) {
        if (userRegistrationModel.password !== userRegistrationModel.passwordConfirm) {
            return new this.ApiResponse({ 
                success: false, extras: { msg: this.ApiMessages.PASSWORD_CONFIRM_MICMATCH } 
            });
        }

        const passwordSaltIn = this.uuidv4();
        const cryptoIterations = 10000;
        const cryptoKeyLen = 64;

        const user = new this.User({
            email: userRegistrationModel.email,
            firstName: userRegistrationModel.firstName,
            lastName: userRegistrationModel.lastName,
            passwordHash: this.crypto.pbkdf2Sync(userRegistrationModel.password, 
                    passwordSaltIn, cryptoIterations, cryptoKeyLen, 'sha512').toString('hex'),
            passwordSalt: passwordSaltIn,
        });

        return new this.ApiResponse({ success: true, extras: { user } });
    }
}

module.exports = AccountController;
