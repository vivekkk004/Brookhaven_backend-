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
    const payload = { success: false, message };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
};
