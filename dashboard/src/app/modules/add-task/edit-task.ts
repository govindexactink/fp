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
import { Router, ActivatedRoute } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './edit-task.html',
  styleUrls: ['./edit-task.css']
})
export class EditTask implements OnInit {

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
  tempLocations: any[] = [];
  taskId: string = '';
  categoryId: string = '';
  existingCategoryIds: string[] = [];
  selectedCategories: string[] = [];
  locationServiceAreaMap = new Map<string, any[]>();

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getCategories();
    this.route.paramMap.subscribe(params => {
      const taskId = params.get('taskId');
      const categoryId = params.get('categoryId');
      if (taskId && categoryId) {
        this.taskId = taskId;
        this.categoryId = categoryId;
        this.loadTask(taskId);
      }
    });
  }

  initForm() {
    this.taskForm = this.fb.group({
      taskName: ['', Validators.required],
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
      this.updateCategoryUsage();
    });
  }

  private isCategoryUsed(categoryId: string) {
    return Array.isArray(this.existingCategoryIds) && this.existingCategoryIds.includes(categoryId);
  }

  private updateCategoryUsage() {
    if (!this.categories?.length) {
      return;
    }
    this.categories.forEach(cat => {
      cat.isUsed = this.isCategoryUsed(cat._id);
    });
  }

  toggleCategory(categoryId: string) {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.updateCategoryUsage();
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  getCategoryName(categoryId: string): string {
    const cat = this.categories.find(c => c._id === categoryId);
    return cat ? cat.name : categoryId;
  }

  getLocations() {
    this.api.getLocations().subscribe((res: any[]) => {
      this.locations = res;
      this.filteredLocations = res;
    });
  }

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

  updateZipcodePrice() {
    if (!this.selectedZipDetails) {
      return;
    }

    const payload = {
      city: this.selectedZipDetails.city,
      state: this.selectedZipDetails.state,
      type: this.selectedZipDetails.type,
      zipcode: this.selectedZipDetails.zipcode,
      price: this.selectedZipDetails.price,
      categoryId: this.categoryId
    };

    this.api.updateLocationServiceArea(this.taskId, payload).subscribe({
      next: () => {
        alert('Zipcode price updated successfully');
        const locationKey = `${this.selectedZipDetails.city}-${this.selectedZipDetails.state}`;
        const serviceArea = this.locationServiceAreaMap.get(locationKey) || [];
        const existingZip = serviceArea.find((sa: any) => sa.zipcode === this.selectedZipDetails.zipcode);
        if (existingZip) {
          existingZip.prices = [this.selectedZipDetails.price];
        } else {
          serviceArea.push({ zipcode: this.selectedZipDetails.zipcode, prices: [this.selectedZipDetails.price] });
        }
        this.locationServiceAreaMap.set(locationKey, serviceArea);
        this.closeZipcodePopup();
      },
      error: (err) => {
        console.error(err);
        alert('Unable to update zipcode price');
      }
    });
  }

  onSearch(event: any) {
    this.getLocations();
    const value = event.target.value.toLowerCase().trim();

    if (!value) {
      this.filteredLocations = [];
      return;
    }

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
            this.prices.push(this.fb.group({
              location: [loc.location],
              city: [loc.city],
              state: [loc.state],
              stateShort: [loc.stateShort || ''],
              type: [loc.type],
              zipcodes: [loc.zipcodes || []],
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

  loadTask(id: string) {
    this.api.getTaskById(id, this.categoryId).subscribe({
      next: (res: any) => {
        const data = res?.data;
        if (!data) return;

        this.taskForm.patchValue({
          taskName: data.name || '',
          description: data.description || '',
          taskLead: data.price?.[0]?.lead || 0,
          taskCall: data.price?.[0]?.call || 0,
          taskAppointment: data.price?.[0]?.appointment || 0
        });

        this.existingCategoryIds = Array.isArray(data.categoryId) ? data.categoryId : [];
        this.selectedCategories = [...this.existingCategoryIds];
        this.updateCategoryUsage();

        const items = data.locations?.length ? data.locations : [];

        items.forEach((item: any) => {
          if (item) {
            const locationKey = `${item.city}-${item.state}`;
            this.locationServiceAreaMap.set(locationKey, item.serviceArea || []);
            const zipcodes = (item.serviceArea || []).map((sa: any) => sa.zipcode);
            const price = Array.isArray(item.prices) ? item.prices[0] || {} : item;
            this.prices.push(this.fb.group({
              location: [item.location || ''],
              city: [item.city || ''],
              state: [item.state || ''],
               stateShort: [item.stateShort || ''],
              type: [item.type || ''],
              zipcodes: [zipcodes],
              lead: [price.lead || 0],
              call: [price.call || 0],
              appointment: [price.appointment || 0]
            }));
          }
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  updateTaskFields() {
    const formValue = this.taskForm.value;

    const payload = {
      name: formValue.taskName,
      description: formValue.description,
      categoryId: this.selectedCategories
    };

    this.api.updateTask(this.taskId, payload).subscribe({
      next: () => {
        alert('Task fields updated');
        this.existingCategoryIds = [...this.selectedCategories];
        this.updateCategoryUsage();
      },
      error: (err) => {
        console.error(err);
        alert('Unable to update task fields');
      }
    });
  }

  deleteLocation(index: number) {
    const location = this.prices.at(index).value;
    const payload = {
      city: location.city,
      state: location.state,
      type: location.type
    };

    this.api.deleteLocationFromTask(this.taskId, payload).subscribe({
      next: () => {
        this.prices.removeAt(index);
        alert('Location deleted');
      },
      error: (err) => {
        console.error(err);
        alert('Unable to delete location');
      }
    });
  }

  addLocations() {
    const locations = this.tempLocations.map((loc: any) => ({
      state: loc.state,
      city: loc.city,
      type: loc.type,
      stateShort: loc.stateShort,
      location: loc.location,
      categoryId: this.categoryId,
      prices: [
        {
          lead: Number(loc.lead) || 0,
          call: Number(loc.call) || 0,
          appointment: Number(loc.appointment) || 0
        }
      ]
    }));

    const payload = {
      locations: locations
    };

    this.api.addLocationsToTask(this.taskId, payload).subscribe({
      next: () => {
        alert('Locations added');
        this.tempLocations = [];
        this.closeModal();
        // Optionally reload the task to show new locations
        this.loadTask(this.taskId);
      },
      error: (err) => {
        console.error(err);
        alert('Unable to add locations');
      }
    });
  }
}
