let jwt = require("jsonwebtoken");

let checkToken = (req, res, next) => {
  let token =
    req.cookies.ctToken ||
    req.headers["x-access-token"] ||
    req.headers["authorization"];

  if (token) {
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: "Token is not valid",
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.redirect("/login");
  }
};

module.exports = {
  checkToken,
};
