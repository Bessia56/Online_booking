const express = require("express");
const app = express();

const patientsRoutes = require("./src/routes/patients.routes");
const doctorsRoutes = require("./src/routes/doctors.routes");
const servicesRoutes = require("./src/routes/services.routes");


app.use(express.json());

app.use("/patients", patientsRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/services", servicesRoutes);


app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
    // Если заголовки уже отправлены, передаем ошибку следующему middleware
    if (res.headersSent) {
        return next(err);
    }
    // Устанавливаем код состояния и сообщение по умолчанию
    let statusCode = err.statusCode || 500;
    let message = err.message;
    let errors;

    //Ошибки Yup валидации
    if (err.name === "ValidationError") {
        console.error("[VALIDATION]", req.url, err.errors);

        return res.status(400).json({
            statusCode: "error",
            code: 400,
            message: "Ошибка данных",
            errors: err.errors,
        });
    }

    // Ошибки PostgreSQL

    //Нарушение UNIQUE
    else if (err.code === "23505") {
        statusCode = 409;
        message = "Такая запись уже существует";
    } 
    //Нарушение FOREIGN KEY
    else if (err.code === "23503") {
        statusCode = 409;
        message =
            "Невозможно выполнить операцию: запись связана с другими данными";
    } 
    //Нарушение NOT NULL или CHECK
    else if (err.code === "23502" || err.code === "23514") {
        statusCode = 400;
        message = "Нарушены ограничения базы данных";
    }


    if (statusCode) {
        message = "Внутренняя ошибка сервера";
        console.error("[INTERNAL ERROR]", req.url, err);
    } 
    
    else if (err.name !== "ValidationError") {
        console.error("[APPLICATION ERROR]", req.url, err.message);
    }


        return res.status(statusCode).json({
            statusCode: "error",
            code: statusCode,
            message: message,
            ...(errors && { errors })
        });
    });


module.exports = app;
