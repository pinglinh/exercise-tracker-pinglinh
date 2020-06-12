require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.connect(process.env.MLAB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const Schema = mongoose.Schema;

const newUserSchema = new Schema({
  username: String
});

const NewUser = mongoose.model("NewUser", newUserSchema);

app.post("/api/exercise/new-user", async function(req, res) {
  console.log("hello");
  const newUser = new NewUser({ username: req.body.username });

  const createNewUser = await newUser.save();

  res.json(createNewUser);
});

app.get("/api/exercise/users", async function(req, res) {
  const allUsers = await NewUser.find({});

  res.json(allUsers);
});

const exerciseSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date,
  username: String
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/exercise/add", async function(req, res) {
  const user = await NewUser.findById(req.body.userId);

  const date = req.body.date === null ? Date.now() : req.body.date;

  console.log("what is the actual date", date);

  const newExercise = new Exercise({
    userId: user._id,
    description: req.body.description,
    duration: req.body.duration,
    date,
    username: user.username
  });

  const addNewExercise = await newExercise.save();

  console.log(addNewExercise);

  res.json({
    userId: addNewExercise.userId,
    description: addNewExercise.description,
    duration: addNewExercise.duration,
    date: new Date(addNewExercise.date).toDateString(),
    username: addNewExercise.username
  });
});

app.get("/api/exercise/log", async function(req, res) {
  const user = await Exercise.find({ userId: req.query.userId });

  const from = req.query.from;
  const to = req.query.to;
  const limit = parseInt(req.query.limit);

  if (from && to && limit) {
    const allParams = await Exercise.find({
      date: {
        $gte: from,
        $lte: to
      }
    })
      .sort({ date: 1 })
      .limit(limit)
      .exec();

    console.log("does this work", allParams);

    res.json({
      userId: allParams[0].userId,
      username: allParams[0].username,
      from: new Date(from).toDateString(),
      to: new Date(to).toDateString(),
      count: allParams.length,
      log: allParams.map(exercise => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        };
      })
    });
  }
  
  if (from && to) {
    const user2 = await Exercise.find({
      date: {
        $gte: from,
        $lte: to
      }
    })
      .sort({ date: 1 })
      .exec();

    res.json({
      userId: user2[0].userId,
      username: user2[0].username,
      from: new Date(from).toDateString(),
      to: new Date(to).toDateString(),
      count: user2.length,
      log: user2.map(exercise => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        };
      })
    });
  }

  if (limit) {
    const limitUser = await Exercise.find({})
      .limit(limit)
      .exec();

    res.json({
      userId: limitUser[0].userId,
      username: limitUser[0].username,
      count: limitUser.length,
      log: limitUser.map(exercise => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        };
      })
    });
  }

  

  res.json({
    userId: user[0].userId,
    username: user[0].username,
    from: new Date(from).toDateString(),
    to: new Date(to).toDateString(),
    count: user.length,
    log: user.map(exercise => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      };
    })
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
