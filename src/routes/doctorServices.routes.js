const express = require("express");
const router = express.Router();

const doctorServicesController = require("../controllers/doctorServices.controller");

/**
 * Маршруты для управления связями врачей и услуг.
 *
 * POST   /         — Привязать услугу к врачу.
 * GET    /         — Получить все услуги врача
 * GET    /:id      — Получить конкретную услугу врача
 * PATCH  /:id      — Изменить параметры связи.
 * DELETE /:id      — Удалить привязку услуги.
 */
router.post("/", doctorServicesController.createDoctorService);
router.get("/", doctorServicesController.listDoctorServices);
router.get("/:id", doctorServicesController.getDoctorServiceById);
router.patch("/:id", doctorServicesController.updateDoctorService);
router.delete("/:id", doctorServicesController.deleteDoctorService);

module.exports = router;