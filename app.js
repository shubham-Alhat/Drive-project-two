const express = require("express");
const userRoutes = require("./routes/user.routes");
const dotenv = require("dotenv");

dotenv.config(); // env variables are accessible to whole application

const app = express();

app.set("view engine", "ejs"); // set the view engine

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRoutes);

app.listen(3000, () => {
  console.log("server started at port 3000");
});
