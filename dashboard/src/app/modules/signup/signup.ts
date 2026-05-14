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

//   // ── SERVICES ──────────────────────────────────────────
//   categories: any[] = [];
//   allTasks: any[] = [];
//   filteredCategories: any[] = [];
//   selectedCategories: any[] = [];  // [{categoryId, categoryName, tasks: [{id, name, checked}]}]
//   serviceSearchQuery = '';
//   showDropdown = false;
//   expandedCategoryId: string | null = null;  // which category is open

//   // ── LOCATION ──────────────────────────────────────────
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
//     this.loadCategoriesAndTasks();
//   }

//   // ── FORM ──────────────────────────────────────────────

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

//   get f() { return this.form.controls; }

//   get step1Valid() {
//     return this.f['username'].valid &&
//       this.f['email'].valid &&
//       this.f['password'].valid &&
//       this.f['confirmPassword'].valid &&
//       !this.form.hasError('mismatch');
//   }

//   nextStep() { if (this.step1Valid) this.step = 2; }
//   prevStep() { this.step = 1; }

//   // ── LOAD CATEGORIES + TASKS ───────────────────────────

//   loadCategoriesAndTasks() {
//     this.api.getCategories().subscribe(catRes => {
//       this.categories = catRes?.data || [];

//       this.api.getTasks().subscribe(taskRes => {
//         this.allTasks = taskRes?.data || [];

//         // Attach tasks to each category
//         this.categories.forEach(cat => {
//           cat.tasks = this.allTasks.filter((t: any) =>
//             Array.isArray(t.categoryId) && t.categoryId.includes(cat._id)
//           );
//         });
//       });
//     });
//   }

//   // ── SERVICE SEARCH ────────────────────────────────────

//   onServiceSearch(event: any) {
//     const value = event.target.value.trim();
//     this.serviceSearchQuery = value;
//     this.expandedCategoryId = null; // collapse on new search

//     if (!value) {
//       // Show all categories when input is clicked and empty
//       this.filteredCategories = [...this.categories];
//       this.showDropdown = true;
//       return;
//     }

//     const lower = value.toLowerCase();

//     // Filter categories by name
//     this.filteredCategories = this.categories.filter(cat =>
//       cat.name.toLowerCase().includes(lower) ||
//       (cat.tasks || []).some((t: any) => t.name.toLowerCase().includes(lower))
//     );

//     this.showDropdown = this.filteredCategories.length > 0;
//   }

//   // Click category → select it (add all tasks as checked)
//   selectCategory(cat: any) {
//     const exists = this.selectedCategories.find(c => c.categoryId === cat._id);
//     if (!exists) {
//       const categoryData = {
//         categoryId: cat._id,
//         categoryName: cat.name,
//         tasks: (cat.tasks || []).map((t: any) => ({
//           taskId: t._id,
//           taskName: t.name,
//           checked: true,  // Default all to checked
//           price: t.price || []
//         }))
//       };
//       this.selectedCategories.push(categoryData);
//     }
//     // Clear search
//     this.closeDropdown();
//   }

//   // Check if category already selected
//   isCategorySelected(categoryId: string): boolean {
//     return this.selectedCategories.some(c => c.categoryId === categoryId);
//   }

//   // Toggle task checked state within a category
//   toggleTaskInCategory(categoryIndex: number, taskIndex: number) {
//     this.selectedCategories[categoryIndex].tasks[taskIndex].checked =
//       !this.selectedCategories[categoryIndex].tasks[taskIndex].checked;
//   }

//   // Remove entire category from selection
//   removeCategory(i: number) {
//     this.selectedCategories.splice(i, 1);
//   }

//   // Close dropdown when clicking outside
//   closeDropdown() {
//     setTimeout(() => {
//       this.showDropdown = false;
//       this.filteredCategories = [];
//       this.serviceSearchQuery = '';
//       this.expandedCategoryId = null;
//     }, 200);
//   }

//   // ── LOCATION ──────────────────────────────────────────

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
//     this.modal?.hide();
//   }

//   onSearch(event: any) {
//     const value = event.target.value.toLowerCase().trim();
//     if (!value) { this.filteredLocations = []; return; }
//     this.filteredLocations = this.locations.filter(loc =>
//       loc.city?.toLowerCase().includes(value) ||
//       loc.state?.toLowerCase().includes(value)
//     );
//   }

//   selectLocation(loc: any) {
//     const exists = this.tempLocations.some(
//       l => l.city === loc.city && l.state === loc.state
//     );
//     if (!exists) this.tempLocations.push(loc);
//   }

//   isTempSelected(loc: any): boolean {
//     return this.tempLocations.some(
//       l => l.city === loc.city && l.state === loc.state
//     );
//   }


//   addAllLocations() {
//     if (!this.tempLocations.length) return;

//     this.api.sendLocation(this.tempLocations).subscribe((res: any) => {

//       console.log("BACKEND RESPONSE 👉", res);

//       const backendLocations = res?.data || [];

//       backendLocations.forEach((loc: any) => {

//         // ✅ FIXED HERE
//         let zipcodes: any[] = [];

//         if (Array.isArray(loc.zipcodes)) {
//           zipcodes = loc.zipcodes;
//         }

//         console.log("ZIPCODES 👉", zipcodes);

//         const formatted = {
//           city: loc.city,
//           state: loc.state,
//           location: loc.location,
//           type: loc.type,
//           stateShort: loc.stateShort,
//           zipcodes
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

//   // ── SUBMIT ────────────────────────────────────────────

//   onSubmit() {
//     if (this.form.invalid) { this.form.markAllAsTouched(); return; }

//     this.loading = true;
//     // const allZipcodes = this.selectedLocations.flatMap(l => l.zipcodes || []);
//     // const allZipcodes = this.selectedLocations
//     //   .map(l => l.zipcodes || [])
//     //   .reduce((acc, val) => acc.concat(val), []);
//     const allZipcodes: any[] = [];

//     this.selectedLocations.forEach(loc => {
//       if (Array.isArray(loc.zipcodes)) {
//         loc.zipcodes.forEach((z: any) => {
//           if (z) allZipcodes.push(z);
//         });
//       }
//     });

//     console.log("ALL ZIPCODES 👉", allZipcodes); // ✅ DEBUG
//     // Build categories payload with only checked tasks
//     const categoriesPayload = this.selectedCategories.map(cat => ({
//       categoryId: cat.categoryId,
//       categoryName: cat.categoryName,
//       tasks: cat.tasks.map((t: any) => ({
//         taskId: t.taskId,
//         taskName: t.taskName,
//         checked: t.checked
//       }))
//     }));

//     const payload = {
//       username: this.form.value.username,
//       email: this.form.value.email,
//       password: this.form.value.password,
//       categories: categoriesPayload,
//       locations: this.selectedLocations.map(loc => ({
//         description: loc.location,
//         city: loc.city,
//         state: loc.state,
//         type: loc.type,
//         stateShort: loc.stateShort,
//       })),
//       service_areas_zipcodes: allZipcodes
//     };

//     console.log('FINAL PAYLOAD', payload);

//     this.api.registerUser(payload).subscribe({
//       next: () => this.router.navigate(['/login']),
//       error: err => {
//         this.router.navigate(['/login']),
//           this.errorMsg = err.error?.message || 'Error';
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
  includedLocations: any[] = [];
  excludedLocations: any[] = [];
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

  // ── UPDATED: selectLocation with action tracking ──
  selectLocation(loc: any, action: string) {
    const exists = this.tempLocations.some(
      l => l.city === loc.city && l.state === loc.state
    );
    if (!exists) {
      this.tempLocations.push({
        ...loc,
        action: action  // 'include' or 'exclude'
      });
    }
  }

  isTempSelected(loc: any): boolean {
    return this.tempLocations.some(
      l => l.city === loc.city && l.state === loc.state
    );
  }


  // ── UPDATED: addAllLocations with action separation ──
  addAllLocations() {
    if (!this.tempLocations.length) return;

    console.log("TEMP LOCATIONS BEING SENT 👉", this.tempLocations);

    this.api.sendLocation(this.tempLocations).subscribe((res: any) => {

      console.log("BACKEND RESPONSE 👉", res);

      const backendLocations = res?.data || [];

      // ✅ FIX: Create a map of city-state to action from tempLocations
      const actionMap = new Map<string, string>();
      this.tempLocations.forEach(loc => {
        const key = `${loc.city}-${loc.state}`;
        actionMap.set(key, loc.action);
      });

      console.log("ACTION MAP 👉", actionMap);

      // Separate arrays for included and excluded
      const included: any[] = [];
      const excluded: any[] = [];

      backendLocations.forEach((loc: any) => {

        // ✅ FIXED HERE
        let zipcodes: any[] = [];

        if (Array.isArray(loc.zipcodes)) {
          zipcodes = loc.zipcodes;
        }

        console.log("ZIPCODES 👉", zipcodes);

        // ✅ GET ACTION FROM TEMP LOCATIONS MAP
        const key = `${loc.city}-${loc.state}`;
        const action = actionMap.get(key);

        console.log(`ACTION FOR ${loc.city}, ${loc.state} 👉`, action);

        const formatted = {
          city: loc.city,
          state: loc.state,
          location: loc.location,
          type: loc.type,
          stateShort: loc.stateShort,
          zipcodes,
          action: action  // ✅ Store action from temp locations
        };

        const exists = this.selectedLocations.some(
          l => l.city === loc.city && l.state === loc.state
        );

        if (!exists) {
          this.selectedLocations.push(formatted);

          // ✅ Separate by action
          if (action === 'include') {
            included.push(formatted);
            console.log("✅ ADDED TO INCLUDED:", formatted);
          } else if (action === 'exclude') {
            excluded.push(formatted);
            console.log("❌ ADDED TO EXCLUDED:", formatted);
          } else {
            console.warn("⚠️ ACTION NOT SET FOR:", formatted);
          }
        }
      });

      // ✅ Update the separate arrays
      this.includedLocations = [...this.includedLocations, ...included];
      this.excludedLocations = [...this.excludedLocations, ...excluded];

      console.log("✅ FINAL INCLUDED LOCATIONS 👉", this.includedLocations);
      console.log("❌ FINAL EXCLUDED LOCATIONS 👉", this.excludedLocations);

      this.tempLocations = [];
      this.filteredLocations = [];
      this.closeModal();
    });
  }

  // ── UPDATED: removeLocation to sync included/excluded arrays ──
  removeLocation(i: number) {
    const removedLoc = this.selectedLocations[i];

    // ✅ Also remove from included/excluded arrays
    if (removedLoc.action === 'include') {
      this.includedLocations = this.includedLocations.filter(
        l => !(l.city === removedLoc.city && l.state === removedLoc.state)
      );
    } else if (removedLoc.action === 'exclude') {
      this.excludedLocations = this.excludedLocations.filter(
        l => !(l.city === removedLoc.city && l.state === removedLoc.state)
      );
    }

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

    // ✅ Format included locations
    const includedLocationsPayload = this.includedLocations.map(loc => ({
      description: loc.location,
      city: loc.city,
      state: loc.state,
      type: loc.type,
      stateShort: loc.stateShort,
    }));

    // ✅ Format excluded locations
    const excludedLocationsPayload = this.excludedLocations.map(loc => ({
      description: loc.location,
      city: loc.city,
      state: loc.state,
      type: loc.type,
      stateShort: loc.stateShort,
    }));

    const payload = {
      username: this.form.value.username,
      email: this.form.value.email,
      password: this.form.value.password,
      categories: categoriesPayload,
      locations: includedLocationsPayload,  // ✅ NEW
      excludedLocations: excludedLocationsPayload,  // ✅ NEW
      // locations: this.selectedLocations.map(loc => ({
      //   description: loc.location,
      //   city: loc.city,
      //   state: loc.state,
      //   type: loc.type,
      //   stateShort: loc.stateShort,
      // })),
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