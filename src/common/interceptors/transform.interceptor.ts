import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor global care înfășoară toate răspunsurile de succes în structura { data: T }
 * Conform standardelor API Response definite în reguli
 * Transformă datele calendaristice în format ISO 8601 string
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ data: T }> {
    return next.handle().pipe(
      map((data) => {
        // Transformă datele calendaristice în ISO 8601 string
        const transformedData = this.transformDates(data);

        // Dacă răspunsul este deja în formatul { data: ... }, nu-l înfășoară din nou
        if (
          transformedData &&
          typeof transformedData === 'object' &&
          'data' in transformedData &&
          Object.keys(transformedData).length === 1
        ) {
          return transformedData as { data: T };
        }

        // Liste: deja în formatul { data: T[], meta } – nu adăuga un al doilea nivel de "data"
        if (
          transformedData &&
          typeof transformedData === 'object' &&
          'data' in transformedData &&
          'meta' in transformedData
        ) {
          return transformedData as { data: T };
        }

        // În caz contrar, înfășoară răspunsul în { data: ... }
        return { data: transformedData };
      }),
    );
  }

  /**
   * Transformă recursiv toate datele calendaristice (Date objects) în ISO 8601 string
   * @param obj - Obiectul de transformat
   * @returns Obiectul cu datele transformate
   */
  private transformDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformDates(item));
    }

    if (typeof obj === 'object') {
      const transformed: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          transformed[key] = this.transformDates(obj[key]);
        }
      }
      return transformed;
    }

    return obj;
  }
}
