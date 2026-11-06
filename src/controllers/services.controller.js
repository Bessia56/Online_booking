const servicesService = require("../services/services.service");

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
async function createService(req, res, next) {
    try {
        const service = await servicesService.createService(req.body);

        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
}

/**
 * Возвращает список всех услуг.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listServices(req, res, next) {
    try {
        const services = await servicesService.listServices();
        res.status(200).json(services);
    } catch (error) {
        next(error);
    }
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
async function getServiceById(req, res, next) {
    try {
        const service = await servicesService.getServiceById(req.params.id);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.status(200).json(service);
    } catch (error) {
        next(error);
    }
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
async function updateService(req, res, next) {
    try {
        const service = await servicesService.updateService(req.params.id, req.body);
        
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.status(200).json(service);
    } catch (error) {
        next(error);
    }
}

/**
 * Удаляет услугу по её ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function deleteService(req, res, next) {
    try {
        const service = await servicesService.deleteService(req.params.id);
        
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createService,
    listServices,
    getServiceById,
    updateService,
    deleteService
};

