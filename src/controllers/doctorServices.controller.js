const doctorServicesService = require("../services/doctorServices.service");

/**
 * Создаёт новую связь врача и услуги.
 *
 * Получает данные связи из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function createDoctorService(req, res, next) {
    try {
        const doctorService = await doctorServicesService.createDoctorService(
            req.params.doctorId,
            req.body.service_id,
            req.body.duration_minutes
        );

        return res.status(201).json(doctorService);
    } catch (error) {
        return next(error);
    }
}

/**
 * Возвращает список всех связей врачей и услуг.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listDoctorServices(req, res, next) {
    try {
        const doctorServices = await doctorServicesService.listDoctorServices();
        res.status(200).json(doctorServices);
    } catch (error) {
        next(error);
    }
}

/**
 * Возвращает связь врача и услуги по её ID.
 *
 * ID извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function getDoctorServiceById(req, res, next) {
    try {
        const doctorService = await doctorServicesService.getDoctorServiceById(req.params.id);
        if (!doctorService) {
            return res.status(404).json({ error: "Doctor service not found" });
        }
        res.status(200).json(doctorService);
    } catch (error) {
        next(error);
    }
}

/**
 * Частично обновляет данные связи врача и услуги.
 *
 * ID извлекается из req.params, новые данные — из req.body.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function updateDoctorService(req, res, next) {
    try {
        const doctorService = await doctorServicesService.updateDoctorService(
            req.params.id,
            req.body,
        );

        if (!doctorService) {
            return res.status(404).json({ error: "Doctor service not found" });
        }
        res.status(200).json(doctorService);
    } catch (error) {
        next(error);
    }
}

/**
 * Удаляет связь врача и услуги по её ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function deleteDoctorService(req, res, next) {
    try {
        const doctorService = await doctorServicesService.deleteDoctorService(req.params.id);

        if (!doctorService) {
            return res.status(404).json({ error: "Doctor service not found" });
        }
        res.status(200).json({ message: "Doctor service deleted successfully" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createDoctorService,
    listDoctorServices,
    getDoctorServiceById,
    updateDoctorService,
    deleteDoctorService,
};
