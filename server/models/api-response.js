class ApiResponse {
    constructor(cnf) {
        this.success = cnf.success;
        this.extras = cnf.extras;
    }
}

module.exports = ApiResponse;
