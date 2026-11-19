const appointmentsModel = require("../models/appointments.model");
const patientsModel = require("../models/patients.model");

/**
 * Получает список всех записей на приём.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком записей.
 */
async function listAppointments(req, res) {
    const appointments = await appointmentsModel.listAppointments();
    return res.status(200).json(appointments);
}

/**
 * Получает список записей конкретного пациента.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID пациента в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком записей пациента.
 */
async function listPatientAppointments(req, res) {
    const { patientId } = req.params;

    const patient = await patientsModel.getPatientById(patientId);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }

    const appointments =
        await appointmentsModel.listPatientAppointments(patientId);

    return res.status(200).json(appointments);
}

/**
 * Получает конкретную запись пациента по ID.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID пациента и ID записи в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с найденной записью.
 */
async function getPatientAppointmentById(req, res) {
    const { patientId, appointmentId } = req.params;

    const patient = await patientsModel.getPatientById(patientId);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }

    const appointments = await appointmentsModel.getPatientAppointmentById(
        patientId,
        appointmentId,
    );
    if (!appointments) {
        return res.status(404).json({ error: "Appointment not found" });
    }

    return res.status(200).json(appointments);
}

module.exports = {
    listAppointments,
    listPatientAppointments,
    getPatientAppointmentById,
};
