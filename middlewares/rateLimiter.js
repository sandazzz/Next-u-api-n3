const rateLimit = require("express-rate-limit");
const User = require("../models/user");

const limitForAdmin = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "You have exceeded your 10 requests per minute limit",
});

const limitForUser = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "You have exceeded your 5 requests per minute limit",
});

const rateLimiter = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    console.log(user);

    const limiter = user?.role === "admin" ? limitForAdmin : limitForUser;
    return limiter(req, res, next);
  } catch (error) {
    console.error("Error in rateLimiter middleware:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = rateLimiter;
