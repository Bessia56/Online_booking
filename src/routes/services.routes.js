const express = require("express");
const router = express.Router();
const validate = require("../validator/validate");

const servicesController = require("../controllers/services.controller");
const {
    createServiceSchema,
    updateServiceSchema,
} = require("../validator/services.validator");

/**
 * Маршруты для управления услугами.
 *
 * POST   /         — создание услуги.
 * GET    /         — получение списка услуг.
 * GET    /:id      — получение услуги по ID.
 * PATCH  /:id      — частичное обновление услуги.
 * DELETE /:id      — удаление услуги.
 */
router.post("/", validate(createServiceSchema), servicesController.createService);
router.get("/", servicesController.listServices);
router.get("/:id", servicesController.getServiceById);
router.patch("/:id", validate(updateServiceSchema), servicesController.updateService);
router.delete("/:id", servicesController.deleteService);

module.exports = router;
