const doctorServicesModel = require("../model/doctorServices.model");


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
async function createDoctorService(req, res) {
    const doctorService = await doctorServicesModel.createDoctorService(
        req.params.doctorId,
        req.body.service_id,
        req.body.duration_minutes,
    );

    return res.status(201).json(doctorService);
}

/**
 * Возвращает список всех связей врачей и услуг.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listDoctorServices(req, res) {
    const doctorServices = await doctorServicesModel.listDoctorServices(
        req.params.doctorId
    );

    res.status(200).json(doctorServices);
}

/**
 * Возвращает список связей врача и услуг по ID врача.
 *
 * ID извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function getDoctorServiceById(req, res) {
    const doctorService = await doctorServicesModel.getDoctorServiceById(
        req.params.doctorId,
        req.params.serviceId,
    );
    if (!doctorService) {
        return res.status(404).json({ error: "Doctor service not found" });
    }
    return res.status(200).json(doctorService);
}

/**
 * Изменяет параметр продолжительность приема уже существующей связи ID врача.
 *
 * ID извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function updateDoctorService(req, res) {
    const doctorService = await doctorServicesModel.updateDoctorService(
        req.params.doctorId,
        req.params.serviceId,
        req.body,
    );

    if (!doctorService) {
        return res.status(404).json({ error: "Doctor service not found" });
    }
    res.status(200).json(doctorService);
}

/**
 * Удаляет связь врача и услуги по её ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function deleteDoctorService(req, res) {
    const doctorService = await doctorServicesModel.deleteDoctorService(
        req.params.doctorId,
        req.params.serviceId
    );

    if (!doctorService) {
        return res.status(404).json({ error: "Doctor service not found" });
    }
    res.status(200).json({
        message: "Doctor service deleted successfully",
    });
}

module.exports = {
    createDoctorService,
    listDoctorServices,
    getDoctorServiceById,
    updateDoctorService,
    deleteDoctorService,
};
