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

/**
 * Повторно активирует врача по его ID.
 *
 * Устанавливает is_active = true.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @returns {Promise<Object|undefined>} Активированная запись врача или undefined, если врач не найден.
 */
async function activateDoctor(doctorId) {
    const [doctor] = await db("doctors")
        .where({ id: doctorId })
        .update({ is_active: true })
        .returning("*");

    return doctor;
}

/**
 * Возвращает список всех врачей.
 *
 * @returns {Promise<Object[]>} Массив записей врачей.
 */
async function filterDoctors() {
    return await db("doctors").select("*");
}

/**
 * Возвращает список всех активных врачей.
 *
 * @returns {Promise<Object[]>} Массив активных врачей.
 */
async function listActiveDoctors() {
    return await db("doctors").where({ is_active: true }).select("*");
}

/**
 * Возвращает список всех неактивных врачей.
 *
 * @returns {Promise<Object[]>} Массив неактивных врачей.
 */
async function listInactiveDoctors() {
    return await db("doctors").where({ is_active: false }).select("*");
}

/**
 * Возвращает список активных врачей, оказывающих указанную услугу.
 *
 * Учитывает активность врача, услуги и связи между ними.
 *
 * @param {number|string} serviceId - Идентификатор услуги.
 * @returns {Promise<Object[]>} Массив активных врачей.
 */
async function listActiveDoctorsByService(serviceId) {
    return await db("doctors")
        .join("doctor_services", "doctors.id", "doctor_services.doctor_id")
        .join("services", "doctor_services.service_id", "services.id")
        .where({
            "doctors.is_active": true,
            "doctor_services.is_active": true,
            "services.is_active": true,
            "services.id": serviceId
        })
        .select("doctors.*")
        .distinct();
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
    activateDoctor,
    filterDoctors,
    listActiveDoctors,
    listInactiveDoctors,
    listActiveDoctorsByService,
};
