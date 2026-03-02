/**
 * Build mongoose query options and a pagination meta object.
 * @param {object} query  - req.query
 * @param {number} defaultLimit
 * @returns {{ skip, limit, page, buildMeta(total) }}
 */
export const getPagination = (query, defaultLimit = 12) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || defaultLimit);
    const skip = (page - 1) * limit;

    const buildMeta = (total) => ({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });

    return { skip, limit, page, buildMeta };
};
