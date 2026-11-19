function validate(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: false,
            });

            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = validate;
