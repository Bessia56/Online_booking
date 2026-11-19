const express = require("express");
const router = express.Router();
const appointmentsController =
    require("../controllers/appointments.controller");


/**
 *  Маршруты для управления записями пациентов.
 * 
 * GET /appointments - получение списка записей 
 * GET /appointments/patient/:patientId - получение записи по пациенту
 * GET /appointments/:id - получение записи по id
 */

router.get("/", appointmentsController.listAppointments);
router.get("/patient/:patientId", appointmentsController.listPatientAppointments);
router.get("/patient/:patientId/:appointmentId", appointmentsController.getPatientAppointmentById);


module.exports = router;