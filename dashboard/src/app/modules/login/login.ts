import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../../services/api';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],

  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private router: Router, private api: Api) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });
  }

  get f() { return this.form.controls; }

  // onSubmit() {
  //   if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  //   this.loading = true;
  //   this.errorMsg = '';

  //   const { email, password } = this.form.value;
  //   this.api.loginUser({ email, password }).subscribe({
  //     next: () => this.router.navigate(['/categories']),
  //     error: err => {
  //       this.errorMsg = err.error?.message || 'Login failed. Check your credentials.';
  //       this.loading = false;
  //     }
  //   });
  // }
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.form.value;

    this.api.loginUser({ email, password }).subscribe({
      next: (res: any) => {

        const token = res?.data?.token;
        const role = res?.data?.user?.role;

        // ✅ SAVE IN LOCALSTORAGE
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);

        console.log("TOKEN 👉", token);
        console.log("ROLE 👉", role);

        // ✅ REDIRECT BASED ON ROLE
        if (role === 'admin') {
          this.router.navigate(['/categories']);
        } else {
          this.router.navigate(['/user']);
        }

      },
      error: err => {
        this.errorMsg = err.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
}
