const db = require("../config/db");

/**
 * Создаёт новую связь врача и услуги.
 *
 * @param {number} doctorId - ID врача.
 * @param {number} serviceId - ID услуги.
 * @param {number} durationMinutes - Продолжительность услуги в минутах.
 * @returns {Promise<Object>} Созданная запись связи.
 */
async function createDoctorService(doctorId, serviceId, durationMinutes) {

    if (!doctorId || !serviceId || durationMinutes == null) {
        throw new Error("Missing required fields");
    }

    if (durationMinutes <= 0) {
        throw new Error("Duration must be greater than 0");
    }

    //Проверка существования врача и услуги
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

    //Проверка существования записи
    const existingRelation = await db("doctor_services")
        .where({
            doctor_id: doctorId,
            service_id: serviceId
        })
        .first();

    if (existingRelation) {
        throw new Error("This service is already assigned to the doctor");
    }

    const [doctorService] = await db("doctor_services")
        .insert({
            doctor_id: doctorId,
            service_id: serviceId,
            duration_minutes: durationMinutes
        })
        .returning("*");

    return doctorService;
}

/**
 * Получает список всех связей врачей и услуг.
 *
 * @returns {Promise<Object[]>} Массив связей.
 */
async function listDoctorServices() {
    const doctorServices = await db("doctor_services").select("*");
    return doctorServices;
}

/**
 * Получает связь врача и услуги по ID.
 *
 * @param {number|string} id - Идентификатор связи.
 * @returns {Promise<Object|undefined>} Найденная связь или undefined.
 */
async function getDoctorServiceById(id) {
    const [doctorService] = await db("doctor_services")
        .select("*")
        .where({ id });
    return doctorService;
}

/**
 * Частично обновляет данные связи врача и услуги.
 *
 * @param {number|string} id - Идентификатор связи.
 * @param {Object} updateData - Поля, которые необходимо обновить.
 * @returns {Promise<Object|undefined>} Обновлённая связь или undefined.
 */
async function updateDoctorService(id, updateData) {
    const [doctorService] = await db("doctor_services")
        .where({ id })
        .update(updateData)
        .returning("*");
    return doctorService;
}

/**
 * Удаляет связь врача и услуги по ID.
 *
 * @param {number|string} id - Идентификатор связи.
 * @returns {Promise<Object|undefined>} Деактивированная связь или undefined.
 */
async function deleteDoctorService(id) {
    const [doctorService] = await db("doctor_services")
        .where({ id })
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
};
