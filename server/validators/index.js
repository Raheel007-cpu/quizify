const authValidator = require('./authValidator');
const subjectValidator = require('./subjectValidator');
const questionValidator = require('./questionValidator');
const quizValidator = require('./quizValidator');
const attemptValidator = require('./attemptValidator');

module.exports = {
  ...authValidator,
  ...subjectValidator,
  ...questionValidator,
  ...quizValidator,
  ...attemptValidator,
};
