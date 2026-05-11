// import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Api } from '../../../services/api';
// import { CommonModule } from '@angular/common';


// @Component({
//   selector: 'app-add-category',
//   imports: [CommonModule, ReactiveFormsModule],
//   standalone: true,
//   templateUrl: './add-category.html',
//   styleUrl: './add-category.css',
// })
// export class AddCategory {
//   categoryForm!: FormGroup;

//   constructor(
//     private fb: FormBuilder,
//     private api: Api,
//     private cdr: ChangeDetectorRef,

//   ) { }

//   initForm() {
//     this.categoryForm = this.fb.group({
//       name: ['', Validators.required],
//       description: ['']
//     });
//   }

//   addCategory() {
//     console.log('add category called')
//     if (this.categoryForm.invalid) {
//       this.categoryForm.markAllAsTouched();
//       return;
//     }

//     const formValue = this.categoryForm.value;
//     const payload = {
//       name: formValue.name,
//       description: formValue.description,
//       status: 'ACTIVE',
//       cateId: 'CAT-' + Date.now()
//     };

//     this.api.addCategory(payload).subscribe({
//       next: () => {
//         alert('Category added successfully');
//         this.categoryForm.reset();
//       },
//       error: (err) => {
//         console.error(err);
//         alert('Unable to add category');
//       }
//     });
//   }

// }
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Api } from '../../../services/api';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-category.html',
  styleUrls: ['./add-category.css']
})
export class AddCategory {

  categoryForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {

    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });

  }

  addCategory() {

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;

    const payload = {
      name: formValue.name,
      description: formValue.description,
      status: 'ACTIVE',
      cateId: 'CAT-' + Date.now()
    };

    this.api.addCategory(payload).subscribe({
      next: () => {

        alert('Category added successfully');

        this.categoryForm.reset();

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);

        alert('Unable to add category');
      }
    });
  }
}