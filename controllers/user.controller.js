const User = require("../models/user.model.js");

const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");

// Create and Save a new user
exports.create = (req, res) => {
  if (
    !req.body.companyName ||
    !req.body.companyAddress ||
    !req.body.country ||
    !req.body.email ||
    !req.body.phone ||
    !req.body.contactPersonal ||
    !req.body.position ||
    !req.body.username ||
    !req.body.password ||
    req.body.password !== req.body.confirmPassword
  ) {
    res.render("error", {
      error: {
        header: "Failed",
        message: "An error has occurred, please double check your inputs.",
      },
    });
  }

  // Create a user
  const user = new User({
    username: req.body.username,
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    companyName: req.body.companyName,
    companyAddress: req.body.companyAddress,
    contactPersonal: req.body.contactPersonal,
    country: req.body.country,
    position: req.body.position,
    phone: req.body.phone,
  });

  user
    .save()
    .then((data) => {
      data.success = true;
      res.redirect("/login");
    })
    .catch((err) => {
      res.render("error", {
        error: {
          header: "Failed",
          message: "Could not create user",
        },
      });
    });
};

// Find username and check password
exports.checkPassword = (req, res) => {
  User.find({ username: req.body.username })
    .then((user) => {
      if (user.length === 0) {
        res.render("error", {
          error: {
            header: "Failed",
            message: "User not found with username  " + req.body.username,
          },
        });
      }
      if (user[0].password === req.body.password) {
        let token = jwt.sign(
          {
            username: user[0].username,
          },
          process.env.SECRET,
          { expiresIn: "730h" }
        );

        res.cookie("ctToken", token);
        res.cookie("ctUsername", user[0].username.toUpperCase());
        res.cookie("ctCompanyName", user[0].companyName.toUpperCase());

        res.redirect("/");
      } else {
        res.render("error", {
          error: {
            header: "Failed",
            message: "Incorrect password entered",
          },
        });
      }
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        res.render("error", {
          error: {
            header: "Failed",
            message: "User not found with username  " + req.body.username,
          },
        });
      }
      res.render("error", {
        error: {
          header: "Failed",
          message: "Error retrieving user with username " + req.body.username,
        },
      });
    });
};

// Send username and password email
exports.resetPassword = (req, res) => {
  User.find({ email: req.body.email })
    .then(async (user) => {
      console.log(user.length);
      if (user.length === 0) {
        res.render("error", {
          error: {
            header: "Failed",
            message: "User not found with email  " + req.body.email,
          },
        });
      } else {
        user = user[0];

        const transporter = nodemailer.createTransport({
          pool: true,
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const html = fs
          .readFileSync(path.join(__dirname, "../templates/password.html"))
          .toString();

        const template = handlebars.compile(html);
        const replacements = {
          username: user.username,
          password: user.password,
        };
        const htmlToSend = template(replacements);

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Renesas - Reset Password",
          generateTextFromHTML: true,
          html: htmlToSend,
        };

        const result = await transporter.sendMail(mailOptions);
        transporter.close();
        res.render("emailSent");
      }
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        res.render("error", {
          error: {
            header: "Failed",
            message: "User not found with email  " + req.body.email,
          },
        });
      }
      res.render("error", {
        error: {
          header: "Failed",
          message: "Error retrieving user with email " + req.body.email,
        },
      });
    });
};
