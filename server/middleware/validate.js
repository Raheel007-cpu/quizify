const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || 'body';
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    const firstMessage =
      result.error.issues[0]?.message || 'Validation failed';
    return next(new ApiError(400, firstMessage, fieldErrors));
  }

  req.body = result.data;
  return next();
};

module.exports = validate;
