import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Api } from '../../../../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isAdminLogin: boolean;
  lockedByAdmin?: { username: string; email: string };
  lockedAt?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <div>
          <button class="btn btn-outline-secondary me-2" (click)="loadLockedUsers()">Refresh</button>
          <button class="btn btn-danger" (click)="logout()">Logout</button>
        </div>
      </div>

      @if (isLoading) {
        <div class="text-center">Loading...</div>
      }

      @if (errorMessage) {
        <div class="alert alert-danger">{{ errorMessage }}</div>
      }

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Locked Users (Admin Impersonating)</h5>
        </div>
        <div class="card-body">
          @if (lockedUsers.length === 0) {
            <p class="text-muted">No users currently locked by admin.</p>
          } @else {
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Locked By (Admin)</th>
                    <th>Locked At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of lockedUsers; track user._id) {
                    <tr>
                      <td>{{ user.username }}</td>
                      <td>{{ user.email }}</td>
                      <td>{{ user.lockedByAdmin?.username || 'Unknown' }} ({{ user.lockedByAdmin?.email || '' }})</td>
                      <td>{{ user.lockedAt ? (user.lockedAt | date:'short') : 'N/A' }}</td>
                      <td>
                        <button class="btn btn-sm btn-success me-1"
                          (click)="exitImpersonation(user._id)">
                          Unlock User
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, HttpClientModule]
})
export class AdminDashboardComponent implements OnInit {
  lockedUsers: User[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private api: Api,
    private router: Router,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.loadLockedUsers();
  }

  loadLockedUsers() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getLockedUsers().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.lockedUsers = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load locked users';
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/admin/login']);
        }
      }
       });
    }

    exitImpersonation(userId: string) {
      if (!confirm('Are you sure you want to unlock this user account?')) return;

      const adminToken = localStorage.getItem('token');
      if (!adminToken) {
          alert('Admin session not found');
          return;
      }
      const adminId = this.getAdminIdFromToken(adminToken);
      if (!adminId) {
          alert('Invalid admin token');
          return;
      }

      this.api.exitImpersonation(adminId, userId).subscribe({
          next: (res: any) => {
              if (res.success) {
                  alert('User unlocked successfully');
                  this.loadLockedUsers();
              }
          },
          error: (err: any) => {
              alert(err.error?.message || 'Failed to unlock user');
          }
      });
    }

    private getAdminIdFromToken(token: string): string | null {
     try {
       const payload = token.split('.')[1];
       let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
       while (base64.length % 4) {
         base64 += '=';
       }
       const decoded = atob(base64);
       const parsed = JSON.parse(decoded);
       return parsed.id || parsed.userId || null;
     } catch (e) {
       console.error('Failed to decode token', e);
       return null;
     }
   }

   logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/admin/login']);
  }
}
