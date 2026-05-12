import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { ConfirmModal } from '../confirm-modal/confirm-modal';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule, ConfirmModal],
    templateUrl: './admin-users.html',
    styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {
    users: any[] = [];
    loading = true;
    error = '';
    showDeleteConfirm = false;
    userToDelete: any = null;
    statusChangeUser: any = null;
    newStatus = '';

    constructor(
        private api: Api,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.loading = true;
        this.error = '';
        this.api.getAllUsers().subscribe({
            next: (res: any) => {
                this.users = (res?.data || []).map((u: any) => ({
                    ...u,
                    // Ensure nested objects are safe
                    lockedByAdmin: u.lockedByAdmin || null
                }));
                this.loading = res?.loading || false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Failed to load users', err);
                this.error = 'Failed to load users';
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    onStatusChange(user: any) {
        this.statusChangeUser = user;
        this.newStatus = user.status;
        this.loadUsers();
    }

    saveStatusChange() {
        if (!this.statusChangeUser || !this.newStatus) return;

        this.api.updateUserStatus(this.statusChangeUser._id, this.newStatus).subscribe({
            next: (res: any) => {
                const userIndex = this.users.findIndex(u => u._id === this.statusChangeUser._id);
                if (userIndex > -1) {
                    this.users[userIndex].status = this.newStatus;
                }
                this.statusChangeUser = null;
                this.loadUsers();
            },
            error: (err) => {
                console.error('Failed to update user status', err);
                alert('Failed to update user status');
            }
        });
    }

    cancelStatusChange() {
        this.statusChangeUser = null;
    }

    openDeleteConfirm(user: any) {
        this.userToDelete = user;
        this.showDeleteConfirm = true;
    }

    onConfirmDelete(confirmed: boolean) {
        if (confirmed && this.userToDelete) {
            this.deleteUser(this.userToDelete);
        }
        this.showDeleteConfirm = false;
        this.userToDelete = null;
    }

    deleteUser(user: any) {
        this.api.deleteUser(user._id).subscribe({
            next: (res: any) => {
                this.users = this.users.filter(u => u._id !== user._id);
                this.loadUsers();
            },
            error: (err) => {
                console.error('Failed to delete user', err);
                alert('Failed to delete user');
            }
        });
    }

    impersonateUser(user: any) {
        if (!confirm(`Impersonate user "${user.username}"? This will lock their account for maintenance.`)) return;

        const adminId = this.getCurrentAdminId();
        if (!adminId) {
            alert('Admin ID not found');
            return;
        }

         this.api.impersonateUser(adminId, user._id).subscribe({
             next: (res: any) => {
                 if (res.success) {
                     // Store the impersonated user token separately to preserve admin token
                     const userToken = res.data.token;
                     // Save admin token in sessionStorage so we can return
                     const adminToken = localStorage.getItem('token');
                     if (!adminToken) {
                         console.error('Admin token not found');
                         alert('Admin session not found. Please login again.');
                         return;
                     }
                     sessionStorage.setItem('adminToken', adminToken);
                     // Save user token as current token
                     localStorage.setItem('token', userToken);
                     localStorage.setItem('role', 'user');
                     alert(`Now impersonating ${user.username}`);
                     // Navigate to user dashboard
                     this.router.navigate(['/user']);
                 }
             },
            error: (err: any) => {
                console.error('Failed to impersonate user', err);
                alert(err.error?.message || 'Failed to impersonate user');
            }
        });
    }

    exitImpersonation(user: any) {
        if (!confirm(`Unlock user "${user.username}"? This will end the admin session on their account.`)) return;

        const adminId = this.getCurrentAdminId();
        if (!adminId) {
            alert('Admin ID not found');
            return;
        }

        this.api.exitImpersonation(adminId, user._id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    alert('User unlocked successfully');
                    this.loadUsers();
                }
            },
            error: (err: any) => {
                console.error('Failed to unlock user', err);
                alert(err.error?.message || 'Failed to unlock user');
            }
        });
     }

     public getCurrentAdminId(): string | null {
         const token = localStorage.getItem('token');
         if (token) {
             try {
                 const payload = token.split('.')[1];
                 // Base64URL to Base64
                 let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                 // Add padding if needed
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
         return null;
     }
 }
