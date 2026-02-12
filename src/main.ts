import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as yaml from 'js-yaml';
import { AppModule } from './app.module';

/**
 * Punctul de intrare al aplicației NestJS
 * Configurează aplicația, validarea și documentația Swagger
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurare cookie parser pentru refresh token
  app.use(cookieParser());

  // Configurare ValidationPipe global pentru validarea DTO-urilor
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurare CORS cu suport pentru cookies
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  // Configurare Swagger
  const config = new DocumentBuilder()
    .setTitle('Nest Pizza API')
    .setDescription(
      `API pentru gestionarea comenzilor de pizza

## Schema OpenAPI

- **OpenAPI JSON**: [http://localhost:${port}/api-json](http://localhost:${port}/api-json)
- **OpenAPI YAML**: [http://localhost:${port}/api-yaml](http://localhost:${port}/api-yaml)`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduceți token-ul JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(`http://localhost:${port}`, 'Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Setup Swagger UI cu design default
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Endpoint pentru schema JSON (pentru generarea tipurilor)
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // Endpoint pentru schema YAML
  app.getHttpAdapter().get('/api-yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(document));
  });

  await app.listen(port);

  console.log(`Aplicația rulează pe: http://localhost:${port}`);
  console.log(`Documentația Swagger este disponibilă la: http://localhost:${port}/api`);
}

bootstrap();
