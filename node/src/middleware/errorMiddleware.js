// const errorHandler = (err, req, res, next) => {
//     const statusCode = err.statusCode || 500;

//     res.status(statusCode).json({
//         success: false,
//         message: err.message || "Server Error",
//         loading: false,
//         stack: process.env.Node_ENV === "development" ? err.stack : undefined
//     })
// }


// module.exports = errorHandler;   

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err); // prevents double response
    }

    const statusCode = err.statuscode || err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Server Error",
        loading: false,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

module.exports = errorHandler;