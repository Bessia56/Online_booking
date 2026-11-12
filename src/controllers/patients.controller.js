const patientsModel = require("../model/patients.model");

/**
 * Создаёт нового пациента.
 *
 * Проверяет, зарегистрирован ли пациент с указанным номером телефона.
 *
 * Данные пациента извлекаются из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными пациента.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function createPatient(req, res) {
    const activePatient = await patientsModel.getPatientByPhone(req.body.phone);
    if (activePatient) {
        return res
            .status(400)
            .json({ error: "Patient with this phone number already exists" });
    }
    const patient = await patientsModel.createPatient(req.body);

    res.status(201).json(patient);
}

/**
 * Возвращает список всех пациентов.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function listPatients(req, res) {
    const patients = await patientsModel.listPatients();
    res.status(200).json(patients);
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
async function getPatientById(req, res) {
    const patient = await patientsModel.getPatientById(req.params.id);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json(patient);
}

/**
 * Возвращает пациента по его номеру телефона.
 *
 * Номер телефона извлекается из параметров маршрута req.params.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function getPatientByPhone(req, res) {
    const patient = await patientsModel.getPatientByPhone(req.params.phone);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json(patient);
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
async function updatePatient(req, res) {
    const patient = await patientsModel.updatePatient(req.params.id, req.body);

    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json(patient);
}

/**
 * Удаляет пациента по его ID.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @param {import("express").NextFunction} next - Передача ошибки middleware.
 * @returns {Promise<import("express").Response | void>}
 */
async function deletePatient(req, res) {
    const patient = await patientsModel.deletePatient(req.params.id);

    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json({ message: "Patient deleted successfully" });
}

module.exports = {
    createPatient,
    listPatients,
    getPatientById,
    getPatientByPhone,
    updatePatient,
    deletePatient,
};
