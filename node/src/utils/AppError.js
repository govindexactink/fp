class AppError extends Error {
    constructor (message, statuscode) {
        super(message);
        this.statuscode = statuscode;
        this.success = false;

        Error.captureStackTrace(this, this.constructor);
    };
};

module.exports = AppError;
