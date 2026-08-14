/**
 * validation for job description creation
 */
const validateJobCreation = (req, res, next) => {
  const { title, description } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Job title must be at least 3 characters long.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 15) {
    errors.push('Job description must be at least 15 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors
    });
  }

  next();
};

module.exports = {
  validateJobCreation
};
