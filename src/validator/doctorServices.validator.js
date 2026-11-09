const yup = require("yup");

const createDoctorServiceSchema = yup.object({
    service_id: yup
        .number()
        .typeError("service_id должен быть числом")
        .integer()
        .positive()
        .required("service_id обязателен"),

    duration_minutes: yup
        .number()
        .typeError("duration_minutes должен быть числом")
        .integer()
        .positive()
        .required("duration_minutes обязателен")
});

const updateDoctorServiceSchema = yup.object({
    duration_minutes: yup
        .number()
        .typeError("duration_minutes должен быть числом")
        .integer()
        .positive()
        .required("duration_minutes обязателен")
});

module.exports = {
    createDoctorServiceSchema,
    updateDoctorServiceSchema
};