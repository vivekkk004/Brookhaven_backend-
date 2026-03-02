import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BookHaven API',
            version: '1.0.0',
            description: 'REST API for the BookHaven used-book marketplace — Auth, Books, Orders, Wishlist, Reviews, Chat',
        },
        servers: [
            { url: 'http://localhost:8000/api/v1', description: 'Development' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication & registration' },
            { name: 'Books', description: 'Book listings' },
            { name: 'Orders', description: 'Order management' },
            { name: 'Wishlist', description: 'Customer wishlist' },
            { name: 'Reviews', description: 'Book reviews' },
            { name: 'Chat', description: 'Messaging between users' },
            { name: 'Customer', description: 'Customer dashboard & profile' },
            { name: 'Seller', description: 'Seller dashboard, earnings & profile' },
        ],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'BookHaven API Docs',
        swaggerOptions: { persistAuthorization: true },
    }));
    console.log('📖  Swagger UI available at http://localhost:8000/api-docs');
};

export default swaggerSpec;
