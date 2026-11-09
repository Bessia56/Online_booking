function validate(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = validate;