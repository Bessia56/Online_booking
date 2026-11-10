const express = require("express");
const router = express.Router({ mergeParams: true }); //по умолчанию передаёт параметры родительского маршрута во вложенный роутер. 
const validate = require("../validator/validate");

const doctorServicesController = require("../controllers/doctorServices.controller");
const {
    createDoctorServiceSchema,
    updateDoctorServiceSchema
} = require("../validator/doctorServices.validator");

/**
 * Маршруты для управления связями врачей и услуг.
 *
 * POST   /         — Привязать услугу к врачу.
 * GET    /         — Получить все услуги врача
 * GET    /:id      — Получить конкретную услугу врача
 * PATCH  /:id      — Изменить параметры связи.
 * DELETE /:id      — Удалить привязку услуги.
 */
router.post(
    "/",
    validate(createDoctorServiceSchema),
    doctorServicesController.createDoctorService
);
router.get("/", doctorServicesController.listDoctorServices);
router.get("/:serviceId", doctorServicesController.getDoctorServiceById);
router.patch(
    "/:serviceId",
    validate(updateDoctorServiceSchema),
    doctorServicesController.updateDoctorService
);
router.delete("/:serviceId", doctorServicesController.deleteDoctorService);

module.exports = router;