require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

mongoose.connect(process.env.MLAB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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
  res.status(errCode).type("txt").send(errMessage);
});

const Schema = mongoose.Schema;

const newUserSchema = new Schema({
  username: String,
});

const NewUser = mongoose.model("NewUser", newUserSchema);

app.post("/api/exercise/new-user", async function (req, res) {
  console.log("hello");
  const newUser = new NewUser({ username: req.body.username });

  const createNewUser = await newUser.save();

  res.json(createNewUser);
});

app.get("/api/exercise/users", async function (req, res) {
  const allUsers = await NewUser.find({});

  res.json(allUsers);
});

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String,
  username: String,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/exercise/add", async function (req, res) {
  const user = await NewUser.findById(req.body.userId);

  console.log("USER", user);

  const date =
    req.body.date === ""
      ? new Date(Date.now()).toDateString()
      : new Date(req.body.date).toDateString();

  const newExercise = new Exercise({
    userId: user._id,
    description: req.body.description,
    duration: req.body.duration,
    date,
    username: user.username,
  });

  const addNewExercise = await newExercise.save();

  console.log(addNewExercise);

  res.json({
    userId: addNewExercise.userId,
    description: addNewExercise.description,
    duration: addNewExercise.duration,
    date: addNewExercise.date,
    username: addNewExercise.username,
  });
});

app.get("/api/exercise/log", async function (req, res) {
  const user = await Exercise.find({ userId: req.query.userId });

  const from = req.query.from;
  const to = req.query.to;

  if (from && to) {
    const user2 = await Exercise.find({}).sort({ date: 1 }).exec();
    console.log("hey", user2);
  }

  const log = {
    userId: "5ee16faa14fc3200639876a7",
    username: "pinglinh",
    count: 5,
    log: [
      { description: "swimming", duration: 24, date: "Thu Jun 11 2020" },
      { description: "running", duration: 55, date: "Thu Jun 11 2020" },
      { description: "walking", duration: 30, date: "Thu Jun 11 2020" },
      { description: "running", duration: 56, date: "Mon May 18 2020" },
      { description: "dancing", duration: 15, date: "Tue May 12 2020" },
    ],
  };

  const fromAndTo = {
    userId: "5ee16faa14fc3200639876a7",
    username: "pinglinh",
    from: "Sun May 10 2020",
    to: "Fri May 29 2020",
    count: 2,
    log: [
      { description: "running", duration: 56, date: "Mon May 18 2020" },
      { description: "dancing", duration: 15, date: "Tue May 12 2020" },
    ],
  };

  res.json({
    userId: user[0].userId,
    username: user[0].username,
    count: user.length,
    log: user.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date,
      };
    }),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
