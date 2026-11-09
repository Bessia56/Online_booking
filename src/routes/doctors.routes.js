const express = require("express");
const router = express.Router();
const validate = require("../validators/validate");

const doctorsController = require("../controllers/doctors.controller");
const {
    createDoctorSchema,
    updateDoctorSchema,
} = require("../validators/doctors.validator");

/**
 * Маршруты для управления врачами.
 *
 * POST   /         — создание врача.
 * GET    /         — получение списка врачей.
 * GET    /:id      — получение врача по ID.
 * PATCH  /:id      — частичное обновление врача.
 * DELETE /:id      — удаление врача.
 */
router.post("/", validate(createDoctorSchema), doctorsController.createDoctor);
router.get("/", doctorsController.listDoctors);
router.get("/:id", doctorsController.getDoctorById);
router.patch("/:id", validate(updateDoctorSchema), doctorsController.updateDoctor);
router.delete("/:id", doctorsController.deleteDoctor);

module.exports = router;
