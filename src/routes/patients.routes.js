const express = require("express");
const router = express.Router();
const validate = require("../validators/validate");

const patientsController = require("../controllers/patients.controller");
const {
    createPatientSchema,
    updatePatientSchema
} = require("../validators/patients.validator");


/**
 * Маршруты для управления пациентами.
 *
 * POST   /         — создание пациента.
 * GET    /         — получение списка пациентов.
 * GET    /:id      — получение пациента по ID.
 * PATCH  /:id      — частичное обновление пациента.
 * DELETE /:id      — удаление пациента.
 */
router.post("/", validate(createPatientSchema), patientsController.createPatient);
router.get("/", patientsController.listPatients);
router.get("/:id", patientsController.getPatientById);
router.patch("/:id", validate(updatePatientSchema), patientsController.updatePatient);
router.delete("/:id", patientsController.deletePatient);


module.exports = router;