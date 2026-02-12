"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookieParser = require("cookie-parser");
const yaml = require("js-yaml");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:4200'];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin) || process.env.CORS_ORIGINS === '*') {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Authorization'],
        maxAge: 86400,
    });
    const port = process.env.PORT || 3000;
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Nest Pizza API')
        .setDescription(`API pentru gestionarea comenzilor de pizza

## Schema OpenAPI

- **OpenAPI JSON**: [http://localhost:${port}/api-json](http://localhost:${port}/api-json)
- **OpenAPI YAML**: [http://localhost:${port}/api-yaml](http://localhost:${port}/api-yaml)`)
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduceți token-ul JWT',
        in: 'header',
    }, 'JWT-auth')
        .addServer(`http://localhost:${port}`, 'Development Server')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    app.getHttpAdapter().get('/api-json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(document);
    });
    app.getHttpAdapter().get('/api-yaml', (req, res) => {
        res.setHeader('Content-Type', 'text/yaml');
        res.send(yaml.dump(document));
    });
    await app.listen(port);
    console.log(`Aplicația rulează pe: http://localhost:${port}`);
    console.log(`Documentația Swagger este disponibilă la: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map