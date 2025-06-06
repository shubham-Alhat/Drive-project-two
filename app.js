const express = require("express");
const userRoutes = require("./routes/user.routes");
const indexRouter = require("./routes/index.routes");
const dotenv = require("dotenv");
const connectToDb = require("./config/db");
const cookieParser = require("cookie-parser");
dotenv.config(); // env variables are accessible to whole application

// connection to db
connectToDb();

const app = express();

app.set("view engine", "ejs"); // set the view engine
app.use(cookieParser()); // call cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRoutes);
app.use("/", indexRouter);

app.listen(3000, () => {
  console.log("server started at port 3000");
});
