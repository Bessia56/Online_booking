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
    return await db("doctor_scheduls").where({
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
        .update({ is_active: false });

    return scheduls;
}

module.exports = {
    createSchedule,
    listDoctorSchedules,
    getScheduleById,
    getDoctorSchedulesByDay,
    updateSchedule,
    deleteSchedule,
};
