const express = require("express");
const router = express.Router();

const servicesController = require("../controllers/services.controller");


/**
 * Маршруты для управления услугами.
 *
 * POST   /         — создание услуги.
 * GET    /         — получение списка услуг.
 * GET    /:id      — получение услуги по ID.
 * PATCH  /:id      — частичное обновление услуги.
 * DELETE /:id      — удаление услуги.
 */
router.post("/", servicesController.createService);
router.get("/", servicesController.listServices);
router.get("/:id", servicesController.getServiceById);
router.patch("/:id", servicesController.updateService);
router.delete("/:id", servicesController.deleteService);


module.exports = router;