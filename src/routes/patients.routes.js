const express = require("express");
const router = express.Router();

const patientsController = require("../controllers/patients.controller");


/**
 * Маршруты для управления пациентами.
 *
 * POST   /         — создание пациента.
 * GET    /         — получение списка пациентов.
 * GET    /:id      — получение пациента по ID.
 * PATCH  /:id      — частичное обновление пациента.
 * DELETE /:id      — удаление пациента.
 */
router.post("/", patientsController.createPatient);
router.get("/", patientsController.listPatients);
router.get("/:id", patientsController.getPatientById);
router.patch("/:id", patientsController.updatePatient);
router.delete("/:id", patientsController.deletePatient);


module.exports = router;