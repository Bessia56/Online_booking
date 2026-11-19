const yup = require("yup");

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

module.exports = {
    createAppointmentSchema,
};
