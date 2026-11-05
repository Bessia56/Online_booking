const express = require("express");
const app = express();

const patientsRoutes = require("./src/routes/patients.routes");



app.use(express.json());


app.use("/patients", patientsRoutes);



module.exports = app;