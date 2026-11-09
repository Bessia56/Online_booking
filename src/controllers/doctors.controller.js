const doctorsService = require("../model/doctors.model");

/**
 * Создаёт нового врача.
 *
 * Получает данные врача из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function createDoctor(req, res, next) {
    const doctor = await doctorsService.createDoctor(req.body);

    res.status(201).json(doctor);
}

/**
 * Возвращает список всех врачей.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listDoctors(req, res, next) {
    const doctors = await doctorsService.listDoctors();
    res.status(200).json(doctors);
}

/**
 * Возвращает врача по его ID.
 *
 * ID извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function getDoctorById(req, res, next) {
    const doctor = await doctorsService.getDoctorById(req.params.id);
    if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json(doctor);
}

/**
 * Частично обновляет данные врача.
 *
 * ID извлекается из req.params, новые данные — из req.body.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function updateDoctor(req, res, next) {
    const doctor = await doctorsService.updateDoctor(req.params.id, req.body);

    if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json(doctor);
}

/**
 * Удаляет врача по его ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function deleteDoctor(req, res, next) {
    const doctor = await doctorsService.deleteDoctor(req.params.id);

    if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json({ message: "Doctor deleted successfully" });
}

module.exports = {
    createDoctor,
    listDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
};
