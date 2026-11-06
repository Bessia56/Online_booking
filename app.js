const express = require("express");
const app = express();

const patientsRoutes = require("./src/routes/patients.routes");
const doctorsRoutes = require("./src/routes/doctors.routes");
const servicesRoutes = require("./src/routes/services.routes");


app.use(express.json());


app.use("/patients", patientsRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/services", servicesRoutes);
app.use("/doctors/:doctorId/services", doctorServicesRoutes);


module.exports = app;