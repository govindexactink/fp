import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { ConfirmModal } from '../confirm-modal/confirm-modal';

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
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.loading = true;
        this.error = '';
        this.api.getAllUsers().subscribe({
            next: (res: any) => {
                this.users = res?.data || [];
                this.loading = res?.loading || false;
                console.log("Users:", this.users);
                console.log("Loading:", this.loading);
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
                // this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Failed to delete user', err);
                alert('Failed to delete user');
            }
        });
    }
}
