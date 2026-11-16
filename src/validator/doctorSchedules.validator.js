const yup = require("yup");

// Формат времени: HH:mm (например, 09:00 или 18:30)
const timeSchema = yup
    .string()
    .matches(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Time must be in HH:mm format"
    );

// Проверка, что конец интервала позже его начала
function validateTimeRange() {
    return yup.object().test(
        "valid-time-range",
        "End time must be later than start time",
        function (value) {
            const { start_time, end_time } = value || {};

            // Если одно из полей не передано,
            // проверка полного интервала выполняется в контроллере
            if (!start_time || !end_time) {
                return true;
            }

            if (end_time <= start_time) {
                return this.createError({
                    path: "end_time",
                    message: "End time must be later than start time"
                });
            }

            return true;
        }
    );
}

// Создание рабочего интервала
const createScheduleSchema = yup.object({
    day_of_week: yup
        .number()
        .integer("Day of week must be an integer")
        .min(1, "Day of week must be between 1 and 7")
        .max(7, "Day of week must be between 1 and 7")
        .required("Day of week is required"),

    start_time: timeSchema.required("Start time is required"),

    end_time: timeSchema.required("End time is required")
}).concat(validateTimeRange());

// Обновление рабочего интервала
const updateScheduleSchema = yup.object({
    day_of_week: yup
        .number()
        .integer("Day of week must be an integer")
        .min(1, "Day of week must be between 1 and 7")
        .max(7, "Day of week must be between 1 and 7"),

    start_time: timeSchema,

    end_time: timeSchema
})
    .test(
        "at-least-one-field",
        "At least one field must be provided",
        value => value && Object.keys(value).length > 0
    )
    .concat(validateTimeRange());

module.exports = {
    createScheduleSchema,
    updateScheduleSchema
};