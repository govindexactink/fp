const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token decoded:", decoded);

    // Verify user exists in database
    const user = await User.findById(decoded?.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    // Store both userId and role from token
    req.user = user._id.toString();
    req.userRole = decoded.role;
    console.log("Protected route - user ID:", req.user, "role:", req.userRole);
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
// console.log("Decoded token3:", decoded.id);
//     next();
//   } catch (err) {
//     // console.error("Auth error:", err);
//     res.status(401).json({ success: false, message: "Invalid or expired token" });
//   }
// };

exports.adminOnly = (req, res, next) => {
  console.log("Admin check - req.userRole:", req.userRole);
  if (req.userRole !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};
