require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');

app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

const URI = process.env.URL;
const PORT = process.env.PORT;

const authRouter = require('./api/routers/authRouter');

app.use('/auth', authRouter);

const start = async () => {
  try {
    await mongoose.connect(
      URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      console.log('Connected to MongoDB')
    );
    app.listen(PORT, () => {
      console.log('Server started on port ', PORT);
    });
  } catch (e) {
    console.log(e);
  }
};

start();
