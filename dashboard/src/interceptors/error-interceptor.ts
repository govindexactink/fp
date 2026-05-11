import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
 return next(req).pipe(
    catchError((error) => {
      console.error('Global Error:', error);

      if (error.status === 0) {
        console.error('Server not reachable / CORS issue');
      } else if (error.status === 404) {
        console.error('API not found');
      } else if (error.status === 500) {
        console.error('Server error');
      }

      return throwError(() => error);
    })
  );
};
