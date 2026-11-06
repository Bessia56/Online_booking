const express = require("express");
const router = express.Router();

const doctorsController = require("../controllers/doctors.controller");

/**
 * Маршруты для управления врачами.
 *
 * POST   /         — создание врача.
 * GET    /         — получение списка врачей.
 * GET    /:id      — получение врача по ID.
 * PATCH  /:id      — частичное обновление врача.
 * DELETE /:id      — удаление врача.
 */
router.post("/", doctorsController.createDoctor);
router.get("/", doctorsController.listDoctors);
router.get("/:id", doctorsController.getDoctorById);
router.patch("/:id", doctorsController.updateDoctor);
router.delete("/:id", doctorsController.deleteDoctor);

module.exports = router;
