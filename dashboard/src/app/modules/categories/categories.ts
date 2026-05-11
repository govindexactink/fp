import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { RouterLink } from '@angular/router';
import { Api } from '../../../services/api'
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  standalone:true
})
export class Categories implements OnInit  {
  categories: any[] = [];
  allCategories: any[] = [];
  tasks: any[] = [];
  allTasks: any[] = [];
  categoryForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private cdr: ChangeDetectorRef,
    private modal: ModalService
  ) {}


  deleteItem(cat: any) {
      this.modal.open({
        title: 'Delete',
        message: `are you sure want ot delete ${cat?.name}`,
        callback: (result: boolean) => {
          if (result) {
            console.log(cat?._id)
            this.api.daleteCategories(cat?._id).subscribe({next : (res: any) => {
              if(res?.data.length == 0) {
                return alert("not data available")
              }
              this.getCategories();
              alert("category dleted successfully")
               this.getCategories();
            }})
          }
        }
    });
  }

  ngOnInit() {
    this.initForm();
    this.getCategories();
    this.getTasks();
  }

  initForm() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  getCategories () {
    this.api.getCategories().subscribe({next : (res: any) => {
      if(res?.data.length == 0) {
        this.categories = [];
        this.allCategories = [];
        return;
      }
      this.categories = res?.data;
      this.allCategories = res;
      this.markUsedCategories();
      this.cdr.detectChanges(); 
      },error(err) {
        console.log('get all category issues',err);
      },
    });
  }

  getTasks() {
    this.api.getTasks().subscribe({next : (res: any) => {
      if(!res?.data?.length) {
        this.tasks = [];
        this.allTasks = [];
        this.markUsedCategories();
        return;
      }
      this.tasks = res?.data;
      this.allTasks = res;
      this.markUsedCategories();
      this.cdr.detectChanges();
      },error(err) {
        console.log('get all tasks issues',err);
      },
    });
  }

  markUsedCategories() {
    if (!this.tasks?.length) {
      return;
    }

    this.categories.forEach(cat => {
      cat.isUsed = this.tasks.some(task => task.categoryId?.includes(cat._id));
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
        this.getCategories();
      },
      error: (err) => {
        console.error(err);
        alert('Unable to add category');
      }
    });
  }

  deleteTask(task: any) {
    this.modal.open({
      title: 'Delete Task',
      message: `Are you sure you want to delete task ${task?.name}?`,
      callback: (result: boolean) => {
        if (!result) {
          return;
        }

        this.api.deleteTask(task._id).subscribe({
          next: () => {
            alert('Task deleted successfully');
            this.getTasks();
            this.getCategories();
          },
          error: (err) => {
            console.error(err);
            alert('Unable to delete task');
          }
        });
      }
    });
  }

}
