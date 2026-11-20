const yup = require("yup");
const ISO_DATE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const createAppointmentSchema = yup
    .object({
        patient_id: yup
            .string()
            .trim()
            .matches(/^[1-9]\d*$/, "Patient ID must be a positive integer")
            .required("Patient ID is required"),

        doctor_service_id: yup
            .string()
            .trim()
            .matches(
                /^[1-9]\d*$/,
                "Doctor service ID must be a positive integer",
            )
            .required("Doctor service ID is required"),

        starts_at: yup
            .string()
            .trim()
            .required("Start date is required")
            .matches(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
                "Start date must be in ISO 8601 format with timezone",
            )
            .test(
                "valid-date",
                "Start date is invalid",
                (value) => !value || !Number.isNaN(Date.parse(value)),
            ),
    })
    .exact("Unknown fields are not allowed");

    const updateAppointmentSchema = yup
    .object({
        doctor_service_id: yup
            .string()
            .matches(/^[1-9]\d*$/, "Invalid doctor_service_id")
            .optional(),

        starts_at: yup
            .string()
            .required()
            .matches(ISO_DATE_REGEX, "Invalid date format")
            .test(
                "valid-date",
                "Invalid date",
                value => value === undefined || !Number.isNaN(Date.parse(value))
            )
            .optional(),
    })
    .exact("Unknown fields are not allowed")
    .test(
        "at-least-one-field",
        "At least one field must be provided",
        value => Object.keys(value || {}).length > 0
    );

module.exports = {
    createAppointmentSchema,
    updateAppointmentSchema,
};
