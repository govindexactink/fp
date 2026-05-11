import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const expectedRole = route.data?.['role'];

  if (expectedRole && role !== expectedRole) {
    return router.createUrlTree(['/login']);
  }

  return true;
};



