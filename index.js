const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3001;
const fs = require("fs");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const uri =
  "mongodb+srv://garvthakral90:garv1212@cluster0.zgxl4ha.mongodb.net/";
const path = require("path");

//HiJdZfT23oUEKF5p

// rpfkjTdkvr1eSfbU
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const server = createServer(app);
const io = new Server(server);

// const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname, "public")));
mongoose.connect(uri); // connecting MONGO DB
app.use(bodyParser.json()); // Add body-parser middleware for parsing JSON data
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodie
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(bodyParser.json()); // Add body-parser middleware for parsing JSON data
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

let new_user_id = "";

const fname = "";
let active_users = {};

//DEFINEING SCHEMA
const UserSchema = new mongoose.Schema({
  FIRST_NAME: String,
  LAST_NAME: String,
  CONTACT: Number,
  EMAIL: String,
  CITY: String,
  AGE: Number,
  STATE: String,
  COUNTRY: String,
  LOGIN: String,
  PASSWORD: String,
  time_data: Date,
});

// CREATING DATA MODEL
const UserModel = mongoose.model("User", UserSchema);

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "./public/sign-up.html");

  // Read the HTML file and send it as the response
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).type("text/html").send(data);
    }
  });
});
// SIGN UP PAGE GET
app.get("/sign-up", (req, res) => {
  const filePath = path.join(__dirname, "./public/sign-up.html");

  // Read the HTML file and send it as the response
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).type("text/html").send(data);
    }
  });
});

// SIGN UP PAGE POST
app.post("/sign-up", (req, res) => {
  //RECIVING DATA FROM HTML PAGE
  const data = req.body;
  // console.log('data from html',data)
  //ADDING DATE AND TIME
  const now = new Date();
  const formattedDate = now.toISOString();
  const time_data = {
    currentTime: formattedDate,
  };
  //   console.log(req.body)

  data.time_data = formattedDate;

  // console.log(data)

  //SENDING DATA TO DB
  //  console.log(data)
  const newUser = new UserModel(data);
  newUser
    .save()
    .then((savedUser) => {
      const userId = savedUser._id.toString(); // Retrieve the ID of the saved user
      console.log("Data inserted with ID:", userId);
      // console.log("User data:", savedUser);
      console.log("whooo");
      // console.log(userId,'line 106')
      new_user_id = userId;
      res.setHeader("Content-Type", "text/html");
      // res.render("display_detail", { active_users });
      // res.send('<html><head><title>HTML Response</title></head><body><h1>Hello, world!</h1></body></html>');
    })

    .catch((err) => console.error("Error inserting document:", err));
});

// LOGIN PAGE
app.get("/login-page", (req, res) => {
  const filePath = path.join(__dirname, "public/login.html");

  // Read the HTML file and send it as the response
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).type("text/html").send(data);
    }
  });
});

// LOGIN PAGE FOR OUTPUT
app.post("/login-page", (req, res) => {
  const data = req.body;

  UserModel.find({ LOGIN: data.id })
    .then((users) => {
      if (users.length === 0) {
        console.log("No user found with the specified ID");
        res.status(404).json({ error: "No user found with the specified ID" });
      } else {
        const user = users.find((user) => user.PASSWORD === data.password);
        if (user) {
          console.log("Valid password");
          console.log(user);
          // res.render("list_of_users", { active_users });
          //   res.status(200).json(user);
          res.json({ success: true });
          active_users[user.id] = user.FIRST_NAME;

          setTimeout(() => {
            // Render the page after the delay
            // res.render("", { active_users });
          }, 3000);
        } else {
          console.log("Invalid password");
          res.status(401).json({ error: "Invalid password" });
        }
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

// SOCKET

// const socket = io();

io.on("connection", (socket) => {
  console.log("CONNECTED TO SOCKET", socket.id);

  let fname = ""; // Declare fname variable in the connection scope

  socket.join("live-users");

  socket.on("name", (name) => {
    // fname = name; // Update fname when receiving the name event
    // id_nd_name[new_user_id]=name;
    // console.log(new_user_id,'line 181')
    active_users[new_user_id] = name;

    // active_users.push(id_nd_name);

    // Object.assign(active_users, id_nd_name);
    console.log("PUSHED TO THE ARRAY");
    console.log(active_users);
  });

  socket.on("fetch-data", async (id) => {
    console.log("Got data", id);

    const userId = id;
    console.log("Line 199", userId);
    try {
      // Fetch user details from MongoDB using Mongoose
      const user = await UserModel.findById(userId);
      if (!user) {
        console.log("User not found");
        socket.emit("user-not-found", userId); // Emit an event indicating that user is not found
        return; // Exit the function if user is not found
      }
      // Log the user details
      console.log("User found:", user);
      socket.emit("user-details", user); // Emit user details back to the client
    } catch (err) {
      console.error("Error fetching user details:", err);
      // Handle the error appropriately
    }
  });

  socket.on("disconnect", () => {
    if (active_users.hasOwnProperty(new_user_id)) {
      delete active_users[new_user_id];
    }
  });

  socket.emit("connected-users", active_users);
});

app.get("/active", (req, res) => {
  // console.log(active_users)
  res.render("list_of_users", { active_users });
});

app.get("/display-detail", async (req, res) => {
  const userId = req.body;
  console.log("line 215", userId);
  try {
    // Fetch user details from MongoDB using Mongoose
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    // res.json(user);
    res.json(user); // Send user details as JSON response
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).send("Internal Server Error");
  }
});

server.listen(PORT, console.log("Server is started", PORT));
