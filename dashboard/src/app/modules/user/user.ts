import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api } from '../../../services/api';
import { PendingModal } from '../pending-modal/pending-modal';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [CommonModule, PendingModal],
    templateUrl: './user.html',
    styleUrls: ['./user.css']
})
export class User implements OnInit {
    userData: any = null;
    loading = true;
    showPendingModal = false;

    constructor(
        private router: Router,
        private api: Api,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadUserData();
    }

    loadUserData() {
        this.api.getUserProfile().subscribe({
            next: (res: any) => {
                this.userData = res?.data;

                // Show pending modal if user status is pending
                if (this.userData?.status === 'pending') {
                    this.showPendingModal = true;
                }

                this.loading = false;
                this.cdr.markForCheck();
            },
            error: err => {
                console.error('Failed to load user data', err);
                this.loading = false;
            }
        });
    }

    onPendingModalAcknowledged() {
        this.showPendingModal = false;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        this.router.navigate(['/login']);
    }
}
