// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Api } from '../../../services/api'
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-add-task',
//   standalone: true, // ✅ REQUIRED
//   imports: [CommonModule, ReactiveFormsModule], // ✅ FIX HERE
//   templateUrl: './add-task.html',
//   styleUrls: ['./add-task.css']
// })
// export class AddTask implements OnInit {

//   taskForm!: FormGroup;
//   categories: any[] = [];

//   constructor(
//     private fb: FormBuilder,
//     private api: Api,
//       private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.initForm();
//     this.getCategories();
//   }

//   initForm() {
//     this.taskForm = this.fb.group({
//       type: ['task'],
//       taskName: ['', Validators.required],
//       category: ['', Validators.required],
//       description: [''],
//       lead: [''],
//       call: [''],
//       appointment: ['']
//     });
//   }

//   getCategories() {
//     this.api.getCategories().subscribe({
//       next: (res: any) => {
//         this.categories = res?.data || [];
//       },
//       error: (err) => console.log(err)
//     });
//   }

//   onSubmit() {
//     if (this.taskForm.invalid) {
//       this.taskForm.markAllAsTouched();
//       return;
//     }

//     const formValue = this.taskForm.value;

//     const payload = {
//       name: formValue.taskName,
//       description: formValue.description,
//       status: "ACTIVE",
//       categoryId: [formValue.category],
//        taskId: 'TASK-' + Date.now(),
//       price: [
//         {
//           lead: Number(formValue.lead) || 0,
//           call: Number(formValue.call) || 0,
//           appointment: Number(formValue.appointment) || 0
//         }
//       ]
//     };

//     this.api.addTask(payload).subscribe({
//       next: () => {
//         alert('Task added');
//         this.taskForm.reset();
//           this.router.navigate(['/categories']);

//       },
//       error: (err) => console.log(err)
//     });
//   }
// }

import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css']
})
export class AddTask implements OnInit {

  taskForm!: FormGroup;
  categories: any[] = [];

  locations: any[] = [];
  filteredLocations: any[] = [];

  locationType: 'city' | 'state' = 'city';

  selectedLocation: any = null;
  isLocationLoading = false;

  modal: any;
  zipcodeModal: any;
  selectedZipDetails: any = null;
  locationServiceAreaMap = new Map<string, any[]>();

  // ✅ NEW (for modal multi-select)
  tempLocations: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getCategories();
    // this.getLocations();
  }

  initForm() {
    this.taskForm = this.fb.group({
      taskName: ['', Validators.required],
      category: [[], Validators.required],
      description: [''],
      taskLead: [0],
      taskCall: [0],
      taskAppointment: [0],
      prices: this.fb.array([])
    });
  }

  get prices(): FormArray {
    return this.taskForm.get('prices') as FormArray;
  }

  getCategories() {
    this.api.getCategories().subscribe(res => {
      this.categories = res?.data || [];
      this.api.getTasks().subscribe(tasksRes => {
        const tasks = tasksRes?.data || [];
        this.categories.forEach(cat => {
          cat.isUsed = tasks.some((task: any) => task.categoryId?.includes(cat._id));
        });
      });
    });
  }

  isCategorySelected(categoryId: string) {
    const selected = this.taskForm.get('category')?.value;
    return Array.isArray(selected) && selected.includes(categoryId);
  }

  getLocations() {
    this.api.getLocations().subscribe((res: any[]) => {
      this.locations = res;
      this.filteredLocations = res;
    });
  }

  // ✅ MODAL
  openModal() {
    const modalEl = document.getElementById('locationModal');
    this.modal = new bootstrap.Modal(modalEl);
    this.modal.show();
  }

  closeModal() {
    this.modal.hide();
  }

  openZipcodePopup(zipcode: string, location: any) {
    const locationKey = `${location.city}-${location.state}`;
    const serviceArea = this.locationServiceAreaMap.get(locationKey) || [];
    const zipData = serviceArea.find((sa: any) => sa.zipcode === zipcode);
    const price = zipData?.prices?.[0] || { lead: 0, call: 0, appointment: 0 };

    this.selectedZipDetails = {
      zipcode,
      location: location.location,
      city: location.city,
      state: location.state,
      type: location.type,
      price
    };

    const modalEl = document.getElementById('zipcodeModal');
    this.zipcodeModal = new bootstrap.Modal(modalEl);
    this.zipcodeModal.show();
  }

  closeZipcodePopup() {
    this.zipcodeModal?.hide();
  }

  // SEARCH
onSearch(event: any) {
  this.getLocations();
  const value = event.target.value.toLowerCase().trim();

  // if empty → show nothing
  if (!value) {
    this.filteredLocations = [];
    return;
  }

  // ✅ filter + remove already selected
  this.filteredLocations = this.locations.filter(loc => {

    const match = this.locationType === 'city'
      ? loc.city.toLowerCase().includes(value)
      : loc.state.toLowerCase().includes(value);

    const alreadySelected = this.tempLocations.some(
      (l: any) => l.city === loc.city && l.state === loc.state
    );

    return match && !alreadySelected;

  });
}

  // ✅ SELECT (NO CLOSE)
selectLocation(loc: any, type: 'city' | 'state') {

  const exists = this.tempLocations.some(
    (l: any) => l.city === loc.city && l.state === loc.state
  );

  if (exists) return;

  this.tempLocations.push({
    location: loc.location,
    city: loc.city,
    state: loc.state,
    type: type,
    stateShort: loc.stateShort,
    lead: 0,
    call: 0,
    appointment: 0
  });

  // ✅ REMOVE from visible list immediately
  this.filteredLocations = this.filteredLocations.filter(
    (l: any) => !(l.city === loc.city && l.state === loc.state)
  );
}

sendLocationToBackend(location: any) {
  this.isLocationLoading = true;

  this.api.sendLocation(location).subscribe({
    next: () => this.isLocationLoading = false,
    error: () => this.isLocationLoading = false
  });
}

  // ✅ FINAL ADD
addAllLocationsToForm() {

  if (this.tempLocations.length === 0) return;

  this.isLocationLoading = true;

  this.api.sendLocation(this.tempLocations).subscribe({

    next: (res: any) => {

      const backendLocations = res?.data || [];

      backendLocations.forEach((loc: any) => {

        const exists = this.prices.value.some(
          (p: any) =>
            p.city === loc.city &&
            p.state === loc.state &&
            p.location === loc.location
        );

        if (!exists) {
          const locationKey = `${loc.city}-${loc.state}`;
          this.locationServiceAreaMap.set(locationKey, loc.serviceArea || []);
          const zipcodes = (loc.serviceArea || []).map((sa: any) => sa.zipcode);

          this.prices.push(this.fb.group({

            location: [loc.location],

            city: [loc.city],

            state: [loc.state],

            stateShort: [loc.stateShort || ''],

            type: [loc.type],

            zipcodes: [zipcodes],

            lead: [loc.lead || 0],

            call: [loc.call || 0],

            appointment: [loc.appointment || 0]

          }));
        }

      });

      this.tempLocations = [];
      this.filteredLocations = [];
      this.isLocationLoading = false;

      this.closeModal();
    },

    error: (err) => {
      console.error(err);
      this.isLocationLoading = false;
    }

  });
}

  removeLocation(index: number) {
    this.prices.removeAt(index);
  }

  trackByIndex(index: number) {
    return index;
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formValue = this.taskForm.value;

    // Transform prices array to locations array with nested prices
    const categoryIds = Array.isArray(formValue.category)
      ? formValue.category
      : [formValue.category];

    const locations = (formValue.prices || []).map((price: any) => ({
      state: price.state,
      city: price.city,
      type: price.type,
      shortState: price.stateShort,
      location: price.location,
      categoryId: categoryIds,
      prices: [
        {
          lead: Number(price.lead) || 0,
          call: Number(price.call) || 0,
          appointment: Number(price.appointment) || 0
        }
      ]
    }));

    const payload = {
      name: formValue.taskName,
      description: formValue.description,
      status: "ACTIVE",
      categoryId: categoryIds,
      taskId: 'TASK-' + Date.now(),
      price: [
        {
          lead: Number(formValue.taskLead) || 0,
          call: Number(formValue.taskCall) || 0,
          appointment: Number(formValue.taskAppointment) || 0
        }
      ],
      locations: locations
    };

    this.api.addTask(payload).subscribe(() => {
      alert('Task added');
      this.router.navigate(['/categories']);
    });
  }
}
