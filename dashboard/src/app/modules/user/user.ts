import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../../services/api';
import { PendingModal } from '../pending-modal/pending-modal';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [CommonModule, FormsModule, PendingModal],
    templateUrl: './user.html',
    styleUrls: ['./user.css']
})
export class User implements OnInit {
    userData: any = null;
    loading = true;
    showPendingModal = false;

    showLocationModal = false;
    availableLocations: any[] = [];
    selectedLocation: any = null;
    locationModalError = '';
    unselectedZipcodes: any[] = [];
    newServiceZipcode = '';
    newCategoryName = '';
    editTaskState: Record<string, { taskName: string; zipcodes: string; lead: number; call: number; appointment: number; }> = {};
    activeTaskCategoryId: string | null = null;
    overrideModalOpen = false;
    overrideState: any = {
        categoryId: '',
        taskId: '',
        zipcode: '',
        lead: 0,
        call: 0,
        appointment: 0,
        overrideId: ''
    };
    zipcodeOverrides: any[] = [];
    locationSearchQuery = '';
    locationSearchLoading = false;
    filteredLocations: any[] = [];

    showCategoryModal = false;
    availableCategories: any[] = [];
    selectedCategory: any = null;
    selectedTasks: any[] = [];
    categoryModalError = '';
    categorySearchQuery = '';
    filteredCategories: any[] = [];

    constructor(
        private router: Router,
        private api: Api,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadUserData();
    }

    loadUserData() {
        this.loading = true;
        this.api.getUserProfile().subscribe({
            next: (res: any) => {
                this.userData = res?.data || {};

                if (!Array.isArray(this.userData.locations)) {
                    this.userData.locations = [];
                }
                if (!Array.isArray(this.userData.service_areas_zipcodes)) {
                    this.userData.service_areas_zipcodes = [];
                }
                if (!Array.isArray(this.userData.unselected_zipcodes)) {
                    this.userData.unselected_zipcodes = [];
                }
                this.unselectedZipcodes = this.userData.unselected_zipcodes;
                if (!Array.isArray(this.userData.categories)) {
                    this.userData.categories = [];
                }

                if (this.userData?.status === 'pending') {
                    this.showPendingModal = true;
                }

                this.loadZipcodeOverrides();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: err => {
                console.error('Failed to load user data', err);
                this.loading = false;
            }
        });
    }

    openLocationModal() {
        this.cdr.markForCheck();
        this.showLocationModal = true;
        this.locationModalError = '';
        this.selectedLocation = null;
        this.locationSearchQuery = '';       // ← add
        this.filteredLocations = [];         // ← add
        // this.locationSearchLoading = false;

        if (!this.availableLocations.length) {
            this.api.getLocations().subscribe({   // no param needed
                next: (res: any[]) => {
                    this.availableLocations = res || [];
                },
                error: err => console.error('Failed to load locations', err)
            });
        }

    }

    closeLocationModal() {
        this.showLocationModal = false;
    }

    addLocation() {
        this.locationModalError = '';

        if (!this.selectedLocation) {
            this.locationModalError = 'Please choose a location before saving.';
            return;
        }

        const userId = this.userData?._id;
        if (!userId) return;

        // First, add the location
        const locationPayload = {
            description: this.selectedLocation.location,
            city: this.selectedLocation.city,
            state: this.selectedLocation.state,
            country: this.selectedLocation.country || '',
            zipcode: null, // No zipcode in location
            type: this.selectedLocation.type || 'city',
            stateShort: this.selectedLocation.stateShort || '',
            zipcodes: [] // Empty zipcodes in location
        };

        this.api.addUserLocation(userId, locationPayload).subscribe({
            next: () => {
                // Now, fetch zipcodes and add to service areas
                this.addZipcodesToServiceArea(this.selectedLocation);
                this.closeLocationModal();
                this.loadUserData();
                this.cdr.markForCheck();
            },
            error: err => {
                console.error('Failed to add location', err);
                this.locationModalError = 'Unable to save location. Please try again.';
            }
        });
    }

    addZipcodesToServiceArea(location: any) {
        const payload = [{
            location: location.location,
            city: location.city,
            state: location.state,
            stateShort: location.stateShort,
            type: location.type || 'city',
            lead: 0,
            call: 0,
            appointment: 0
        }];

        this.api.sendLocation(payload).subscribe({
            next: (res: any) => {
                const first = Array.isArray(res?.data) ? res.data[0] : null;
                const zipcodes: string[] = Array.isArray(first?.zipcodes) ? first.zipcodes : [];
                if (zipcodes.length) {
                    // Add to service areas
                    const userId = this.userData?._id;
                    const currentZipcodes = this.userData.service_areas_zipcodes || [];
                    const newZipcodes = [...new Set([...currentZipcodes, ...zipcodes])];
                    this.api.updateUser(userId, { service_areas_zipcodes: newZipcodes }).subscribe({
                        next: () => {
                            this.loadUserData();
                        },
                        error: err => {
                            console.error('Failed to add zipcodes to service area', err);
                        }
                    });
                }
            },
            error: err => {
                console.error('Failed to load zipcodes for location', err);
            }
        });
    }

    deleteLocation(locationId: string) {
        const userId = this.userData?._id;
        if (!userId || !locationId) return;
        if (!confirm('Delete this location?')) return;

        this.api.deleteUserLocation(userId, locationId).subscribe({
            next: () => this.loadUserData(),
            error: err => {
                console.error('Failed to delete location', err);
                alert('Unable to delete location');
            }
        });
    }

    addServiceZipcode() {
        const zipcode = (this.newServiceZipcode || '').trim();
        if (!zipcode) return;
        if (!this.userData.service_areas_zipcodes.includes(zipcode)) {
            this.userData.service_areas_zipcodes.push(zipcode);
            this.saveUserFields({ service_areas_zipcodes: this.userData.service_areas_zipcodes });
        }
        this.newServiceZipcode = '';
    }

    removeServiceZipcode(zipcode: string) {
        if (!confirm(`Remove service zipcode ${zipcode}?`)) return;
        this.userData.service_areas_zipcodes = this.userData.service_areas_zipcodes.filter((z: string) => z !== zipcode);
        this.unselectedZipcodes = [...new Set([...this.unselectedZipcodes, zipcode])];
        this.saveUnselectedZipcodes();
    }

    addBackZipcode(zipcode: string) {
        this.unselectedZipcodes = this.unselectedZipcodes.filter((z: string) => z !== zipcode);
        if (!this.userData.service_areas_zipcodes.includes(zipcode)) {
            this.userData.service_areas_zipcodes.push(zipcode);
        }
        this.saveUnselectedZipcodes();
    }

    saveUnselectedZipcodes() {
        const userId = this.userData?._id;
        if (!userId) return;

        this.api.updateUnselectedZipcodes(userId, {
            service_areas_zipcodes: this.userData.service_areas_zipcodes,
            unselected_zipcodes: this.unselectedZipcodes
        }).subscribe({
            next: () => this.loadUserData(),
            error: err => {
                console.error('Unable to update unselected zipcodes', err);
                alert('Unable to save zipcode selection');
            }
        });
    }

    saveUserFields(payload: any) {
        const userId = this.userData?._id;
        if (!userId) return;

        this.api.updateUser(userId, payload).subscribe({
            next: () => this.loadUserData(),
            error: err => {
                console.error('Unable to update user', err);
                alert('Unable to save changes');
            }
        });
    }

    onTaskCheckedChange(category: any, task: any) {
        // Persist the checkbox state immediately
        this.saveUserFields({ categories: this.userData.categories });
    }

    addCategory() {
        this.showCategoryModal = true;
        this.categoryModalError = '';
        this.selectedCategory = null;
        this.selectedTasks = [];
        this.categorySearchQuery = '';
        this.filteredCategories = [];
        if (!this.availableCategories.length) {
            this.api.getCategories().subscribe({
                next: (res: any) => {
                    this.availableCategories = res?.data || [];
                },
                error: err => console.error('Failed to load categories', err)
            });
        }
    }

    deleteCategory(category: any) {
        if (!confirm(`Delete category ${category.categoryName}?`)) return;
        this.userData.categories = this.userData.categories.filter((cat: any) => cat.categoryId !== category.categoryId);
        this.saveUserFields({ categories: this.userData.categories });
    }

    addTask(category: any) {
        const taskName = prompt('Enter task name');
        if (!taskName || !taskName.trim()) return;
        const rawZipcodes = prompt('Enter zipcodes for this task (comma separated)', '');
        const zipcodes = rawZipcodes ? rawZipcodes.split(',').map((z: string) => z.trim()).filter((z: string) => z) : [];
        const lead = Number(prompt('Lead price', '0') || 0);
        const call = Number(prompt('Call price', '0') || 0);
        const appointment = Number(prompt('Appointment price', '0') || 0);

        const task = {
            taskId: 'TASK-' + Date.now(),
            taskName: taskName.trim(),
            checked: false,
            zipcodes,
            price: { lead, call, appointment }
        };

        category.tasks = category.tasks ? [...category.tasks, task] : [task];
        this.saveUserFields({ categories: this.userData.categories });
    }

    deleteTask(category: any, task: any) {
        if (!confirm(`Delete task ${task.taskName}?`)) return;
        category.tasks = category.tasks.filter((t: any) => t.taskId !== task.taskId);
        this.saveUserFields({ categories: this.userData.categories });
    }

    getMatchingZipcodes(task: any) {
        const userZipcodes = this.userData?.service_areas_zipcodes || [];
        const taskZipcodes = Array.isArray(task.zipcodes) ? task.zipcodes : [];
        return taskZipcodes.filter((zip: string) => userZipcodes.includes(zip));
    }

    getPriceForZipcode(task: any, zipcode: string) {
        const override = this.zipcodeOverrides.find((o: any) =>
            o.taskId === task.taskId && o.zipcode === zipcode
        );
        if (override) {
            return override.price;
        }
        return task.price || { lead: 0, call: 0, appointment: 0 };
    }

    openOverrideModal(category: any, task: any, zipcode: string) {
        const override = this.zipcodeOverrides.find((o: any) =>
            o.taskId === task.taskId && o.zipcode === zipcode
        );
        this.overrideState = {
            categoryId: category.categoryId,
            taskId: task.taskId,
            zipcode,
            lead: override?.price?.lead ?? (task.price?.lead ?? 0),
            call: override?.price?.call ?? (task.price?.call ?? 0),
            appointment: override?.price?.appointment ?? (task.price?.appointment ?? 0),
            overrideId: override?._id || ''
        };
        this.overrideModalOpen = true;
    }

    closeOverrideModal() {
        this.overrideModalOpen = false;
    }

    saveOverridePrice() {
        const userId = this.userData?._id;
        if (!userId) return;
        const payload = {
            categoryId: this.overrideState.categoryId,
            taskId: this.overrideState.taskId,
            zipcode: this.overrideState.zipcode,
            price: {
                lead: Number(this.overrideState.lead) || 0,
                call: Number(this.overrideState.call) || 0,
                appointment: Number(this.overrideState.appointment) || 0
            }
        };
        this.api.saveZipcodePriceOverride(userId, payload).subscribe({
            next: () => {
                this.closeOverrideModal();
                this.loadZipcodeOverrides();
            },
            error: err => {
                console.error('Failed to save override', err);
                alert('Unable to save override');
            }
        });
    }

    loadZipcodeOverrides() {
        const userId = this.userData?._id;
        if (!userId) return;
        this.api.getZipcodePriceOverrides(userId).subscribe({
            next: (res: any) => {
                this.zipcodeOverrides = res?.data || [];
            },
            error: err => {
                console.error('Failed to load zipcode overrides', err);
                this.zipcodeOverrides = [];
            }
        });
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        this.router.navigate(['/login']);
    }

    // Category Modal Methods
    closeCategoryModal() {
        this.showCategoryModal = false;
    }

    onCategorySearch() {
        const query = this.categorySearchQuery.toLowerCase().trim();
        if (!query) {
            this.filteredCategories = [];
            return;
        }
        this.filteredCategories = this.availableCategories.filter(cat =>
            cat.name.toLowerCase().includes(query)
        );
    }

    selectCategory(cat: any) {
        this.selectedCategory = cat;
        this.selectedTasks = [];
        this.categorySearchQuery = '';
        this.filteredCategories = [];
        // Load tasks for this category
        this.api.getTasks().subscribe({
            next: (res: any) => {
                const allTasks = res?.data || [];
                this.selectedTasks = allTasks.filter((task: any) => task.categoryId.includes(cat._id)).map((task: any) => ({
                    taskId: task._id,
                    taskName: task.name,
                    checked: true,
                    price: task.price || []
                }));
            },
            error: err => console.error('Failed to load tasks', err)
        });
    }

    clearSelectedCategory() {
        this.selectedCategory = null;
        this.selectedTasks = [];
    }

    toggleTask(task: any) {
        task.checked = !task.checked;
    }

    saveCategory() {
        this.categoryModalError = '';
        if (!this.selectedCategory) {
            this.categoryModalError = 'Please select a category.';
            return;
        }
        const selectedTasks = this.selectedTasks.filter(t => t.checked);
        if (!selectedTasks.length) {
            this.categoryModalError = 'Please select at least one task.';
            return;
        }
        const categoryData = {
            categoryId: this.selectedCategory._id,
            categoryName: this.selectedCategory.name,
            tasks: selectedTasks
        };
        // Add to user categories
        this.userData.categories = [...(this.userData.categories || []), categoryData];
        this.saveUserFields({ categories: this.userData.categories });
        this.closeCategoryModal();
    }

    onLocationSearch() {
        const query = this.locationSearchQuery.trim().toLowerCase();
        if (!query) {
            this.filteredLocations = [];
            return;
        }
        this.filteredLocations = this.availableLocations.filter(loc =>
            loc.location?.toLowerCase().includes(query) ||
            loc.city?.toLowerCase().includes(query) ||
            loc.state?.toLowerCase().includes(query)
        );
    }

    selectLocation(loc: any) {
        this.selectedLocation = loc;
        this.filteredLocations = [];
        this.locationSearchQuery = loc.location + ' — ' + loc.city + ', ' + loc.state;
        this.cdr.markForCheck();
    }

    clearSelectedLocation() {
        this.selectedLocation = null;
        this.locationSearchQuery = '';
        this.filteredLocations = [];
        this.cdr.markForCheck();
    }
}
