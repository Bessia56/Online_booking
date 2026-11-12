const db = require("../config/db");

/**
 * Создаёт новую запись врача в базе данных.
 *
 * @param {Object} doctorData - Данные нового врача.
 * @returns {Promise<Object>} Созданная запись врача.
 */
async function createDoctor(doctorData) {
    const [doctor] = await db("doctors") // [doctor] - деструктуризация массива
        .insert(doctorData)
        .returning("*");

    return doctor;
}

/**
 * Получает список всех врачей.
 *
 * @returns {Promise<Object[]>} Массив врачей.
 */
async function listDoctors() {
    const doctors = await db("doctors").select("*");
    return doctors;
}

/**
 * Получает врача по ID.
 *
 * @param {number|string} id - Идентификатор врача.
 * @returns {Promise<Object|undefined>} Найденный врач или undefined.
 */
async function getDoctorById(id) {
    const [doctor] = await db("doctors").select("*").where({ id });
    return doctor;
}

/**
 * Частично обновляет данные врача.
 *
 * @param {number|string} id - Идентификатор врача.
 * @param {Object} updateData - Объект с полями для обновления.
 * @returns {Promise<Object|undefined>} Обновлённая запись врача или undefined, если врач не найден.
 */
async function updateDoctor(id, updateData) {
    const [doctor] = await db("doctors")
        .where({ id })
        .update(updateData)
        .returning("*");
    return doctor;
}

/**
 * Деактивирует врача по его ID.
 *
 * Физически запись из базы данных не удаляется.
 *
 * @param {number|string} id - Идентификатор врача.
 * @returns {Promise<Object|undefined>} Деактивированная запись врача или undefined, если врач не найден.
 */
async function deleteDoctor(id) {
    const [doctor] = await db("doctors")
        .where({ id })
        .update({ is_active: false })
        .returning("*");

    return doctor;
}

/**
 * Находит врача по номеру телефона.
 *
 * @param {string} phone - Номер телефона врача.
 * @returns {Promise<Object|undefined>} Найденный врач или undefined, если запись отсутствует.
 */
async function getDoctorByPhone(phone) {
    return await db("doctors").where({ phone }).first();
}

/**
 * Находит врача по адресу электронной почты.
 *
 * @param {string} email - Электронная почта врача.
 * @returns {Promise<Object|undefined>} Найденный врач или undefined, если запись отсутствует.
 */
async function getDoctorByEmail(email) {
    return await db("doctors").where({ email }).first();
}

/**
 * Проверяет существование и активность врача.
 *
 * Возвращает запись врача только в том случае, если он существует
 * и имеет is_active = true.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @returns {Promise<Object|undefined>} Запись активного врача или undefined, если врач отсутствует или неактивен.
 */
async function isDoctorActive(doctorId) {
    // Проверка существования и активности врача
    return await db("doctors").where({ id: doctorId, is_active: true }).first();
}

module.exports = {
    createDoctor,
    listDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    getDoctorByPhone,
    getDoctorByEmail,
    isDoctorActive,
};
