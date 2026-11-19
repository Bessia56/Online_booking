const doctorsModel = require("../model/doctors.model");
const doctorSchedulesModel = require("../model/doctorSchedules.model");

/**
 * Создаёт новый рабочий интервал в расписании врача.
 *
 * Проверяет существование и активность врача,
 * а также отсутствие пересечений с другими интервалами.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными расписания.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function createSchedule(req, res) {
    const { doctorId } = req.params;

    // Получаем данные нового рабочего интервала из тела запроса.
    const { day_of_week, start_time, end_time } = req.body;

    const doctor = await doctorsModel.isDoctorActive(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found or inactive",
        });
    }

    // Получаем все активные интервалы врача за выбранный день недели.
    const doctorSchedules = await doctorSchedulesModel.getDoctorSchedulesByDay(
        doctorId,
        day_of_week,
    );

    // По умолчанию считаем, что пересечений нет.
    let hasOverlap = false;

    // Проверяем каждый существующий интервал.
    for (const schedule of doctorSchedules) {
        // Получаем время начала и окончания существующего интервала.
        // slice(0, 5) убирает секунды, если PostgreSQL вернул HH:mm:ss.
        const existingStart = schedule.start_time.slice(0, 5);
        const existingEnd = schedule.end_time.slice(0, 5);

        // Проверяем, пересекается ли новый интервал с существующим.
        if (start_time < existingEnd && end_time > existingStart) {
            hasOverlap = true;

            // Дальше проверять остальные интервалы нет необходимости.
            break;
        }
    }

    // Если нашли пересечение, не создаём новый интервал.
    if (hasOverlap) {
        return res.status(409).json({
            error: "Schedule overlaps with an existing interval",
        });
    }

    // Если пересечений нет, сохраняем новый интервал в БД.
    const newSchedule = await doctorSchedulesModel.createSchedule(doctorId, {
        day_of_week,
        start_time,
        end_time,
    });

    return res.status(201).json(newSchedule);
}

/**
 * Получает расписание конкретного врача.
 *
 * Проверяет существование и активность врача.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID врача в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком интервалов расписания.
 */
async function listDoctorSchedules(req, res) {
    // Получаем ID врача из параметров маршрута.
    const { doctorId } = req.params;

    const doctor = await doctorsModel.getDoctorById(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found",
        });
    }

    if (!doctor.is_active) {
        return res.status(409).json({
            error: "Doctor is inactive",
        });
    }

    const doctorSchedules =
        await doctorSchedulesModel.listDoctorSchedules(doctorId);

    return res.status(200).json(doctorSchedules);
}

/**
 * Получает список активных врачей, у которых есть активное расписание.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком врачей.
 */
async function listActiveDoctorsWithSchedule(req, res) {
    const doctors = await doctorSchedulesModel.listActiveDoctorsWithSchedule();

    return res.status(200).json(doctors);
}

/**
 * Получает конкретный интервал расписания врача по ID.
 *
 * Проверяет существование и активность врача,
 * а также наличие указанного интервала.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID врача и интервала в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с найденным интервалом.
 */
async function getScheduleById(req, res) {
    const { doctorId, scheduleId } = req.params;

    const doctor = await doctorsModel.getDoctorById(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found",
        });
    }

    if (!doctor.is_active) {
        return res.status(409).json({
            error: "Doctor is inactive",
        });
    }

    const schedule = await doctorSchedulesModel.getScheduleById(
        doctorId,
        scheduleId,
    );

    if (!schedule) {
        return res.status(404).json({
            error: "Schedule not found",
        });
    }

    return res.status(200).json(schedule);
}

/**
 * Обновляет интервал расписания врача.
 *
 * Проверяет существование и активность врача,
 * наличие интервала и отсутствие пересечений с другими интервалами.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID врача, ID интервала и новыми данными.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с обновлённым интервалом.
 */
async function updateSchedule(req, res) {
    const { doctorId, scheduleId } = req.params;
    const scheduleData = req.body;

    const doctor = await doctorsModel.getDoctorById(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found",
        });
    }

    if (!doctor.is_active) {
        return res.status(409).json({
            error: "Doctor is inactive",
        });
    }

    const schedule = await doctorSchedulesModel.getScheduleById(
        doctorId,
        scheduleId,
    );

    if (!schedule) {
        return res.status(404).json({
            error: "Schedule not found",
        });
    }

    // Формируем итоговые данные:
    // новые значения берём из запроса,
    // отсутствующие поля оставляем без изменений.
    const updatedData = {
        day_of_week: scheduleData.day_of_week ?? schedule.day_of_week,
        start_time: scheduleData.start_time ?? schedule.start_time,
        end_time: scheduleData.end_time ?? schedule.end_time,
    };

    // Получаем активные интервалы врача за итоговый день недели.
    const doctorSchedules = await doctorSchedulesModel.getDoctorSchedulesByDay(
        doctorId,
        updatedData.day_of_week,
    );

    // По умолчанию пересечений нет.
    let hasOverlap = false;

    // Проверяем каждый существующий интервал.
    for (const item of doctorSchedules) {
        // Пропускаем интервал, который сейчас обновляем.
        if (item.id === scheduleId) {
            continue;
        }

        // Получаем время начала и окончания существующего интервала.
        const existingStart = String(item.start_time).slice(0, 5);
        const existingEnd = String(item.end_time).slice(0, 5);

        // Проверяем пересечение с новым интервалом.
        if (
            updatedData.start_time < existingEnd &&
            updatedData.end_time > existingStart
        ) {
            hasOverlap = true;
            break;
        }
    }

    // Если обнаружено пересечение, отменяем обновление.
    if (hasOverlap) {
        return res.status(409).json({
            error: "Schedule overlaps with an existing interval",
        });
    }

    // Если конфликтов нет, обновляем запись в БД.
    const updatedSchedule = await doctorSchedulesModel.updateSchedule(
        doctorId,
        scheduleId,
        updatedData,
    );

    // Возвращаем обновлённый интервал.
    return res.status(200).json(updatedSchedule);
}

/**
 * Деактивирует интервал расписания врача.
 *
 * Проверяет существование и активность врача,
 * а также наличие указанного интервала.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID врача и интервала в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с результатом деактивации.
 */
async function deactivateSchedule(req, res) {
    const { doctorId, scheduleId } = req.params;

    const doctor = await doctorsModel.getDoctorById(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found",
        });
    }

    if (!doctor.is_active) {
        return res.status(409).json({
            error: "Doctor is inactive",
        });
    }

    const schedule = await doctorSchedulesModel.getScheduleById(
        doctorId,
        scheduleId,
    );

    if (!schedule) {
        return res.status(404).json({
            error: "Schedule not found",
        });
    }

    await doctorSchedulesModel.deleteSchedule(doctorId, scheduleId);

    return res.status(200).json({
        message: "Schedule deactivated successfully",
    });
}

/**
 * Получает активные интервалы расписания врача за определённый день недели.
 *
 * Проверяет существование и активность врача.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID врача и номером дня недели.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком интервалов.
 */
async function getDoctorSchedulesByDay(req, res) {
    const { doctorId, dayOfWeek } = req.params;

    const doctor = await doctorsModel.getDoctorById(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found",
        });
    }

    if (!doctor.is_active) {
        return res.status(409).json({
            error: "Doctor is inactive",
        });
    }

    const schedules = await doctorSchedulesModel.getDoctorSchedulesByDay(
        doctorId,
        dayOfWeek,
    );

    return res.status(200).json(schedules);
}

module.exports = {
    createSchedule,
    listDoctorSchedules,
    listActiveDoctorsWithSchedule,
    getScheduleById,
    updateSchedule,
    deactivateSchedule,
    getDoctorSchedulesByDay,
};
