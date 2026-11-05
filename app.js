const express = require("express");
const app = express();

const doctorsRoutes = require("./src/routes/doctors.routes");

app.use(express.json());











module.exports = app;