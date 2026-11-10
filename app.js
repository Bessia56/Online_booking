const express = require("express");
const app = express();

const patientsRoutes = require("./src/routes/patients.routes");
const doctorsRoutes = require("./src/routes/doctors.routes");
const servicesRoutes = require("./src/routes/services.routes");
const doctorServicesRoutes = require("./src/routes/doctorServices.routes");

app.use(express.json());


app.use("/patients", patientsRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/services", servicesRoutes);

app.use("/doctors/:doctorId/services", doctorServicesRoutes);

app.use((err, req, res, next) => {
    if (err.name === "ValidationError") {
        console.error("[VALIDATION]", req.url, err.errors);

        return res.status(400).json({
            name: "Ошибка данных",
            errors: err.errors
        });
    }

    if (err.statusCode) {
        console.error("[APPLICATION ERROR]", req.url, err.message);

        return res.status(err.statusCode).json({
            error: err.message
        });
    }

    console.error("[INTERNAL ERROR]", req.url, err);

    return res.status(500).json({
        error: "Внутренняя ошибка сервера"
    });
});

module.exports = app;   