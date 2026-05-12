import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Api } from '../../../../services/api';

@Component({
  selector: 'app-admin-login',
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h4>Admin Login</h4>
            </div>
            <div class="card-body">
              @if (errorMessage) {
                <div class="alert alert-danger">{{ errorMessage }}</div>
              }
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" [(ngModel)]="email" name="email" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-control" [(ngModel)]="password" name="password" required />
                </div>
                <button type="submit" class="btn btn-primary w-100" [disabled]="isLoading">
                  @if (isLoading) {
                    Logging in...
                  } @else {
                    Login
                  }
                </button>
              </form>
              <hr>
              <a routerLink="/login" class="btn btn-link">Back to User Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class AdminLoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(private api: Api, private router: Router) { }

  onSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.api.adminLogin({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('role', 'admin');
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed';
      }
    });
  }
}
