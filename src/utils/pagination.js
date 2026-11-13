/**
 * Build mongoose query options and a pagination meta object.
 * @param {object} query  - req.query
 * @param {number} defaultLimit
 * @returns {{ skip, limit, page, buildMeta(total) }}
 */
export const getPagination = (query, defaultLimit = 12) => {
    const requestedPage = Number.parseInt(query.page, 10);
    const requestedLimit = Number.parseInt(query.limit, 10);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : defaultLimit;
    const skip = (page - 1) * limit;

    const buildMeta = (total) => ({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });

    return { skip, limit, page, buildMeta };
};
