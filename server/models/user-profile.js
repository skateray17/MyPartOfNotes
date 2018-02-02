class UserProfileModel {
    constructor(cnf) {
        this.email = cnf.email;
        this.firstName = cnf.firstName;
        this.lastName = cnf.lastName;
    }
}

module.exports = UserProfileModel;
