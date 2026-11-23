const ApiError = require('./ApiError');

const parseId = (rawId, label = 'ID') => {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return parsed;
};

module.exports = parseId;
