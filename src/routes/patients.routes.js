const express = require("express");
const router = express.Router();
const validate = require("../validator/validate");

const patientsController = require("../controllers/patients.controller");
const {
    createPatientSchema,
    updatePatientSchema
} = require("../validator/patients.validator");


/**
 * Маршруты для управления пациентами.
 *
 * POST   /         — создание пациента.
 * GET    /         — получение списка пациентов.
 * GET    /:id      — получение пациента по ID.
 * GET    /phone/:phone — получение пациента по номеру телефона.
 * PATCH  /:id      — частичное обновление пациента.
 * DELETE /:id      — удаление пациента.
 */
router.post("/", validate(createPatientSchema), patientsController.createPatient);
router.get("/", patientsController.listPatients);
router.get("/:id", patientsController.getPatientById); 
router.get("/phone/:phone", patientsController.getPatientByPhone);
router.patch("/:id", validate(updatePatientSchema), patientsController.updatePatient);
router.delete("/:id", patientsController.deletePatient);


module.exports = router;