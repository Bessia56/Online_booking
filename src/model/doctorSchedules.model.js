const db = require("../config/db");

/**
 * Создаёт новый рабочий интервал в расписании врача.
 *
 * @param {string|number} doctorId - ID врача.
 * @param {Object} scheduleData - Данные рабочего интервала.
 * @returns {Promise<Object>} Созданный интервал расписания.
 */
async function createSchedule(doctorId, scheduleData) {
    const [schedule] = await db("doctor_schedules")
        .insert({
            doctor_id: doctorId,
            ...scheduleData,
        })
        .returning("*");

    return schedule;
}

/**
 * Получает все интервалы расписания конкретного врача.
 *
 * Сортирует интервалы по дню недели и времени начала.
 *
 * @param {string|number} doctorId - ID врача.
 * @returns {Promise<Array<Object>>} Массив интервалов расписания.
 */
async function listDoctorSchedules(doctorId) {
    return await db("doctor_schedules")
        .where({ doctor_id: doctorId })
        .orderBy("day_of_week")
        .orderBy("start_time");
}

/**
 * Получает интервал расписания врача по ID.
 *
 * @param {string|number} doctorId - ID врача.
 * @param {string|number} scheduleId - ID интервала расписания.
 * @returns {Promise<Object|undefined>} Найденный интервал или undefined.
 */
async function getScheduleById(doctorId, scheduleId) {
    return await db("doctor_schedules")
        .where({ id: scheduleId, doctor_id: doctorId })
        .first();
}

/**
 * Получает активные интервалы расписания врача за определённый день недели.
 *
 * @param {string|number} doctorId - ID врача.
 * @param {number|string} dayOfWeek - Номер дня недели (от 1 до 7).
 * @returns {Promise<Array<Object>>} Массив активных интервалов.
 */
async function getDoctorSchedulesByDay(doctorId, dayOfWeek) {
    return await db("doctor_schedules").where({
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: true,
    });
}

/**
 * Обновляет данные интервала расписания врача.
 *
 * @param {string|number} doctorId - ID врача.
 * @param {string|number} scheduleId - ID интервала расписания.
 * @param {Object} scheduleData - Данные для обновления.
 * @returns {Promise<Object|undefined>} Обновлённый интервал или undefined.
 */
async function updateSchedule(doctorId, scheduleId, scheduleData) {
    const [schedule] = await db("doctor_schedules")
        .where({ doctor_id: doctorId, id: scheduleId })
        .update(scheduleData)
        .returning("*");

    return schedule;
}

/**
 * Деактивирует интервал расписания врача без физического удаления из БД.
 *
 * @param {string|number} doctorId - ID врача.
 * @param {string|number} scheduleId - ID интервала расписания.
 * @returns {Promise<Object|undefined>} Деактивированный интервал или undefined.
 */
async function deleteSchedule(doctorId, scheduleId) {
    const [scheduls] = await db("doctor_schedules")
        .where({ doctor_id: doctorId, id: scheduleId })
        .update({ is_active: false })
        .returning("*");


    return scheduls;
}

/**
 * Получает список активных врачей, у которых есть активное расписание.
 *
 * Исключает дублирование врачей, у которых несколько активных интервалов.
 *
 * @returns {Promise<Array<Object>>} Массив активных врачей.
 */
async function listActiveDoctorsWithSchedule() {
    return await db("doctors")
        .join("doctor_schedules", "doctors.id", "doctor_schedules.doctor_id")
        .where("doctors.is_active", true)
        .andWhere("doctor_schedules.is_active", true)
        .distinct("doctors.*");
}

module.exports = {
    createSchedule,
    listDoctorSchedules,
    getScheduleById,
    getDoctorSchedulesByDay,
    updateSchedule,
    deleteSchedule,
    listActiveDoctorsWithSchedule,
};
