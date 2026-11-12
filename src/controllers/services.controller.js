const servicesModel = require("../model/services.model");

/**
 * Создаёт новую услугу.
 *
 * Получает данные услуги из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
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
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listServices(req, res) {
    const services = await servicesModel.listServices();
    res.status(200).json(services);
}

/**
 * Возвращает услугу по её ID.
 *
 * ID извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
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
 * ID извлекается из req.params, новые данные — из req.body.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
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
 * Удаляет услугу по её ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
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
