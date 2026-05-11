// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { Api } from '../../../services/api';

// @Component({
//   selector: 'app-signup',
//   imports: [CommonModule, ReactiveFormsModule, RouterLink],
//   templateUrl: './signup.html',
//   styleUrl: './signup.css',
// })
// export class Signup {

//   form: FormGroup;
//   loading = false;
//   errorMsg = '';
//   showPassword = false;
//   showConfirm = false;
//   step = 1; // 1 = credentials, 2 = location (optional)

//   constructor(private fb: FormBuilder, private router: Router, private api: Api) {
//     this.form = this.fb.group({
//       username: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       confirmPassword: ['', Validators.required],
//       city: [''],
//       country: [''],
//     }, { validators: this.passwordMatch });
//   }

//   passwordMatch(g: AbstractControl) {
//     return g.get('password')?.value === g.get('confirmPassword')?.value
//       ? null : { mismatch: true };
//   }

//   get f() { return this.form.controls; }

//   get step1Valid() {
//     return this.f['username'].valid && this.f['email'].valid &&
//       this.f['password'].valid && this.f['confirmPassword'].valid &&
//       !this.form.hasError('mismatch');
//   }

//   nextStep() { if (this.step1Valid) this.step = 2; }
//   prevStep() { this.step = 1; }

//   onSubmit() {
//     if (this.form.invalid) { this.form.markAllAsTouched(); return; }
//     this.loading = true;
//     this.errorMsg = '';

//     const { username, email, password, city, country } = this.form.value;
//     const payload: any = { username, email, password };
//     if (city || country) {
//       payload.locations = [{ city, country }];
//     }

//     this.api.registerUser(payload).subscribe({
//       next: () => this.router.navigate(['/dashboard']),
//       error: err => {
//         this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
//         this.loading = false;
//       }
//     });
//   }
// }











// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   ReactiveFormsModule,
//   AbstractControl
// } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Router, RouterLink } from '@angular/router';
// import { Api } from '../../../services/api';

// declare var bootstrap: any;

// @Component({
//   selector: 'app-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterLink],
//   templateUrl: './signup.html',
//   styleUrls: ['./signup.css']
// })
// export class Signup implements OnInit {

//   form!: FormGroup;

//   step = 1;
//   loading = false;
//   errorMsg = '';

//   showPassword = false;
//   showConfirm = false;

//   // SERVICES
//   servicesList: any[] = [];
//   selectedServices: string[] = [];

//   // LOCATION
//   locations: any[] = [];
//   filteredLocations: any[] = [];
//   tempLocations: any[] = [];
//   selectedLocations: any[] = [];

//   modal: any;

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private api: Api
//   ) { }

//   ngOnInit() {
//     this.initForm();
//     this.getServices();
//   }

//   // ================= FORM =================

//   initForm() {
//     this.form = this.fb.group({
//       username: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       confirmPassword: ['', Validators.required]
//     }, { validators: this.passwordMatch });
//   }

//   passwordMatch(g: AbstractControl) {
//     return g.get('password')?.value === g.get('confirmPassword')?.value
//       ? null : { mismatch: true };
//   }

//   // ✅ FIX: for HTML (f['username'])
//   get f() {
//     return this.form.controls;
//   }

//   // ✅ STEP VALIDATION
//   get step1Valid() {
//     return this.f['username'].valid &&
//       this.f['email'].valid &&
//       this.f['password'].valid &&
//       this.f['confirmPassword'].valid &&
//       !this.form.hasError('mismatch');
//   }

//   nextStep() {
//     if (this.step1Valid) this.step = 2;
//   }

//   prevStep() {
//     this.step = 1;
//   }

//   // ================= SERVICES =================

//   getServices() {
//     this.api.getCategories().subscribe(res => {
//       this.servicesList = res?.data || [];
//     });
//   }

//   onServiceChange(event: any) {
//     const val = event.target.value;

//     if (event.target.checked) {
//       this.selectedServices.push(val);
//     } else {
//       this.selectedServices = this.selectedServices.filter(v => v !== val);
//     }
//   }

//   // ================= LOCATION =================

//   getLocations() {
//     this.api.getLocations().subscribe((res: any[]) => {
//       this.locations = res;
//       this.filteredLocations = res;
//     });
//   }

//   openModal() {
//     this.getLocations();
//     const modalEl = document.getElementById('locationModal');
//     this.modal = new bootstrap.Modal(modalEl);
//     this.modal.show();
//   }

//   closeModal() {
//     this.modal.hide();
//   }

//   onSearch(event: any) {
//     const value = event.target.value.toLowerCase();

//     if (!value) {
//       this.filteredLocations = [];
//       return;
//     }

//     this.filteredLocations = this.locations.filter(loc =>
//       loc.city.toLowerCase().includes(value) ||
//       loc.state.toLowerCase().includes(value)
//     );
//   }

//   selectLocation(loc: any) {

//     const exists = this.tempLocations.some(
//       l => l.city === loc.city && l.state === loc.state
//     );

//     if (exists) return;

//     this.tempLocations.push(loc);
//   }

//   // ✅ MAIN ZIPCODE LOGIC
//   addAllLocations() {

//     if (this.tempLocations.length === 0) return;

//     this.api.sendLocation(this.tempLocations).subscribe((res: any) => {

//       const backendLocations = res?.data || [];

//       backendLocations.forEach((loc: any) => {

//         const zipcodes = (loc.serviceArea || []).map((z: any) => z.zipcode);

//         const formatted = {
//           city: loc.city,
//           state: loc.state,
//           location: loc.location,
//           type: loc.type,
//           zipcodes
//         };

//         const exists = this.selectedLocations.some(
//           l => l.city === loc.city && l.state === loc.state
//         );

//         if (!exists) {
//           this.selectedLocations.push(formatted);
//         }

//       });

//       this.tempLocations = [];
//       this.filteredLocations = [];

//       this.closeModal();
//     });
//   }

//   removeLocation(i: number) {
//     this.selectedLocations.splice(i, 1);
//   }

//   // ================= SUBMIT =================

//   onSubmit() {

//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     this.loading = true;

//     const payload = {
//       username: this.form.value.username,
//       email: this.form.value.email,
//       password: this.form.value.password,
//       services: this.selectedServices,
//       locations: this.selectedLocations
//     };

//     console.log("FINAL PAYLOAD", payload);

//     this.api.registerUser(payload).subscribe({
//       next: () => this.router.navigate(['/dashboard']),
//       error: err => {
//         this.errorMsg = err.error?.message || 'Error';
//         this.loading = false;
//       }
//     });
//   }
// }
























// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   ReactiveFormsModule,
//   AbstractControl
// } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Router, RouterLink } from '@angular/router';
// import { Api } from '../../../services/api';

// declare var bootstrap: any;

// @Component({
//   selector: 'app-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterLink],
//   templateUrl: './signup.html',
//   styleUrls: ['./signup.css']
// })
// export class Signup implements OnInit {

//   form!: FormGroup;

//   step = 1;
//   loading = false;
//   errorMsg = '';

//   showPassword = false;
//   showConfirm = false;

//   // SERVICES
//   servicesList: any[] = [];
//   filteredServices: any[] = [];
//   selectedServices: any[] = [];

//   // LOCATION
//   locations: any[] = [];
//   filteredLocations: any[] = [];
//   tempLocations: any[] = [];
//   selectedLocations: any[] = [];

//   modal: any;

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private api: Api
//   ) { }

//   ngOnInit() {
//     this.initForm();
//     this.getServices();
//   }

//   // ================= FORM =================

//   initForm() {
//     this.form = this.fb.group({
//       username: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       confirmPassword: ['', Validators.required]
//     }, { validators: this.passwordMatch });
//   }

//   passwordMatch(g: AbstractControl) {
//     return g.get('password')?.value === g.get('confirmPassword')?.value
//       ? null : { mismatch: true };
//   }

//   get f() {
//     return this.form.controls;
//   }

//   get step1Valid() {
//     return this.form.valid && !this.form.hasError('mismatch');
//   }

//   nextStep() {
//     if (this.step1Valid) this.step = 2;
//   }

//   prevStep() {
//     this.step = 1;
//   }


//   // ================= SERVICES =================

//   getServices() {
//     this.api.getCategories().subscribe(res => {
//       this.servicesList = res?.data || [];
//       this.filteredServices = this.servicesList;
//     });
//   }

//   onServiceSearch(e: any) {
//     const val = e.target.value.toLowerCase();

//     this.filteredServices = this.servicesList.filter(s =>
//       s.name.toLowerCase().includes(val)
//     );
//   }

//   selectService(service: any) {
//     const exists = this.selectedServices.find(s => s._id === service._id);
//     if (!exists) this.selectedServices.push(service);
//   }

//   removeService(i: number) {
//     this.selectedServices.splice(i, 1);
//   }

//   // ================= LOCATION =================

//   getLocations() {
//     this.api.getLocations().subscribe((res: any[]) => {
//       this.locations = res;
//     });
//   }

//   openModal() {
//     this.getLocations();
//     const modalEl = document.getElementById('locationModal');
//     this.modal = new bootstrap.Modal(modalEl);
//     this.modal.show();
//   }

//   closeModal() {
//     this.modal.hide();
//   }

//   onSearch(event: any) {
//     const value = event.target.value.toLowerCase();

//     this.filteredLocations = this.locations.filter(loc =>
//       loc.city.toLowerCase().includes(value) ||
//       loc.state.toLowerCase().includes(value)
//     );
//   }

//   selectLocation(loc: any) {
//     const exists = this.tempLocations.some(
//       l => l.city === loc.city && l.state === loc.state
//     );

//     if (!exists) this.tempLocations.push(loc);
//   }

//   // ✅ ZIPCODE LOGIC
//   addAllLocations() {

//     if (!this.tempLocations.length) return;

//     this.api.sendLocation(this.tempLocations).subscribe((res: any) => {

//       const backendLocations = res?.data || [];

//       backendLocations.forEach((loc: any) => {

//         const formatted = {
//           city: loc.city,
//           state: loc.state,
//           location: loc.location,
//           type: loc.type,
//           zipcodes: loc.zipcodes || []   // ✅ IMPORTANT
//         };

//         const exists = this.selectedLocations.some(
//           l => l.city === loc.city && l.state === loc.state
//         );

//         if (!exists) this.selectedLocations.push(formatted);
//       });

//       this.tempLocations = [];
//       this.filteredLocations = [];

//       this.closeModal();
//     });
//   }

//   removeLocation(i: number) {
//     this.selectedLocations.splice(i, 1);
//   }

//   // ================= SUBMIT =================
//   onSubmit() {

//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     this.loading = true;

//     // ✅ collect ALL zipcodes from selected locations
//     let allZipcodes: string[] = [];

//     this.selectedLocations.forEach(loc => {
//       if (loc.zipcodes && loc.zipcodes.length) {
//         allZipcodes = [...allZipcodes, ...loc.zipcodes];
//       }
//     });

//     // remove duplicates
//     allZipcodes = [...new Set(allZipcodes)];

//     const payload = {
//       username: this.form.value.username,
//       email: this.form.value.email,
//       password: this.form.value.password,

//       // ✅ ZIPCODES ARRAY
//       service_areas_zipcodes: allZipcodes,

//       // ✅ LOCATIONS ARRAY
//       locations: this.selectedLocations.map(loc => ({
//         description: loc.location,   // important mapping
//         city: loc.city,
//         state: loc.state,
//         country: 'USA',              // or dynamic
//         type: loc.type
//       })),

//       // optional
//       services: this.selectedServices.map(s => ({
//         serviceId: s._id,
//         serviceName: s.name,
//         categories: []
//       }))
//     };

//     console.log("FINAL PAYLOAD", payload);

//     this.api.registerUser(payload).subscribe({
//       next: () => this.router.navigate(['/login']),
//       error: err => {
//         this.errorMsg = err.error?.message || 'Error';
//         this.loading = false;
//       }
//     });
//   }
// }






// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   ReactiveFormsModule,
//   AbstractControl
// } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Router, RouterLink } from '@angular/router';
// import { Api } from '../../../services/api';

// declare var bootstrap: any;

// @Component({
//   selector: 'app-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterLink],
//   templateUrl: './signup.html',
//   styleUrls: ['./signup.css']
// })
// export class Signup implements OnInit {

//   form!: FormGroup;

//   step = 1;
//   loading = false;
//   errorMsg = '';

//   showPassword = false;
//   showConfirm = false;

//   // ✅ SERVICES
//   categories: any[] = [];
//   filteredCategories: any[] = [];
//   selectedServices: any[] = [];
//   showServiceDropdown = false;

//   // ✅ LOCATION
//   locations: any[] = [];
//   filteredLocations: any[] = [];
//   tempLocations: any[] = [];
//   selectedLocations: any[] = [];

//   modal: any;

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private api: Api
//   ) { }

//   ngOnInit() {
//     this.initForm();
//     this.getCategories();
//   }

//   // ================= FORM =================

//   initForm() {
//     this.form = this.fb.group({
//       username: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       confirmPassword: ['', Validators.required]
//     }, { validators: this.passwordMatch });
//   }

//   passwordMatch(g: AbstractControl) {
//     return g.get('password')?.value === g.get('confirmPassword')?.value
//       ? null : { mismatch: true };
//   }

//   get f() {
//     return this.form.controls;
//   }

//   get step1Valid() {
//     return this.f['username'].valid &&
//       this.f['email'].valid &&
//       this.f['password'].valid &&
//       this.f['confirmPassword'].valid &&
//       !this.form.hasError('mismatch');
//   }

//   nextStep() {
//     if (this.step1Valid) this.step = 2;
//   }

//   prevStep() {
//     this.step = 1;
//   }

//   // ================= SERVICES =================

//   getCategories() {
//     this.api.getCategories().subscribe(res => {
//       this.categories = res?.data || [];

//       this.api.getTasks().subscribe(tasksRes => {
//         const tasks = tasksRes?.data || [];

//         this.categories.forEach(cat => {
//           cat.tasks = tasks.filter((t: any) =>
//             t.categoryId?.includes(cat._id)
//           );
//         });
//       });
//     });
//   }

//   // 🔍 SEARCH BY CATEGORY NAME (NOT TASK)
//   onServiceSearch(event: any) {

//     const value = event.target.value.toLowerCase().trim();

//     if (!value) {
//       this.filteredCategories = [];
//       return;
//     }

//     // ✅ filter ONLY categories
//     this.filteredCategories = this.categories
//       .filter(cat => cat.name.toLowerCase().includes(value))
//       .map(cat => ({
//         ...cat,
//         tasks: cat.tasks || []   // show ALL tasks of that category
//       }));
//   }

//   selectTask(task: any) {
//     const exists = this.selectedServices.some(s => s._id === task._id);
//     if (exists) return;

//     this.selectedServices.push(task);

//     // ✅ clear search results after select
//     this.filteredCategories = [];
//   }

//   removeService(i: number) {
//     this.selectedServices.splice(i, 1);
//   }

//   // ================= LOCATION =================

//   getLocations() {
//     this.api.getLocations().subscribe((res: any[]) => {
//       this.locations = res;
//     });
//   }

//   openModal() {
//     this.getLocations();
//     this.filteredLocations = [];

//     const modalEl = document.getElementById('locationModal');
//     this.modal = new bootstrap.Modal(modalEl);
//     this.modal.show();
//   }

//   closeModal() {
//     this.modal.hide();
//   }

//   // 🔍 LOCATION SEARCH (ONLY ON SEARCH)
//   onSearch(event: any) {
//     const value = event.target.value.toLowerCase().trim();

//     if (!value) {
//       this.filteredLocations = [];
//       return;
//     }

//     this.filteredLocations = this.locations.filter(loc =>
//       loc.city.toLowerCase().includes(value) ||
//       loc.state.toLowerCase().includes(value)
//     );
//   }

//   selectLocation(loc: any) {
//     const exists = this.tempLocations.some(
//       l => l.city === loc.city && l.state === loc.state
//     );

//     if (exists) return;

//     this.tempLocations.push(loc);
//   }

//   addAllLocations() {

//     if (!this.tempLocations.length) return;

//     this.api.sendLocation(this.tempLocations).subscribe((res: any) => {

//       const backendLocations = res?.data || [];

//       backendLocations.forEach((loc: any) => {

//         const zipcodes = (loc.serviceArea || []).map((z: any) => z.zipcode);

//         const formatted = {
//           city: loc.city,
//           state: loc.state,
//           location: loc.location,
//           type: loc.type,
//           zipcodes
//         };

//         const exists = this.selectedLocations.some(
//           l => l.city === loc.city && l.state === loc.state
//         );

//         if (!exists) {
//           this.selectedLocations.push(formatted);
//         }

//       });

//       this.tempLocations = [];
//       this.filteredLocations = [];

//       this.closeModal();
//     });
//   }

//   removeLocation(i: number) {
//     this.selectedLocations.splice(i, 1);
//   }

//   // ================= SUBMIT =================

//   onSubmit() {

//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     this.loading = true;

//     const allZipcodes = this.selectedLocations.flatMap(l => l.zipcodes || []);

//     const payload = {
//       username: this.form.value.username,
//       email: this.form.value.email,
//       password: this.form.value.password,

//       services: this.selectedServices.map(s => s._id),

//       locations: this.selectedLocations.map(loc => ({
//         description: loc.location,
//         city: loc.city,
//         state: loc.state,
//         type: loc.type
//       })),

//       service_areas_zipcodes: allZipcodes
//     };

//     console.log("FINAL PAYLOAD", payload);

//     this.api.registerUser(payload).subscribe({
//       next: () => this.router.navigate(['/dashboard']),
//       error: err => {
//         this.errorMsg = err.error?.message || 'Error';
//         this.loading = false;
//       }
//     });
//   }
// }











import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../../services/api';

declare var bootstrap: any;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Signup implements OnInit {

  form!: FormGroup;

  step = 1;
  loading = false;
  errorMsg = '';

  showPassword = false;
  showConfirm = false;

  // ── SERVICES ──────────────────────────────────────────
  categories: any[] = [];
  allTasks: any[] = [];
  filteredCategories: any[] = [];
  selectedCategories: any[] = [];  // [{categoryId, categoryName, tasks: [{id, name, checked}]}]
  serviceSearchQuery = '';
  showDropdown = false;
  expandedCategoryId: string | null = null;  // which category is open

  // ── LOCATION ──────────────────────────────────────────
  locations: any[] = [];
  filteredLocations: any[] = [];
  tempLocations: any[] = [];
  selectedLocations: any[] = [];
  modal: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private api: Api
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadCategoriesAndTasks();
  }

  // ── FORM ──────────────────────────────────────────────

  initForm() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });
  }

  passwordMatch(g: AbstractControl) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get f() { return this.form.controls; }

  get step1Valid() {
    return this.f['username'].valid &&
      this.f['email'].valid &&
      this.f['password'].valid &&
      this.f['confirmPassword'].valid &&
      !this.form.hasError('mismatch');
  }

  nextStep() { if (this.step1Valid) this.step = 2; }
  prevStep() { this.step = 1; }

  // ── LOAD CATEGORIES + TASKS ───────────────────────────

  loadCategoriesAndTasks() {
    this.api.getCategories().subscribe(catRes => {
      this.categories = catRes?.data || [];

      this.api.getTasks().subscribe(taskRes => {
        this.allTasks = taskRes?.data || [];

        // Attach tasks to each category
        this.categories.forEach(cat => {
          cat.tasks = this.allTasks.filter((t: any) =>
            Array.isArray(t.categoryId) && t.categoryId.includes(cat._id)
          );
        });
      });
    });
  }

  // ── SERVICE SEARCH ────────────────────────────────────

  onServiceSearch(event: any) {
    const value = event.target.value.trim();
    this.serviceSearchQuery = value;
    this.expandedCategoryId = null; // collapse on new search

    if (!value) {
      // Show all categories when input is clicked and empty
      this.filteredCategories = [...this.categories];
      this.showDropdown = true;
      return;
    }

    const lower = value.toLowerCase();

    // Filter categories by name
    this.filteredCategories = this.categories.filter(cat =>
      cat.name.toLowerCase().includes(lower) ||
      (cat.tasks || []).some((t: any) => t.name.toLowerCase().includes(lower))
    );

    this.showDropdown = this.filteredCategories.length > 0;
  }

  // Click category → select it (add all tasks as checked)
  selectCategory(cat: any) {
    const exists = this.selectedCategories.find(c => c.categoryId === cat._id);
    if (!exists) {
      const categoryData = {
        categoryId: cat._id,
        categoryName: cat.name,
        tasks: (cat.tasks || []).map((t: any) => ({
          taskId: t._id,
          taskName: t.name,
          checked: true,  // Default all to checked
          price: t.price || []
        }))
      };
      this.selectedCategories.push(categoryData);
    }
    // Clear search
    this.closeDropdown();
  }

  // Check if category already selected
  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.some(c => c.categoryId === categoryId);
  }

  // Toggle task checked state within a category
  toggleTaskInCategory(categoryIndex: number, taskIndex: number) {
    this.selectedCategories[categoryIndex].tasks[taskIndex].checked =
      !this.selectedCategories[categoryIndex].tasks[taskIndex].checked;
  }

  // Remove entire category from selection
  removeCategory(i: number) {
    this.selectedCategories.splice(i, 1);
  }

  // Close dropdown when clicking outside
  closeDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
      this.filteredCategories = [];
      this.serviceSearchQuery = '';
      this.expandedCategoryId = null;
    }, 200);
  }

  // ── LOCATION ──────────────────────────────────────────

  getLocations() {
    this.api.getLocations().subscribe((res: any[]) => {
      this.locations = res;
    });
  }

  openModal() {
    this.getLocations();
    this.filteredLocations = [];
    const modalEl = document.getElementById('locationModal');
    this.modal = new bootstrap.Modal(modalEl);
    this.modal.show();
  }

  closeModal() {
    this.modal?.hide();
  }

  onSearch(event: any) {
    const value = event.target.value.toLowerCase().trim();
    if (!value) { this.filteredLocations = []; return; }
    this.filteredLocations = this.locations.filter(loc =>
      loc.city?.toLowerCase().includes(value) ||
      loc.state?.toLowerCase().includes(value)
    );
  }

  selectLocation(loc: any) {
    const exists = this.tempLocations.some(
      l => l.city === loc.city && l.state === loc.state
    );
    if (!exists) this.tempLocations.push(loc);
  }

  isTempSelected(loc: any): boolean {
    return this.tempLocations.some(
      l => l.city === loc.city && l.state === loc.state
    );
  }

  // addAllLocations() {
  //   if (!this.tempLocations.length) return;

  //   this.api.sendLocation(this.tempLocations).subscribe((res: any) => {
  //     const backendLocations = res?.data || [];

  //     backendLocations.forEach((loc: any) => {
  //       const zipcodes = Array.isArray(loc.serviceArea)
  //         ? loc.serviceArea
  //           .map((z: any) => z?.zipcode)
  //           .filter((z: any) => !!z)   // remove null/undefined
  //         : [];
  //       // const zipcodes = (loc.serviceArea || []).map((z: any) => z.zipcode);
  //       const formatted = {
  //         city: loc.city,
  //         state: loc.state,
  //         location: loc.location,
  //         type: loc.type,
  //         zipcodes
  //       };
  //       const exists = this.selectedLocations.some(
  //         l => l.city === loc.city && l.state === loc.state
  //       );
  //       if (!exists) this.selectedLocations.push(formatted);
  //     });

  //     this.tempLocations = [];
  //     this.filteredLocations = [];
  //     this.closeModal();
  //   });
  // }

  addAllLocations() {
    if (!this.tempLocations.length) return;

    this.api.sendLocation(this.tempLocations).subscribe((res: any) => {

      console.log("BACKEND RESPONSE 👉", res);

      const backendLocations = res?.data || [];

      backendLocations.forEach((loc: any) => {

        // ✅ FIXED HERE
        let zipcodes: any[] = [];

        if (Array.isArray(loc.zipcodes)) {
          zipcodes = loc.zipcodes;
        }

        console.log("ZIPCODES 👉", zipcodes);

        const formatted = {
          city: loc.city,
          state: loc.state,
          location: loc.location,
          type: loc.type,
          zipcodes
        };

        const exists = this.selectedLocations.some(
          l => l.city === loc.city && l.state === loc.state
        );

        if (!exists) this.selectedLocations.push(formatted);
      });

      this.tempLocations = [];
      this.filteredLocations = [];
      this.closeModal();
    });
  }

  removeLocation(i: number) {
    this.selectedLocations.splice(i, 1);
  }

  // ── SUBMIT ────────────────────────────────────────────

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    // const allZipcodes = this.selectedLocations.flatMap(l => l.zipcodes || []);
    // const allZipcodes = this.selectedLocations
    //   .map(l => l.zipcodes || [])
    //   .reduce((acc, val) => acc.concat(val), []);
    const allZipcodes: any[] = [];

    this.selectedLocations.forEach(loc => {
      if (Array.isArray(loc.zipcodes)) {
        loc.zipcodes.forEach((z: any) => {
          if (z) allZipcodes.push(z);
        });
      }
    });

    console.log("ALL ZIPCODES 👉", allZipcodes); // ✅ DEBUG
    // Build categories payload with only checked tasks
    const categoriesPayload = this.selectedCategories.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      tasks: cat.tasks.map((t: any) => ({
        taskId: t.taskId,
        taskName: t.taskName,
        checked: t.checked
      }))
    }));

    const payload = {
      username: this.form.value.username,
      email: this.form.value.email,
      password: this.form.value.password,
      categories: categoriesPayload,
      locations: this.selectedLocations.map(loc => ({
        description: loc.location,
        city: loc.city,
        state: loc.state,
        type: loc.type
      })),
      service_areas_zipcodes: allZipcodes
    };

    console.log('FINAL PAYLOAD', payload);

    this.api.registerUser(payload).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => {
        this.router.navigate(['/login']),
          this.errorMsg = err.error?.message || 'Error';
        this.loading = false;
      }
    });
  }
}
