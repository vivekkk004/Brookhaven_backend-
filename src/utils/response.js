/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 * @param {object|null} pagination
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200, pagination = null) => {
    const payload = { success: true, message, data };
    if (pagination) payload.pagination = pagination;
    return res.status(statusCode).json(payload);
};

/**
 * Send an error response.
 */
export const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
    if (statusCode === 500 && typeof message === 'string') {
        if (message.startsWith('Cast to ObjectId failed')) statusCode = 400;
        else if (/validation failed/i.test(message)) statusCode = 422;
        else if (/e11000 duplicate key/i.test(message)) statusCode = 409;
    }
    const payload = { success: false, message };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
};

export const sendControllerError = (res, err) => {
    if (err?.name === 'CastError') return sendError(res, 'Invalid resource identifier', 400);
    if (err?.name === 'ValidationError') return sendError(res, 'Request validation failed', 422);
    if (err?.code === 11000) return sendError(res, 'A record with this value already exists', 409);

    console.error('API controller error:', err);
    return sendError(res, 'Internal server error', 500);
};
