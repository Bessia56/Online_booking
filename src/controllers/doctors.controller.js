const doctorsModel = require("../model/doctors.model");
const doctorServicesModel = require("../model/doctorServices.model");
const servicesModel = require("../model/services.model");

/**
 * Создаёт нового врача.
 *
 * Проверяет уникальность email и номера телефона
 * перед сохранением нового врача.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными врача.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function createDoctor(req, res) {
    const { email, phone } = req.body;

    const existingEmail = await doctorsModel.getDoctorByEmail(email);
    const existingPhone = await doctorsModel.getDoctorByPhone(phone);

    if (existingEmail || existingPhone) {
        return res
            .status(409)
            .json({ error: "Doctor with this email or phone already exists" });
    }

    const newDoctor = await doctorsModel.createDoctor(req.body);

    res.status(201).json(newDoctor);
}

/**
 * Возвращает список всех врачей.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function listDoctors(req, res) {
    const doctors = await doctorsModel.listDoctors();
    res.status(200).json(doctors);
}

/**
 * Возвращает врача по его ID.
 *
 * ID врача извлекается из параметров маршрута.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function getDoctorById(req, res) {
    const doctor = await doctorsModel.getDoctorById(req.params.id);
    if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json(doctor);
}

/**
 * Частично обновляет данные врача.
 *
 * ID врача извлекается из параметров маршрута,
 * новые данные — из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными для обновления.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function updateDoctor(req, res) {
    const doctor = await doctorsModel.updateDoctor(req.params.id, req.body);

    if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json(doctor);
}

/**
 * Деактивирует врача по его ID.
 *
 * Выполняет мягкое удаление через изменение is_active.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function deleteDoctor(req, res) {
    const doctor = await doctorsModel.deleteDoctor(req.params.id);

    if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json({
        message: "Doctor deactivated successfully",
    });
}

/**
 * Добавляет услугу врачу.
 *
 * Проверяет существование и активность врача и услуги.
 * Проверяет наличие существующей связи.
 * Восстанавливает неактивную связь или создаёт новую.
 *
 * ID врача извлекается из параметров маршрута,
 * ID услуги и продолжительность — из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос с данными связи.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function addServiceToDoctor(req, res) {
    const { doctorId } = req.params;
    const { serviceId, durationMinutes } = req.body;

    //Проверяем, существует ли активный врач
    const doctor = await doctorsModel.isDoctorActive(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found or inactive",
        });
    }

    //Проверяем, существует ли активная услуга
    const service = await servicesModel.isServiceActive(serviceId);

    if (!service) {
        return res.status(404).json({
            error: "Service not found or inactive",
        });
    }

    //Ищем существующую связь врача с услугой
    const existingRelation = await doctorServicesModel.getDoctorServiceRelation(
        doctorId,
        serviceId,
    );

    if (existingRelation) {
        // Связь уже активна — повторно создавать нельзя
        if (existingRelation.is_active) {
            return res.status(409).json({
                error: "This service is already assigned to the doctor",
            });
        }

        // Связь есть, но она неактивна — восстанавливаем
        const restoredRelation = await doctorServicesModel.reactivateRelation(
            doctorId,
            serviceId,
            durationMinutes,
        );

        return res.status(200).json(restoredRelation);
    }

    //Если связи нет — создаём новую
    const doctorService = await doctorServicesModel.createDoctorService(
        doctorId,
        serviceId,
        durationMinutes,
    );

    return res.status(201).json(doctorService);
}

/**
 * Деактивирует связь между врачом и услугой.
 *
 * ID врача и ID услуги извлекаются из параметров маршрута.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function removeServiceFromDoctor(req, res) {
    const { doctorId, serviceId } = req.params;

    const doctorService = await doctorServicesModel.deleteDoctorService(
        doctorId,
        serviceId,
    );
    if (!doctorService) {
        return res.status(404).json({ error: "Doctor service not found" });
    }
    res.status(200).json({
        message: "Doctor service deactivated successfully",
    });
}

/**
 * Возвращает список активных услуг конкретного врача.
 *
 * ID врача извлекается из параметров маршрута.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function listDoctorServices(req, res) {
    const { doctorId } = req.params;

    const doctorServices =
        await doctorServicesModel.listDoctorServices(doctorId);

    res.status(200).json(doctorServices);
}

/**
 * Возвращает услугу, назначенную врачу,
 * по ID врача и ID услуги.
 *
 * Идентификаторы извлекаются из параметров маршрута.
 *
 * @param {import("express").Request} req - HTTP-запрос.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function getDoctorServiceById(req, res) {
    const { doctorId, serviceId } = req.params;

    const doctorService = await doctorServicesModel.getDoctorServiceById(
        doctorId,
        serviceId,
    );

    if (!doctorService) {
        return res.status(404).json({ error: "Doctor service not found" });
    }
    return res.status(200).json(doctorService);
}

/**
 * Изменяет продолжительность услуги, назначенной врачу.
 *
 * ID врача и ID услуги извлекаются из параметров маршрута,
 * новая продолжительность — из тела HTTP-запроса.
 *
 * @param {import("express").Request} req - HTTP-запрос с новой продолжительностью.
 * @param {import("express").Response} res - HTTP-ответ.
 * @returns {Promise<import("express").Response | void>}
 */
async function updateDoctorService(req, res) {
    const { doctorId, serviceId } = req.params;
    const { durationMinutes } = req.body;

    //Проверяем, существует ли активный врач
    const doctor = await doctorsModel.isDoctorActive(doctorId);

    if (!doctor) {
        return res.status(404).json({
            error: "Doctor not found or inactive",
        });
    }

    //Проверяем, существует ли активная услуга
    const service = await servicesModel.isServiceActive(serviceId);

    if (!service) {
        return res.status(404).json({
            error: "Service not found or inactive",
        });
    }

    //Ищем существующую связь врача с услугой
    const existingRelation = await doctorServicesModel.getDoctorServiceRelation(
        doctorId,
        serviceId,
    );
    if (!existingRelation || !existingRelation.is_active) {
        // Связь не найдена — возвращаем 404
        return res.status(404).json({
            error: "Active doctor service relation not found",
        });
    }

    const doctorService = await doctorServicesModel.updateDoctorService(
        doctorId,
        serviceId,
        { duration_minutes: durationMinutes },
    );

    if (!doctorService) {
        return res.status(404).json({ error: "Doctor service not found" });
    }
    res.status(200).json(doctorService);
}

module.exports = {
    createDoctor,
    listDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    addServiceToDoctor,
    removeServiceFromDoctor,
    listDoctorServices,
    getDoctorServiceById,
    updateDoctorService,
};
