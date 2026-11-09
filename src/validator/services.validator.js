const yup = require("yup");

const createServiceSchema = yup.object({
    name: yup
        .string()
        .trim()
        .required("Название услуги обязательно")
        .max(255),

    description: yup
        .string()
        .trim()
        .nullable()
        .optional(),

    price: yup
        .number()
        .typeError("Цена должна быть числом")
        .min(0, "Цена не может быть отрицательной")
        .required("Цена обязательна")
});

const updateServiceSchema = yup.object({
    name: yup.string().trim().max(255),
    description: yup.string().trim().nullable(),
    price: yup
        .number()
        .typeError("Цена должна быть числом")
        .min(0, "Цена не может быть отрицательной")
}).test(
    "at-least-one-field",
    "Необходимо передать хотя бы одно поле для изменения",
    value => value && Object.keys(value).length > 0
);

module.exports = {
    createServiceSchema,
    updateServiceSchema
};