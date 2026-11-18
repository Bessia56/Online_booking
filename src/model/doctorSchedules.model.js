const db = require("../config/db");

/**
 * Добавляет рабочий интервал в расписание врача.
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
 * Возвращает расписание врача
 */
async function listDoctorSchedules(doctorId) {
    return await db("doctor_schedules")
        .where({ doctor_id: doctorId })
        .orderBy("day_of_week")
        .orderBy("start_time");
}

/**
 * Получает конкретный интервал врача по ID.
 */
async function getScheduleById(doctorId, scheduleId) {
    return await db("doctor_schedules")
        .where({ id: scheduleId, doctor_id: doctorId })
        .first();
}

/**
 * Возвращает интервалы врача за определенный день
 */
async function getDoctorSchedulesByDay(doctorId, dayOfWeek) {
    return await db("doctor_schedules").where({
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: true,
    });
}

/**
 * Обновляет интервал врача.
 */
async function updateSchedule(doctorId, scheduleId, scheduleData) {
    const [schedule] = await db("doctor_schedules")
        .where({ doctor_id: doctorId, id: scheduleId })
        .update(scheduleData)
        .returning("*");

    return schedule;
}

/**
 * Деактивирует интервал врача.
 */
async function deleteSchedule(doctorId, scheduleId) {
    const [scheduls] = await db("doctor_schedules")
        .where({ doctor_id: doctorId, id: scheduleId })
        .update({ is_active: false })
        .returning("*");


    return scheduls;
}

/**
 * Возвращает активных врачей, у которых есть активное расписание.
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
