
// Admin Authorization Middleware

const adminMiddleware = (req, res, next) => {

    // Check whether the user is an admin
    if (req.user.role !== "Admin") {
        return res.status(403).json({
            message: "Access denied! Admin access required."
        });
    }

    // Allow admin to continue
    next();
};

module.exports = adminMiddleware;
