const express = require("express");
const router = express.Router({ mergeParams: true });

const validate = require("../validator/validate");

const doctorSchedulesController = require("../controllers/doctorSchedules.controller");

const {
    createScheduleSchema,
    updateScheduleSchema,
} = require("../validator/doctorSchedules.validator");

/**
 * Маршруты для управления расписанием врача.
 *
 * POST    /                  — создание рабочего интервала
 * GET     /                  — получение всего расписания
 * GET     /day/:dayOfWeek    — получение расписания за день
 * GET     /:scheduleId       — получение конкретного интервала
 * PATCH   /:scheduleId       — обновление интервала
 * DELETE  /:scheduleId       — деактивация интервала
 */

router.post(
    "/",
    validate(createScheduleSchema),
    doctorSchedulesController.createSchedule,
);

router.get("/", doctorSchedulesController.listDoctorSchedules);



router.get(
    "/day/:dayOfWeek",
    doctorSchedulesController.getDoctorSchedulesByDay,
);

router.get("/:scheduleId", doctorSchedulesController.getScheduleById);

router.patch(
    "/:scheduleId",
    validate(updateScheduleSchema),
    doctorSchedulesController.updateSchedule,
);

router.delete("/:scheduleId", doctorSchedulesController.deactivateSchedule);


module.exports = router;
