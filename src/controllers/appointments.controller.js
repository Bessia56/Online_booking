const appointmentsModel = require("../model/appointments.model");
const patientsModel = require("../model/patients.model");
const doctorServiceModel = require("../model/doctorServices.model");
const doctorModel = require("../model/doctors.model");

const APPOINTMENT_STATUSES = [
    "pending", // по умолчанию
    "confirmed", //подтвержденный
    "cancelled", //отмененный
    "completed", // завершенный
];

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
 * Ожидает patient_id, doctor_service_id, starts_at и ends_at в теле запроса.
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
 * Разрешено изменять время начала, окончания и услугу врача.
 *
 * @param {import("express").Request} req - HTTP-запрос с ID записи и новыми данными.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response>} Ответ с обновлённой записью.
 */
async function updateAppointment(req, res) {
    const { id } = req.params;

    const appointment = await appointmentsModel.getAppointmentById(id);

    if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
    }

    const { doctor_service_id, starts_at, ends_at } = req.body;

    const appointmentData = {};

    // Формированием белого списка разрешённых полей для обновления
    if (doctor_service_id !== undefined) {
        appointmentData.doctor_service_id = doctor_service_id;
    }

    if (starts_at !== undefined) {
        appointmentData.starts_at = starts_at;
    }

    if (ends_at !== undefined) {
        appointmentData.ends_at = ends_at;
    }

    if (Object.keys(appointmentData).length === 0) {
        return res.status(400).json({
            error: "No valid fields provided for update",
        });
    }

    if (!isValidAppointmentPeriod(updatedStartsAt, updatedEndsAt)) {
        return res.status(400).json({
            error: "Invalid appointment time interval",
        });
    }

    const updatedAppointment = await appointmentsModel.updateAppointment(
        id,
        appointmentData,
    );

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
};
