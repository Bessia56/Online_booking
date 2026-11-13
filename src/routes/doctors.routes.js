const express = require("express");
const router = express.Router();
const validate = require("../validator/validate");

const doctorsController = require("../controllers/doctors.controller");
const {
    createDoctorSchema,
    updateDoctorSchema,
} = require("../validator/doctors.validator");

/**
 * Маршруты для управления врачами.
 *
 * POST   /         — создание врача.
 * GET    /         — получение списка врачей.
 * GET    /:id      — получение врача по ID.
 * PATCH  /:id      — частичное обновление врача.
 * DELETE /:id      — удаление врача.
 * POST   /:id/services          — добавление услуги врачу.
 * DELETE /:id/services/:serviceId — удаление услуги у врача.
 * GET    /:id/services          — получение списка услуг врача.
 * GET    /:doctorId/services/:serviceId — получение конкретной услуги врача.
 * PATCH  /:doctorId/services/:serviceId — изменение продолжительности приема.
 * PATCH  /doctors/:id/activate — активация врача.
 * GET    /doctors/active — получение списка активных врачей.
 * GET    /doctors/:serviceId — получение списка активных врачей по услуге.
 */
router.post("/", validate(createDoctorSchema), doctorsController.createDoctor);
router.get("/", doctorsController.listDoctors);
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
router.get("/", doctorsController.listDoctors);

module.exports = router;
