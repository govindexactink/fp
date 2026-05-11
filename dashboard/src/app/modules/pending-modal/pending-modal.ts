import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pending-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pending-modal.html',
    styleUrls: ['./pending-modal.css']
})
export class PendingModal {

    @Output() acknowledged = new EventEmitter<void>();

    onAcknowledge() {
        this.acknowledged.emit();
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    }
}
