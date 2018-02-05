class UserPasswordResetRemember {
    constructor(cnf) {
        this.email = cnf.email;
        this.password = cnf.password;
        this.newPassword = cnf.newPassword;
        this.newPasswordConfirm = cnf.newPasswordConfirm;
    }
}

module.exports = UserPasswordResetRemember;
