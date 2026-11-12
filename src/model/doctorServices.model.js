const db = require("../config/db");

/**
 * Создаёт новую связь между врачом и услугой.
 *
 * При создании связь получает статус is_active = true.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @param {number|string} serviceId - Идентификатор услуги.
 * @param {number} durationMinutes - Продолжительность услуги в минутах.
 * @returns {Promise<Object>} Созданная запись связи.
 */
async function createDoctorService(doctorId, serviceId, durationMinutes) {
    // Создание новой связи
    const [doctorService] = await db("doctor_services")
        .insert({
            doctor_id: doctorId,
            service_id: serviceId,
            duration_minutes: durationMinutes,
            is_active: true,
        })
        .returning("*");

    return doctorService;
}

/**
 * Находит существующую связь между врачом и услугой.
 *
 * Возвращает запись независимо от её статуса активности.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @param {number|string} serviceId - Идентификатор услуги.
 * @returns {Promise<Object|undefined>} Найденная связь или undefined, если она отсутствует.
 */
async function getDoctorServiceRelation(doctorId, serviceId) {
    // Проверка существующей связи
    return await db("doctor_services")
        .where({
            doctor_id: doctorId,
            service_id: serviceId,
        })
        .first();
}

/**
 * Повторно активирует существующую связь врача и услуги.
 *
 * Обновляет продолжительность услуги и устанавливает is_active = true.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @param {number|string} serviceId - Идентификатор услуги.
 * @param {number} durationMinutes - Новая продолжительность услуги в минутах.
 * @returns {Promise<Object|undefined>} Обновлённая связь или undefined, если запись не найдена.
 */
async function reactivateRelation(doctorId, serviceId, durationMinutes) {
    // Восстановление неактивной связи
    const [doctorService] = await db("doctor_services")
        .where({
            doctor_id: doctorId,
            service_id: serviceId,
        })
        .update({
            duration_minutes: durationMinutes,
            is_active: true,
        })
        .returning("*");

    return doctorService;
}

/**
 * Возвращает список активных услуг, назначенных указанному врачу.
 *
 * Учитывает активность врача, услуги и самой связи.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @returns {Promise<Object[]>} Массив активных связей с данными услуг.
 */
async function listDoctorServices(doctorId) {
    const doctorServices = await db("doctor_services")
        .join("doctors", "doctor_services.doctor_id", "doctors.id")
        .join("services", "doctor_services.service_id", "services.id")
        .where({
            "doctor_services.doctor_id": doctorId,
            "doctors.is_active": true,
            "services.is_active": true,
            "doctor_services.is_active": true,
        })
        .select(
            "doctor_services.id",
            "doctor_services.doctor_id",
            "doctor_services.service_id",
            "services.name",
            "services.price",
            "doctor_services.duration_minutes",
        );

    return doctorServices;
}

/**
 * Находит активную связь врача и услуги.
 *
 * Учитывает активность врача, услуги и самой связи.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @param {number|string} serviceId - Идентификатор услуги.
 * @returns {Promise<Object|undefined>} Найденная связь или undefined, если она отсутствует или неактивна.
 */
async function getDoctorServiceById(doctorId, serviceId) {
    const doctorService = await db("doctor_services")
        .join("doctors", "doctor_services.doctor_id", "doctors.id")
        .join("services", "doctor_services.service_id", "services.id")
        .where({
            "doctors.is_active": true,
            "services.is_active": true,
            "doctor_services.doctor_id": doctorId,
            "doctor_services.service_id": serviceId,
            "doctor_services.is_active": true,
        })
        .select(
            "doctor_services.id",
            "doctor_services.doctor_id",
            "doctor_services.service_id",
            "services.name",
            "services.price",
            "doctor_services.duration_minutes",
        )
        .first();

    return doctorService;
}

/**
 * Обновляет параметры активной связи врача и услуги.
 *
 * Перед обновлением проверяет существование и активность врача и услуги.
 * Обновляет продолжительность услуги.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @param {number|string} serviceId - Идентификатор услуги.
 * @param {Object} updateData - Данные для обновления.
 * @returns {Promise<Object|undefined>} Обновлённая связь или undefined, если связь не найдена.
 * @throws {Error} Если врач или услуга не существуют либо неактивны.
 */
async function updateDoctorService(doctorId, serviceId, updateData) {
    // Проверка существования и активности врача
    const doctor = await db("doctors")
        .where({ id: doctorId, is_active: true })
        .first();

    if (!doctor) {
        throw new Error("Doctor not found or inactive");
    }

    const service = await db("services")
        .where({ id: serviceId, is_active: true })
        .first();

    if (!service) {
        throw new Error("Service not found or inactive");
    }

    const [doctorService] = await db("doctor_services")
        .where({
            doctor_id: doctorId,
            service_id: serviceId,
            is_active: true,
        })
        .update({
            duration_minutes: updateData.duration_minutes,
        })
        .returning("*");

    return doctorService;
}

/**
 * Деактивирует связь между врачом и услугой.
 *
 * Физически запись из базы данных не удаляется.
 *
 * @param {number|string} doctorId - Идентификатор врача.
 * @param {number|string} serviceId - Идентификатор услуги.
 * @returns {Promise<Object|undefined>} Деактивированная связь или undefined, если активная связь не найдена.
 */
async function deleteDoctorService(doctorId, serviceId) {
    const [doctorService] = await db("doctor_services")
        .where({
            doctor_id: doctorId,
            service_id: serviceId,
            is_active: true,
        })
        .update({ is_active: false })
        .returning("*");

    return doctorService;
}

module.exports = {
    createDoctorService,
    listDoctorServices,
    getDoctorServiceById,
    updateDoctorService,
    deleteDoctorService,
    reactivateRelation,
    getDoctorServiceRelation,
};
