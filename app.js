const express = require("express");
const app = express();

const patientsRoutes = require("./src/routes/patients.routes");
const doctorsRoutes = require("./src/routes/doctors.routes");



app.use(express.json());


app.use("/patients", patientsRoutes);
app.use("/doctors", doctorsRoutes);


module.exports = app;