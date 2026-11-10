const db = require("../config/db");

/**
 * Создаёт нового пациента в базе данных.
 *
 * @param {Object} patientData - Данные нового пациента.
 * @returns {Promise<Object>} Созданная запись пациента.
 */
async function createPatient(patientData) {
    const [patient] = await db("patients") // [patient] - деструктуризация массива
        .insert(patientData)
        .returning("*");

    return patient;
}

/**
 * Получает список всех пациентов.
 *
 * @returns {Promise<Object[]>} Массив пациентов.
 */
async function listPatients() {
    const patients = await db("patients").select("*");
    return patients;
}

/**
 * Получает пациента по ID.
 *
 * @param {number|string} id - Идентификатор пациента.
 * @returns {Promise<Object|undefined>} Найденный пациент или undefined.
 */
async function getPatientById(id) {
    const [patient] = await db("patients").select("*").where({ id });
    return patient;
}

/**
 * Получает пациента по номеру телефона.
 *
 * @param {number|string} phone - Номер телефона пациента.
 * @returns {Promise<Object|undefined>} Найденный пациент или undefined.
 */
async function getPatientByPhone(phone) {
    const [patient] = await db("patients").select("*").where({ phone });
    return patient;
}

/**
 * Частично обновляет данные пациента.
 *
 * @param {number|string} id - Идентификатор пациента.
 * @param {Object} updateData - Поля, которые необходимо обновить.
 * @returns {Promise<Object|undefined>} Обновлённый пациент или undefined.
 */
async function updatePatient(id, updateData) {
    const [patient] = await db("patients").where({ id }).update(updateData).returning("*");
    return patient;
}

/**
 * Удаляет пациента по ID.
 *
 * @param {number|string} id - Идентификатор пациента.
 * @returns {Promise<Object|undefined>} Удалённый пациент или undefined.
 */
async function deletePatient(id) {
    const [patient] = await db("patients").where({ id }).delete().returning("*");
    return patient;
}


module.exports = {
    createPatient,
    listPatients,
    getPatientById,
    getPatientByPhone,
    updatePatient,
    deletePatient
};