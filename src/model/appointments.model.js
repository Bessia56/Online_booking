const db = require("../config/db");

/**
 * Получение списка всех записей.
 *
 * @returns {Promise<Array<Object>>} Массив записей.
 */
async function listAppointments() {
    return await db("appointments").select("*");
}

/**
 * Получение списка записей конкретного пациента.
 *
 * @param {string|number} patientId - ID пациента.
 * @returns {Promise<Array<Object>>} Массив записей пациента.
 */
async function listPatientAppointments(patientId) {
    return await db("appointments")
        .select("*")
        .where({ patient_id: patientId });
}

/**
 * Получение конкретной записи пациента по ID.
 *
 * @param {string|number} patientId - ID пациента.
 * @param {string|number} appointmentId - ID записи.
 * @returns {Promise<Object|undefined>} Запись или undefined, если она не найдена.
 */
async function getPatientAppointmentById(patientId, appointmentId) {
    return await db("appointments")
        .where({ patient_id: patientId, id: appointmentId })
        .first();
}

/**
 * Создание новой записи.
 *
 * @param {Object} appointment - Данные записи.
 * @returns {Promise<Object>} Созданная запись.
 */
async function createAppointment(appointmentData) {
    const [appointment] = await db("appointments")
        .insert(appointmentData)
        .returning("*");

    return appointment;
}

/**
 * Обновление записи.
 *
 * @param {string|number} appointmentId - ID записи.
 * @param {Object} appointment - Объект записи.
 * @returns {Promise<Object>} Обновленная запись.
 */
async function updateAppointment(appointmentId, appointmentData) {
    const [appointment] = await db("appointments")
        .where({ id: appointmentId })
        .update(appointmentData)
        .returning("*");

    return appointment;
}

/**
 * Получение записи по ID.
 *
 * @param {string|number} appointmentId - ID записи.
 * @returns {Promise<Object|undefined>}
 */
async function getAppointmentById(appointmentId) {
    return await db("appointments")
        .where({ id: appointmentId })
        .first();
}

/**
 * Изменение статуса записи.
 *
 * @param {string|number} appointmentId - ID записи.
 * @param {string} status - Новый статус.
 * @returns {Promise<Object|undefined>}
 */
async function updateAppointmentStatus(appointmentId, status) {
    const [appointment] = await db("appointments")
        .where({ id: appointmentId })
        .update({ status })
        .returning("*");

    return appointment;
}

module.exports = {
    listAppointments,
    listPatientAppointments,
    getPatientAppointmentById,
    createAppointment,
    updateAppointment,
    getAppointmentById,
    updateAppointmentStatus,
};
