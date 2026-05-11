import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModalService } from '../services/modal';
import { ConfirmModal } from './modules/confirm-modal/confirm-modal';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ConfirmModal, CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  protected readonly title = signal('dashboard');
  modalData: any;

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }

  constructor(private modalService: ModalService) {
    this.modalService.modalState$.subscribe(data => {
      this.modalData = data;
    });
  }

  handleResponse(result: boolean) {
    this.modalData?.callback(result);
    this.modalData = null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  }
}
