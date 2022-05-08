const User = require('../models/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

require('dotenv').config();
const secret = process.env.SECRET;
const PORT = process.env.PORT;

//generate unique token
const generateAccessToken = (id) => {
  const payload = {
    id,
  };
  return jwt.sign(payload, secret, { expiresIn: '8760h' });
};

//generate verification/reset link
const generateLink = (email, option) => {
  const payload = {
    email,
  };
  const token = jwt.sign(payload, secret, { expiresIn: '15m' });
  return `http://localhost:${PORT}/auth/${option}/${token}`;
};

//transporter
let mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

class authController {
  async register(req, res) {
    try {
      let { name, email, password } = req.body;

      //check is user exist
      const candidate = await User.findOne({ email });
      if (candidate && candidate.verified) {
        res
          .status(500)
          .json({ message: 'An error occured: user is already exist' });
      }
      if (candidate && !candidate.verified) {
        await User.deleteOne({ _id: candidate._id });
      }

      //hash password
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);

      //save user
      const user = new User({ name, email, password });
      await user.save();

      //email details
      const verificationLink = generateLink(email, 'verify');
      let details = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Verification',
        html: `<p>Verify your email adress to complete the signup and login into your account.</p><p>This link <b>will expires in 15min</b></p><p>Press <a href=${verificationLink}>here</a> to proceed.</p>`,
      };

      // send email
      mailTransporter.sendMail(details, (err) => {
        if (err) {
          res
            .status(500)
            .json({ message: 'An error occured while sending email' });
        }
      });
      res.status(200).json({
        message: 'User created successfuly, verification email sended',
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Internal error' });
    }
  }

  async verify(req, res) {
    try {
      const { token } = req.params;

      //check is link valid
      const email = jwt.verify(token, secret);
      let user = await User.find({ email: email.email });
      if (!user) {
        res.status(500).json({ message: 'An error occured: bad link' });
      }
      user[0].verified = true;
      await user[0].save();
      res.status(200).json({ message: 'User successfuly verified' });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'An error occured while checking link' });
    }
  }

  async sendReset(req, res) {
    try {
      const { email } = req.body;
      const candidate = await User.findOne({ email });
      if (!candidate) {
        res
          .status(500)
          .json({ message: 'User with current email does not exist' });
      }
      //email details
      const verificationLink = generateLink(email, 'reset-password');
      let details = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Reset password',
        html: `<p>Follow the link below to complete the password reset and login into your account.</p><p>This link <b>will expires in 15min</b></p><p>Press <a href=${verificationLink}>here</a> to proceed.</p>`,
      };

      // send email
      mailTransporter.sendMail(details, (err) => {
        if (err) {
          res
            .status(500)
            .json({ message: 'An error occured while sending email' });
        }
      });
      res.status(200).json({
        message: 'Password reset mail sent',
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .json({ message: 'An error occured while sending reset email' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      let { password } = req.body;
      //check is link valid
      const email = jwt.verify(token, secret);
      let user = await User.findOne({ email: email.email });
      if (!user) {
        res.status(500).json({ message: 'An error occured: bad link' });
      }

      //hash password
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);
      user.password = password;
      await user.save();
      res.status(200).json({ message: 'Password reset succesfuly' });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .json({ message: 'An error occured while reseting password' });
    }
  }
}

module.exports = new authController();
