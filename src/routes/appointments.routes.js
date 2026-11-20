const express = require("express");
const router = express.Router();
const validate = require("../validator/validate");
const appointmentsController =
    require("../controllers/appointments.controller");

const { createAppointmentSchema, updateAppointmentSchema,updateAppointmentStatusSchema } = require("../validator/appointments.schema");


/**
 * Маршруты для управления записями на приём.
 *
 * POST    /appointments                              — создание записи
 * GET     /appointments                              — получение всех записей
 * GET     /appointments/patient/:patientId           — получение записей пациента
 * GET     /appointments/patient/:patientId/:appointmentId — получение конкретной записи
 * PATCH   /appointments/:id                          — обновление записи
 * PATCH   /appointments/:id/status                   — изменение статуса записи
 * DELETE  /appointments/:id                          — отмена записи
 */
router.post(
    "/",
    validate(createAppointmentSchema),
    appointmentsController.createAppointment
);
router.get("/", appointmentsController.listAppointments);
router.get(
    "/patient/:patientId",
    appointmentsController.listPatientAppointments
);
router.get(
    "/patient/:patientId/:appointmentId",
    appointmentsController.getPatientAppointmentById
);
router.patch(
    "/:id/status",
    validate(updateAppointmentStatusSchema),
    appointmentsController.updateAppointmentStatus
);
router.patch(
    "/:id",
    validate(updateAppointmentSchema),
    appointmentsController.updateAppointment
);
router.delete("/:id", appointmentsController.cancelAppointment);


module.exports = router;