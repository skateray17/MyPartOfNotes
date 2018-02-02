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

    setSession(session) {
        this.session = session;
    }

    hashPassword(password, salt, callback) {
        const iterations = 10000;
        const keyLen = 64;
        this.crypto.pbkdf2(password, salt, iterations, keyLen, 'sha512', callback);
    }

    logon(email, password, callback) {
        this.userModel.findOne({ email }, (err, user) => {
            if (err) {
                return callback(err, new this.ApiResponse(
                    { success: false, extras: { msg: this.ApiMessages.DB_ERROR } }));
            }
            if (user) {
                this.hashPassword(password, user.passwordSalt, (error, passwordHash) => {
                    if (passwordHash === user.passwordHash) {
                        const userProfileModel = new this.UserProfileModel({
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                        });

                        this.session.userProfileModel = userProfileModel;
                        this.session.id = this.uuid.v4();

                        this.userSession.userId = user._id;
                        this.userSession.sessionId = this.session.id;

                        this.userSession.save((err1, sessionData, numberAffected) => {
                            if (err) {
                                return callback(err, new this.ApiResponse({
                                     success: false, extras: { msg: this.ApiMessages.DB_ERROR } 
                                    }));
                            }
                            if (numberAffected === 1) {
                                return callback(err, new this.ApiResponse({ 
                                    success: true, 
                                    extras: { 
                                        userProfileModel,
                                        sessionId: this.session.id,
                                    } 
                                }));
                            }
                            return callback(err, new this.ApiResponse({
                                success: false, extras: { mst: this.ApiMessages.COULD_NOT_CREATE_SESSION }
                            }));
                        });   
                    }
                    return callback(err, new this.ApiResponse({
                        success: false, extras: { msg: this.ApiMessages.INVALID_PWD }
                    }));
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
        if (this.session.id) {
            delete this.session.id;
        }
    }
    
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
            
            newUser.save((err1, user1, numberAffected) => {
                if (err) {
                    return callback(err, new this.ApiResponse({
                        success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                    }));
                }
                if (numberAffected === 1) {
                    const userProfileModel = new this.UserProfileModel({
                        email: user1.email,
                        firstName: user1.firstName,
                        lastName: user1.lastName,
                    });
                    return callback(err, new this.ApiResponse({
                        success: true, extras: { userProfileModel }
                    }));
                }
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.COULD_NOT_CREATE_USER }
                }));
            });
        });
    }

    resetPassword(email, callback) {
        this.userModel.findOne({ email }, (err) => {
            if (err) {
                return callback(err, new this.ApiResponse({
                    success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                }));
            }
            const passwordResetHash = this.uuidv4();
            this.session.passwordHash = passwordResetHash;
            this.session.emailWhoRequestedPasswordReset = email;
            this.mailer.sendPasswordResetHash(email, passwordResetHash);
            return callback(err, new this.ApiResponse({
                success: true, extras: { passwordResetHash }
            }));
        });
    }

    resetPasswordFinal(email, newPassword, newPasswordConfirm, passwordResetHash, callback) {
        if (!this.session || !this.session.passwordResetHash) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_RESET_EXPIRED }
            }));
        }
        if (this.session.passwordResetHash !== passwordResetHash) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_RESET_HASH_MISMATCH }
            }));
        }
        if (this.session.emailWhoRequestedPasswordReset !== email) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_RESET_EMAIL_MISMATCH }
            }));
        }
        if (newPassword !== newPasswordConfirm) {
            return callback(null, new this.ApiResponse({
                success: false, extras: { msg: this.ApiMessages.PASSWORD_CONFIRM_MISMATCH }
            }));
        }

        const passwordSalt = this.uuidv4();
        this.hashPassword(newPassword, passwordSalt, (err, passwordHash) => {
            this.userModel.update({ email }, { passwordHash, passwordSalt }, 
                (err1, numberAffected) => {
                if (err1) {
                    return callback(err1, new this.ApiResponse({
                        success: false, extras: { msg: this.ApiMessages.DB_ERROR }
                    }));
                }
                if (numberAffected < 1) {
                    return callback(err1, new this.ApiResponse({
                        success: false, extras: { msg: this.ApiMessages.COULD_NOT_RESET_PASSWORD }
                    }));
                }
                callback(err1, new this.ApiResponse({
                    success: true, extras: null
                }));
            });
        });
    }

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
                passwordSaltIn, cryptoIterations, cryptoKeyLen, 'sha512'),
            passwordSalt: passwordSaltIn,
        });

        return new this.ApiResponse({ success: true, extras: { user } });
    }
}

module.exports = AccountController;
