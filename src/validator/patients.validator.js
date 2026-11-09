const yup = require("yup");

const createPatientSchema = yup.object({
    first_name: yup
        .string()
        .trim()
        .required("Имя обязательно")
        .max(100),

    last_name: yup
        .string()
        .trim()
        .required("Фамилия обязательна")
        .max(100),

    phone: yup
        .string()
        .trim()
        .required("Телефон обязателен")
        .max(20),

    email: yup
        .string()
        .trim()
        .email("Некорректный email")
        .max(255)
        .nullable()
        .optional()
});

const updatePatientSchema = createPatientSchema
    .shape({
        first_name: yup.string().trim().max(100),
        last_name: yup.string().trim().max(100),
        phone: yup.string().trim().max(20),
    })
    .partial()
    .test(
        "at-least-one-field",
        "Необходимо передать хотя бы одно поле для изменения",
        value => value && Object.keys(value).length > 0
    );

module.exports = {
    createPatientSchema,
    updatePatientSchema
};