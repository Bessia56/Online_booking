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
            service_id: serviceId,
        })
        .first();

    if (existingRelation) {
        throw new Error("This service is already assigned to the doctor");
    }

    const [doctorService] = await db("doctor_services")
        .insert({
            doctor_id: doctorId,
            service_id: serviceId,
            duration_minutes: durationMinutes,
        })
        .returning("*");

    return doctorService;
}

/**
 * Получает список всех активных связей врачей и услуг.
 *
 * @returns {Promise<Object[]>} Массив связей.
 */
async function listDoctorServices() {
    const doctorServices = await db("doctor_services")
        .join("doctors", "doctor_services.doctor_id", "doctors.id")
        .join("services", "doctor_services.service_id", "services.id")
        .where({
            "doctors.is_active": true,
            "services.is_active": true,
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
 * Получает связь врача и услуги по ID врача и ID услуги.
 *
 * @param {number|string} doctorId - ID врача.
 * @param {number|string} serviceId - ID услуги.
 * @returns {Promise<Object|undefined>} Найденная связь или undefined.
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
 * Частично обновляет параметры связи врача и услуги.
 *
 * @param {number|string} doctorId - ID врача.
 * @param {number|string} serviceId - ID услуги.
 * @param {Object} updateData - Данные для обновления.
 * @returns {Promise<Object|undefined>} Обновлённая связь или undefined.
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
        })
        .update({
            duration_minutes: updateData.duration_minutes,
        })
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
    listDoctorServicesByDoctorId,
    updateDoctorService,
    deleteDoctorService,
};
