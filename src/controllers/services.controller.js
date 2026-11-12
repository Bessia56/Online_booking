const servicesModel = require("../model/services.model");

/**
 * Создаёт новую услугу.
 *
 * Данные услуги извлекаются из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными услуги.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function createService(req, res) {
    const service = await servicesModel.createService(req.body);

    res.status(201).json(service);
}

/**
 * Возвращает список всех услуг.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function listServices(req, res) {
    const services = await servicesModel.listServices();
    res.status(200).json(services);
}

/**
 * Возвращает услугу по её ID.
 *
 * ID услуги извлекается из параметров маршрута.
 * Если услуга не найдена, возвращает HTTP 404.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function getServiceById(req, res) {
    const service = await servicesModel.getServiceById(req.params.id);
    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }
    res.status(200).json(service);
}

/**
 * Частично обновляет данные услуги.
 *
 * ID услуги извлекается из параметров маршрута,
 * новые данные — из тела HTTP-запроса.
 *
 * Если услуга не найдена, возвращает HTTP 404.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными для обновления.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function updateService(req, res) {
    const service = await servicesModel.updateService(
        req.params.id,
        req.body,
    );

    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }
    res.status(200).json(service);
}

/**
 * Деактивирует услугу по её ID.
 *
 * ID услуги извлекается из параметров маршрута.
 * Если услуга не найдена, возвращает HTTP 404.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function deleteService(req, res) {
    const service = await servicesModel.deleteService(req.params.id);

    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }
    res.status(200).json({ message: "Service deleted successfully" });
}



module.exports = {
    createService,
    listServices,
    getServiceById,
    updateService,
    deleteService,
};
