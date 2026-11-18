const express = require("express");
const router = express.Router();
const validate = require("../validator/validate");
const doctorSchedulesController =
    require("../controllers/doctorSchedules.controller");

const doctorsController = require("../controllers/doctors.controller");
const {
    createDoctorSchema,
    updateDoctorSchema,
} = require("../validator/doctors.validator");

/**
 * Маршруты для управления врачами.
 *
 * POST   /                              — создание врача.
 * GET    /                              — получение списка всех врачей.
 * GET    /filter                        — фильтрация врачей.
 * GET    /active-with-schedule          — получение активных врачей с расписанием.
 * GET    /:id                           — получение врача по ID.
 * PATCH  /:id                           — частичное обновление врача.
 * DELETE /:id                           — деактивация врача.
 * PATCH  /:id/activate                  — активация врача.
 *
 * POST   /:doctorId/services            — добавление услуги врачу.
 * GET    /:id/services                  — получение списка услуг врача.
 * GET    /:doctorId/services/:serviceId — получение конкретной услуги врача.
 * PATCH  /:doctorId/services/:serviceId — изменение продолжительности приёма.
 * DELETE /:doctorId/services/:serviceId — деактивация услуги врача.
 */
router.post("/", validate(createDoctorSchema), doctorsController.createDoctor);
router.get("/", doctorsController.listDoctors);
router.get("/filter", doctorsController.filterDoctors);
router.get(
    "/active-with-schedule",
    doctorSchedulesController.listActiveDoctorsWithSchedule
);
router.get("/:id", doctorsController.getDoctorById);
router.patch(
    "/:id",
    validate(updateDoctorSchema),
    doctorsController.updateDoctor,
);
router.delete("/:id", doctorsController.deleteDoctor);
router.post("/:doctorId/services", doctorsController.addServiceToDoctor);
router.delete(
    "/:doctorId/services/:serviceId",
    doctorsController.removeServiceFromDoctor,
);
router.get("/:id/services", doctorsController.listDoctorServices);
router.get(
    "/:doctorId/services/:serviceId",
    doctorsController.getDoctorServiceById,
);
router.patch(
    "/:doctorId/services/:serviceId",
    doctorsController.updateDoctorService,
);
router.patch("/:id/activate", doctorsController.activateDoctor);


module.exports = router;
