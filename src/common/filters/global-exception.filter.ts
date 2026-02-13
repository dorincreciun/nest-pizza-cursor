import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponseDto } from '../dto/error-response.dto';

/**
 * Filter global pentru gestionarea tuturor excepțiilor
 * Transformă toate excepțiile în formatul standardizat ErrorResponseDto
 * Conform standardelor API Response definite în reguli
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      // Excepție NestJS (HttpException)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // Răspuns simplu string
        message = exceptionResponse;
        error = this.getErrorName(status);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Răspuns obiect
        const responseObj = exceptionResponse as any;

        // Verifică dacă există deja un format standardizat
        if (responseObj.message) {
          message = Array.isArray(responseObj.message)
            ? responseObj.message
            : responseObj.message;
        } else {
          message = exception.message || this.getErrorName(status);
        }

        error = responseObj.error || this.getErrorName(status);
      } else {
        message = exception.message || this.getErrorName(status);
        error = this.getErrorName(status);
      }
    } else {
      // Excepție neașteptată (non-HTTP)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Eroare internă a serverului';
      error = 'Internal Server Error';

      // Logăm eroarea pentru debugging (doar în development)
      if (process.env.NODE_ENV !== 'production') {
        console.error('Unhandled exception:', exception);
      }
    }

    // Construiește răspunsul standardizat
    const errorResponse: ErrorResponseDto = {
      statusCode: status,
      message: message,
      error: error,
    };

    // Setează explicit Content-Type la application/json pentru a preveni returnarea HTML
    response.setHeader('Content-Type', 'application/json');
    
    // Trimite răspunsul
    response.status(status).json(errorResponse);
  }

  /**
   * Returnează numele erorii pe baza codului de status HTTP
   * @param status - Codul de status HTTP
   * @returns Numele erorii
   */
  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return errorNames[status] || 'Error';
  }
}
