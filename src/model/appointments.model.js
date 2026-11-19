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
};

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

};


module.exports = {
    listAppointments,
    listPatientAppointments,
    getPatientAppointmentById,
};