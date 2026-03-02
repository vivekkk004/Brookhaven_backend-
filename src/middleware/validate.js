import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Run after express-validator chains. Returns 422 with all errors if any.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, 'Validation failed', 422, errors.array());
    }
    next();
};

export default validate;
