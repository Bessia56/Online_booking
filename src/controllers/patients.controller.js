const patientsService = require("../services/patients.service");

/**
 * Создаёт нового пациента.
 *
 * Получает данные пациента из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function createPatient(req, res, next) {
    try {
        const patient = await patientsService.createPatient(req.body);

        res.status(201).json(patient);
    } catch (error) {
        next(error);
    }
}

/**
 * Возвращает список всех пациентов.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listPatients(req, res, next) {
    try {
        const patients  = await patientsService.listPatients();
        res.status(200).json(patients);
    } catch (error) {
        next(error);
    }
}

/**
 * Возвращает пациента по его ID.
 *
 * ID извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function getPatientById(req, res, next) {
    try {
        const patient = await patientsService.getPatientById(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.status(200).json(patient);
    } catch (error) {
        next(error);
    }
}

/**
 * Частично обновляет данные пациента.
 *
 * ID извлекается из req.params, новые данные — из req.body.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function updatePatient(req, res, next) {
    try {
        const patient = await patientsService.updatePatient(req.params.id, req.body);
        
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.status(200).json(patient);
    } catch (error) {
        next(error);
    }
}

/**
 * Удаляет пациента по его ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function deletePatient(req, res, next) {
    try {
        const patient = await patientsService.deletePatient(req.params.id);
        
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.status(200).json({ message: "Patient deleted successfully" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPatient,
    listPatients,
    getPatientById,
    updatePatient,
    deletePatient
};

