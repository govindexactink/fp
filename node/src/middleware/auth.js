const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    console.log("token", token)
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log("Decoded token:", decoded.id);
    const user = await User.findById({ _id: decoded?.id });
    // console.log("user", user);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    console.log("Decoded token2:", decoded.id);
    req.user = decoded.id;
    // console.log("Decoded token3:", decoded.id);
    next();
    // return user;
    // console.log("Decoded token4:", decoded.id);
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};
