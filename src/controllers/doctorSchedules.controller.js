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
    // Получаем ID врача из параметров маршрута.
    const { doctorId } = req.params;

    // Получаем данные нового рабочего интервала из тела запроса.
    const { day_of_week, start_time, end_time } = req.body;

    // Проверяем, существует ли врач и активен ли он.
    const doctor = await doctorsModel.isDoctorActive(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found or inactive"
        });
    }

    // Получаем все активные интервалы врача за выбранный день недели.
    const doctorSchedules =
        await doctorSchedulesModel.getDoctorSchedulesByDay(
            doctorId,
            day_of_week
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
            error: "Schedule overlaps with an existing interval"
        });
    }

    // Если пересечений нет, сохраняем новый интервал в БД.
    const newSchedule = await doctorSchedulesModel.createSchedule(
        doctorId,
        {
            day_of_week,
            start_time,
            end_time
        }
    );

    return res.status(201).json(newSchedule);
};




module.exports = {
    createSchedule
};