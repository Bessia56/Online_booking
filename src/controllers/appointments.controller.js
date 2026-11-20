const appointmentsModel = require("../model/appointments.model");
const patientsModel = require("../model/patients.model");
const doctorServicesModel = require("../model/doctorServices.model");
const doctorSchedulesModel = require("../model/doctorSchedules.model");

// Часовой пояс проекта
const TIME_ZONE = "Europe/Moscow";

const APPOINTMENT_STATUSES = [
    "pending", // по умолчанию
    "confirmed", //подтвержденный
    "cancelled", //отмененный
    "completed", // завершенный
];

/**
 * Получает компоненты даты и времени в московском часовом поясе.
 *
 * @param {string|Date} date - Дата.
 * @returns {Object} Компоненты даты и времени.
 */
function getMoscowDateParts(date) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: TIME_ZONE,
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });

    const parts = formatter.formatToParts(new Date(date));

    return Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );
}

/**
 * Проверяет, помещается ли запись в рабочее расписание врача.
 *
 * @param {string} startsAt - Начало записи.
 * @param {string} endsAt - Окончание записи.
 * @param {Array<Object>} schedules - Рабочие интервалы врача.
 * @returns {boolean} Результат проверки.
 */
function isAppointmentWithinSchedule(startsAt, endsAt, schedules) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
    ) {
        return false;
    }

    const startParts = getMoscowDateParts(start);
    const endParts = getMoscowDateParts(end);

    // Запись не должна переходить на следующий день
    if (
        startParts.year !== endParts.year ||
        startParts.month !== endParts.month ||
        startParts.day !== endParts.day
    ) {
        return false;
    }

    // Нумерация дней недели PostgreSQL: понедельник = 1
    const weekdays = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
    };

    const dayOfWeek = weekdays[startParts.weekday];

    // Переводим время в секунды от начала суток
    const startSeconds =
        Number(startParts.hour) * 3600 +
        Number(startParts.minute) * 60 +
        Number(startParts.second);

    const endSeconds =
        Number(endParts.hour) * 3600 +
        Number(endParts.minute) * 60 +
        Number(endParts.second);

    // Проверяем, подходит ли хотя бы один рабочий интервал
    return schedules.some((schedule) => {
        if (Number(schedule.day_of_week) !== dayOfWeek) {
            return false;
        }

        const [startHour, startMinute, startSecond = 0] = String(
            schedule.start_time,
        )
            .split(":")
            .map(Number);

        const [endHour, endMinute, endSecond = 0] = String(schedule.end_time)
            .split(":")
            .map(Number);

        const scheduleStart = startHour * 3600 + startMinute * 60 + startSecond;

        const scheduleEnd = endHour * 3600 + endMinute * 60 + endSecond;

        return startSeconds >= scheduleStart && endSeconds <= scheduleEnd;
    });
}

/**
 * Получает список всех записей на приём.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком записей.
 */
async function listAppointments(req, res) {
    const appointments = await appointmentsModel.listAppointments();
    return res.status(200).json(appointments);
}

/**
 * Получает список записей конкретного пациента.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID пациента в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ со списком записей пациента.
 */
async function listPatientAppointments(req, res) {
    const { patientId } = req.params;

    const patient = await patientsModel.getPatientById(patientId);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }

    const appointments =
        await appointmentsModel.listPatientAppointments(patientId);

    return res.status(200).json(appointments);
}

/**
 * Получает конкретную запись пациента по ID.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID пациента и ID записи в параметрах маршрута.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с найденной записью.
 */
async function getPatientAppointmentById(req, res) {
    const { patientId, appointmentId } = req.params;

    const patient = await patientsModel.getPatientById(patientId);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }

    const appointments = await appointmentsModel.getPatientAppointmentById(
        patientId,
        appointmentId,
    );
    if (!appointments) {
        return res.status(404).json({ error: "Appointment not found" });
    }

    return res.status(200).json(appointments);
}

/**
 * Проверяет корректность временного интервала записи.
 *
 * @param {string} startsAt - Начало записи.
 * @param {string} endsAt - Окончание записи.
 * @returns {boolean} Результат проверки.
 */
function isValidAppointmentPeriod(startsAt, endsAt) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    return (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end > start
    );
}

/**
 * Создаёт новую запись на приём.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными записи.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с созданной записью.
 */
async function createAppointment(req, res) {
    const { patient_id, doctor_service_id, starts_at } = req.body;

    // Проверяем существование пациента
    const patient = await patientsModel.getPatientById(patient_id);

    if (!patient) {
        return res.status(404).json({
            message: "Patient not found",
        });
    }

    // Получаем связь врача с услугой
    const doctorService =
        await doctorServicesModel.getActiveDoctorServiceDetails(
            doctor_service_id,
        );

    if (!doctorService) {
        return res.status(404).json({
            message: "Doctor service not found",
        });
    }

    // Проверяем активность связи, врача и услуги
    if (
        !doctorService.doctor_service_is_active ||
        !doctorService.doctor_is_active ||
        !doctorService.service_is_active
    ) {
        return res.status(400).json({
            message: "Doctor service is not available",
        });
    }

    // Рассчитываем окончание приёма
    const ends_at = new Date(
        new Date(starts_at).getTime() +
            doctorService.duration_minutes * 60 * 1000,
    ).toISOString();

    // Определяем день недели по московскому времени
    const startParts = getMoscowDateParts(starts_at);

    const weekdays = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
    };

    const dayOfWeek = weekdays[startParts.weekday];

    // Получаем активное расписание врача на этот день
    const schedules = await doctorSchedulesModel.getDoctorSchedulesByDay(
        doctorService.doctor_id,
        dayOfWeek,
    );

    // Проверяем, помещается ли приём в рабочее время
    const isWithinSchedule = isAppointmentWithinSchedule(
        starts_at,
        ends_at,
        schedules,
    );

    if (!isWithinSchedule) {
        return res.status(400).json({
            message: "Appointment is outside doctor's working hours",
        });
    }

    // Проверяем, нет ли другой записи у этого врача
    const hasConflict = await appointmentsModel.hasAppointmentConflict(
        doctorService.doctor_id,
        starts_at,
        ends_at,
    );

    if (hasConflict) {
        return res.status(409).json({
            message: "Doctor already has an appointment at this time",
        });
    }

    // Создаём запись
    const appointment = await appointmentsModel.createAppointment({
        patient_id,
        doctor_service_id,
        starts_at,
        ends_at,
    });

    return res.status(201).json(appointment);
}

/**
 * Обновляет данные существующей записи.
 *
 * Пересчитывает окончание приёма и проверяет расписание врача.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<import("express").Response>}
 */
async function updateAppointment(req, res) {
    const { id } = req.params;
    const { doctor_service_id, starts_at } = req.body;

    // Получаем существующую запись
    const appointment = await appointmentsModel.getAppointmentById(id);

    if (!appointment) {
        return res.status(404).json({
            error: "Appointment not found",
        });
    }

    // Определяем услугу: новую или уже существующую
    const updatedDoctorServiceId =
        doctor_service_id ?? appointment.doctor_service_id;

    // Получаем информацию об услуге и враче
    const doctorService =
        await doctorServicesModel.getActiveDoctorServiceDetails(
            updatedDoctorServiceId,
        );

    if (!doctorService) {
        return res.status(404).json({
            error: "Doctor service not found",
        });
    }

    if (
        !doctorService.doctor_service_is_active ||
        !doctorService.doctor_is_active ||
        !doctorService.service_is_active
    ) {
        return res.status(400).json({
            error: "Doctor service is not available",
        });
    }

    // Определяем новое начало записи
    const updatedStartsAt = starts_at ?? appointment.starts_at;

    // Рассчитываем новое окончание по продолжительности услуги
    const updatedEndsAt = new Date(
        new Date(updatedStartsAt).getTime() +
            doctorService.duration_minutes * 60 * 1000,
    ).toISOString();

    // Проверяем корректность временного интервала
    if (!isValidAppointmentPeriod(updatedStartsAt, updatedEndsAt)) {
        return res.status(400).json({
            error: "Invalid appointment time interval",
        });
    }

    // Получаем день недели по московскому времени
    const startParts = getMoscowDateParts(updatedStartsAt);

    const weekdays = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
    };

    const dayOfWeek = weekdays[startParts.weekday];

    // Получаем расписание врача
    const schedules = await doctorSchedulesModel.getDoctorSchedulesByDay(
        doctorService.doctor_id,
        dayOfWeek,
    );

    // Проверяем соответствие расписанию
    if (
        !isAppointmentWithinSchedule(updatedStartsAt, updatedEndsAt, schedules)
    ) {
        return res.status(400).json({
            error: "Appointment is outside doctor's working hours",
        });
    }

    // Проверяем пересечение с другими записями врача
    // Текущую запись исключаем из проверки
    const hasConflict = await appointmentsModel.hasAppointmentConflict(
        doctorService.doctor_id,
        updatedStartsAt,
        updatedEndsAt,
        id,
    );

    if (hasConflict) {
        return res.status(409).json({
            error: "Doctor already has an appointment at this time",
        });
    }

    // Сохраняем изменения
    const updatedAppointment = await appointmentsModel.updateAppointment(id, {
        doctor_service_id: updatedDoctorServiceId,
        starts_at: updatedStartsAt,
        ends_at: updatedEndsAt,
    });

    return res.status(200).json(updatedAppointment);
}

/**
 * Изменяет статус записи.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID записи и новым статусом.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с обновлённой записью.
 */
async function updateAppointmentStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!APPOINTMENT_STATUSES.includes(status)) {
        return res.status(400).json({
            error: "Invalid appointment status",
        });
    }

    const appointment = await appointmentsModel.getAppointmentById(id);

    if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
    }

    const updatedAppointment = await appointmentsModel.updateAppointmentStatus(
        id,
        status,
    );

    return res.status(200).json(updatedAppointment);
}

/**
 * Отменяет запись, изменяя её статус на cancelled.
 *
 * Физически запись из базы данных не удаляется.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID записи.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с результатом отмены.
 */
async function cancelAppointment(req, res) {
    const { id } = req.params;

    const appointment = await appointmentsModel.getAppointmentById(id);

    if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.status === "cancelled") {
        return res.status(409).json({
            error: "Appointment is already cancelled",
        });
    }

    const cancelledAppointment =
        await appointmentsModel.updateAppointmentStatus(id, "cancelled");

    return res.status(200).json({
        message: "Appointment cancelled successfully",
        appointment: cancelledAppointment,
    });
}

module.exports = {
    listAppointments,
    listPatientAppointments,
    getPatientAppointmentById,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    isValidAppointmentPeriod,
};
