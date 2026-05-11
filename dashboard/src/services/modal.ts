// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class Modal {}


import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private modalState = new Subject<any>();
  modalState$ = this.modalState.asObservable();

  open(data: any) {
    this.modalState.next(data);
  }
}
