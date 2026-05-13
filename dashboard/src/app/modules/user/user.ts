import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../../services/api';
import { PendingModal } from '../pending-modal/pending-modal';
import { BulkLocationUploadComponent } from '../bulk-location-upload/bulk-location-upload.component';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [CommonModule, FormsModule, PendingModal, BulkLocationUploadComponent],
    templateUrl: './user.html',
    styleUrls: ['./user.css']
})
export class User implements OnInit {
    userData: any = null;
    loading = true;
    showPendingModal = false;
    showBulkLocationModal = false;

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

    // Task Edit Modal State
    taskEditModalOpen = false;
    editingTask: any = null;
    editingCategory: any = null;
    editingTaskDefaultPrice: any = { lead: 0, call: 0, appointment: 0 };
    taskEditZipcodes: any[] = [];
    locationPrices: any[] = [];

    // Location Price Modal State
    locationPriceModalOpen = false;
    editingLocationPrice: any = null; // { city, state, type, stateShort, price } // Location-level prices (city/state)

    // Admin impersonation flag: true if current user is being viewed by an admin
    isAdminImpersonating = false;

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
        this.detectImpersonation();
        this.loadUserData();
    }

    // ... rest of existing methods ...

    openBulkLocationModal() {
        this.showBulkLocationModal = true;
    }

    closeBulkLocationModal() {
        this.showBulkLocationModal = false;
    }

    onBulkUploadClose() {
        this.showBulkLocationModal = false;
        // Reload user data to reflect any changes
        this.loadUserData();
    }

    detectImpersonation() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = token.split('.')[1];
                let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                while (base64.length % 4) {
                    base64 += '=';
                }
                const decoded = atob(base64);
                const parsed = JSON.parse(decoded);
                this.isAdminImpersonating = !!parsed.impersonatedBy;
            } catch (e) {
                this.isAdminImpersonating = false;
            }
        }
    }

    exitImpersonation() {
        const adminToken = sessionStorage.getItem('adminToken');
        if (!adminToken) {
            alert('Admin session not found. Please log in again as admin.');
            this.logout(); // fallback
            return;
        }

        const adminId = this.getAdminIdFromToken(adminToken);
        if (!adminId) {
            alert('Invalid admin token');
            return;
        }

        // Temporarily use admin token
        const originalToken = localStorage.getItem('token');
        localStorage.setItem('token', adminToken);
        localStorage.setItem('role', 'admin');

        this.api.exitImpersonation(adminId, this.userData._id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    alert('Exited impersonation. Returning to admin dashboard.');
                    sessionStorage.removeItem('adminToken');
                    this.router.navigate(['/']);
                }
            },
            error: (err: any) => {
                // Restore original token on error
                localStorage.setItem('token', originalToken || '');
                alert('Failed to exit impersonation: ' + (err.error?.message || 'Unknown error'));
            }
        });
    }

    private getAdminIdFromToken(token: string): string | null {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || payload.userId || null;
        } catch (e) {
            return null;
        }
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
        this.locationSearchQuery = '';
        this.filteredLocations = [];

        if (!this.availableLocations.length) {
            this.api.getLocations().subscribe({
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

        const locationPayload = {
            description: this.selectedLocation.location,
            city: this.selectedLocation.city,
            state: this.selectedLocation.state,
            country: this.selectedLocation.country || '',
            zipcode: null,
            type: this.selectedLocation.type || 'city',
            stateShort: this.selectedLocation.stateShort || '',
            zipcodes: []
        };

        this.api.addUserLocation(userId, locationPayload).subscribe({
            next: () => {
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

    // ─── Task Edit Modal Methods ──────────────────────────────────

    openTaskEditModal(category: any, task: any) {
        this.editingCategory = category;
        this.editingTask = task;
        this.taskEditModalOpen = true;

        const userId = this.userData?._id;
        if (!userId) return;

        // Set default price from task.price (enriched from Task model)
        this.editingTaskDefaultPrice = {
            lead: task.price?.lead ?? 0,
            call: task.price?.call ?? 0,
            appointment: task.price?.appointment ?? 0
        };

        this.loadTaskEditData(userId, category, task);
    }

    loadTaskEditData(userId: string, category: any, task: any) {
        // Fetch enriched task edit data from backend
        this.api.getTaskEditData(userId, category.categoryId, task.taskId).subscribe({
            next: (res: any) => {
                const data = res?.data;
                const defaultPrice = data?.defaultPrice || this.editingTaskDefaultPrice;
                const locationServiceAreas: any[] = data?.locationServiceAreas || [];
                const userLocations: any[] = data?.userLocations || [];
                const overrides: any[] = data?.overrides || [];
                const userServiceAreas: string[] = data?.userServiceAreas || [];
                const locationPrices: any[] = data?.locationPrices || [];

                this.editingTaskDefaultPrice = defaultPrice;
                this.locationPrices = locationPrices;

                // Build location price map for quick lookup: key = "city-state-type"
                const locationPriceMap = new Map<string, any>();
                locationPrices.forEach((lp: any) => {
                    const key = `${lp.city}-${lp.state}-${lp.type}`;
                    locationPriceMap.set(key, lp.price);
                });

                // Build zipcode entries from location service areas
                this.taskEditZipcodes = [];

                locationServiceAreas.forEach((loc: any) => {
                    const locZipcodes: string[] = loc.zipcodes || [];
                    const serviceAreaPrices: Record<string, any> = loc.serviceAreaPrices || {};

                    locZipcodes.forEach((zip: string) => {
                        // Check if user has excluded this zipcode
                        const isExcluded = (this.userData?.unselected_zipcodes || []).includes(zip);
                        if (isExcluded) return; // Skip excluded zipcodes

                        // Check for override first, then location serviceArea price, then default task price
                        const override = overrides.find(
                            (o: any) => o.zipcode === zip && o.taskId === task.taskId
                        );

                        const serviceAreaPrice = serviceAreaPrices[zip];

                        this.taskEditZipcodes.push({
                            locationId: loc.locationId,
                            location: loc.location || loc.city || zip,
                            city: loc.city || '',
                            state: loc.state || '',
                            type: loc.type || 'city',
                            stateShort: loc.stateShort || '',
                            zipcode: zip,
                            price: override?.price
                                || serviceAreaPrice
                                || defaultPrice,
                            editLead: override?.price?.lead ?? serviceAreaPrice?.lead ?? defaultPrice?.lead ?? 0,
                            editCall: override?.price?.call ?? serviceAreaPrice?.call ?? defaultPrice?.call ?? 0,
                            editAppointment: override?.price?.appointment ?? serviceAreaPrice?.appointment ?? defaultPrice?.appointment ?? 0,
                            hasOverride: !!override
                        });
                    });
                });

                // Add user locations that are NOT already in locationServiceAreas
                userLocations.forEach((loc: any) => {
                    const locZipcodes: string[] = loc.zipcodes || [];
                    // Only show zipcodes that match user's service areas
                    const matchingZips = locZipcodes.filter((z: string) => userServiceAreas.includes(z));

                    // Get location-level price for this location
                    const locKey = `${loc.city}-${loc.state}-${loc.type}`;
                    const locPrice = locationPriceMap.get(locKey);

                    matchingZips.forEach((zip: string) => {
                        // Check if user has excluded this zipcode
                        const isExcluded = (this.userData?.unselected_zipcodes || []).includes(zip);
                        if (isExcluded) return; // Skip excluded zipcodes

                        // Skip if already added from task-specific locations
                        const alreadyAdded = this.taskEditZipcodes.some((e: any) => e.zipcode === zip);
                        if (alreadyAdded) return;

                        const override = overrides.find(
                            (o: any) => o.zipcode === zip && o.taskId === task.taskId
                        );

                        this.taskEditZipcodes.push({
                            locationId: loc.locationId,
                            location: loc.location || loc.city || zip,
                            city: loc.city || '',
                            state: loc.state || '',
                            type: loc.type || 'city',
                            stateShort: loc.stateShort || '',
                            zipcode: zip,
                            price: override?.price || locPrice || defaultPrice,
                            editLead: override?.price?.lead ?? locPrice?.lead ?? defaultPrice?.lead ?? 0,
                            editCall: override?.price?.call ?? locPrice?.call ?? defaultPrice?.call ?? 0,
                            editAppointment: override?.price?.appointment ?? locPrice?.appointment ?? defaultPrice?.appointment ?? 0,
                            hasOverride: !!override
                        });
                    });
                });

                // Also include zipcodes from the task itself that may not have locations
                const taskZipcodes: string[] = task.zipcodes || [];
                taskZipcodes.forEach((zip: string) => {
                    // Skip if already added from locations
                    const alreadyAdded = this.taskEditZipcodes.some((e: any) => e.zipcode === zip);
                    if (alreadyAdded) return;

                    // Skip if excluded
                    const isExcluded = (this.userData?.unselected_zipcodes || []).includes(zip);
                    if (isExcluded) return;

                    const override = overrides.find(
                        (o: any) => o.zipcode === zip && o.taskId === task.taskId
                    );

                    const loc = this.findLocationByZipcode(zip);
                    const locKey = loc ? `${loc.city}-${loc.state}-${loc.type || 'city'}` : null;
                    const locPrice = locKey ? locationPriceMap.get(locKey) : null;

                    this.taskEditZipcodes.push({
                        locationId: loc?._id || '',
                        location: loc ? loc.description : zip,
                        city: loc?.city || '',
                        state: loc?.state || '',
                        type: loc?.type || 'zipcode',
                        stateShort: loc?.stateShort || '',
                        zipcode: zip,
                        price: override?.price || locPrice || defaultPrice,
                        editLead: override?.price?.lead ?? locPrice?.lead ?? defaultPrice?.lead ?? 0,
                        editCall: override?.price?.call ?? locPrice?.call ?? defaultPrice?.call ?? 0,
                        editAppointment: override?.price?.appointment ?? locPrice?.appointment ?? defaultPrice?.appointment ?? 0,
                        hasOverride: !!override
                    });
                });
                this.cdr.markForCheck();
            },
            error: err => {
                console.error('Failed to load task edit data', err);
                // Fallback: build from local data
                this.buildTaskEditZipcodesFallback(task, category);
            }
        });
    }

    buildTaskEditZipcodesFallback(task: any, category: any) {
        const defaultPrice = task.price || { lead: 0, call: 0, appointment: 0 };
        this.editingTaskDefaultPrice = defaultPrice;
        this.taskEditZipcodes = [];

        const taskZipcodes: string[] = task.zipcodes || [];
        taskZipcodes.forEach((zip: string) => {
            const isExcluded = (this.userData?.unselected_zipcodes || []).includes(zip);
            if (isExcluded) return;

            const override = this.zipcodeOverrides.find(
                (o: any) => o.taskId === task.taskId && o.zipcode === zip
            );
            const loc = this.findLocationByZipcode(zip);

            this.taskEditZipcodes.push({
                locationId: '',
                location: loc ? loc.description : zip,
                city: loc?.city || '',
                state: loc?.state || '',
                type: loc?.type || 'zipcode',
                stateShort: loc?.stateShort || '',
                zipcode: zip,
                price: override?.price || defaultPrice,
                editLead: override?.price?.lead ?? defaultPrice?.lead ?? 0,
                editCall: override?.price?.call ?? defaultPrice?.call ?? 0,
                editAppointment: override?.price?.appointment ?? defaultPrice?.appointment ?? 0,
                hasOverride: !!override
            });
        });
    }

    findLocationByZipcode(zipcode: string): any {
        const locations = this.userData?.locations || [];
        for (const loc of locations) {
            if (loc.zipcodes && Array.isArray(loc.zipcodes) && loc.zipcodes.includes(zipcode)) {
                return loc;
            }
        }
        return null;
    }

    closeTaskEditModal() {
        this.taskEditModalOpen = false;
        this.editingTask = null;
        this.editingCategory = null;
        this.editingTaskDefaultPrice = { lead: 0, call: 0, appointment: 0 };
        this.taskEditZipcodes = [];
    }

    saveLocationPriceOverride(zipEntry: any) {
        const userId = this.userData?._id;
        if (!userId || !this.editingTask || !this.editingCategory) return;

        const payload = {
            categoryId: this.editingCategory.categoryId,
            taskId: this.editingTask.taskId,
            zipcode: zipEntry.zipcode,
            price: {
                lead: Number(zipEntry.editLead) || 0,
                call: Number(zipEntry.editCall) || 0,
                appointment: Number(zipEntry.editAppointment) || 0
            }
        };

        this.api.saveZipcodePriceOverride(userId, payload).subscribe({
            next: () => {
                zipEntry.hasOverride = true;
                zipEntry.price = payload.price;
                // Update local zipcodeOverrides cache
                const existing = this.zipcodeOverrides.find(
                    (o: any) => o.taskId === payload.taskId && o.zipcode === payload.zipcode
                );
                if (existing) {
                    existing.price = payload.price;
                } else {
                    this.zipcodeOverrides.push({
                        _id: Date.now().toString(),
                        userId,
                        categoryId: payload.categoryId,
                        taskId: payload.taskId,
                        zipcode: payload.zipcode,
                        price: payload.price
                    });
                }

                alert('Price saved successfully');
                this.closeTaskEditModal();
                this.cdr.markForCheck();
            },
            error: err => {
                console.error('Failed to save location price override', err);
                alert('Unable to save price override');
            }
        });
    }

    // ─── LOCATION PRICE MODAL METHODS ───────────────────────────────

    openLocationPriceModal(location?: any) {
        // If location is provided with _id, it's editing existing location price
        // If location is provided without _id (like from table row), it's adding/editing based on city/state/type
        if (location && location._id) {
            // Editing existing location price record
            this.editingLocationPrice = {
                _id: location._id,
                city: location.city,
                state: location.state,
                stateShort: location.stateShort || '',
                type: location.type,
                price: location.price || { lead: 0, call: 0, appointment: 0 },
                selectedLocationId: null
            };
        } else if (location && location.city) {
            // Adding from an existing location (from UI like clicking a button in location table)
            const existing = this.locationPrices.find((lp: any) =>
                lp.city === location.city &&
                lp.state === location.state &&
                lp.type === location.type
            );

            this.editingLocationPrice = {
                _id: existing?._id || '',
                city: location.city,
                state: location.state,
                stateShort: location.stateShort || '',
                type: location.type,
                price: existing?.price || { lead: 0, call: 0, appointment: 0 },
                selectedLocationId: null
            };
        } else {
            // Adding new - start with empty selection
            this.editingLocationPrice = {
                _id: '',
                city: '',
                state: '',
                stateShort: '',
                type: 'city',
                price: { lead: 0, call: 0, appointment: 0 },
                selectedLocationId: ''
            };
        }

        this.locationPriceModalOpen = true;
    }

    closeLocationPriceModal() {
        this.locationPriceModalOpen = false;
        this.editingLocationPrice = null;
    }

    onLocationPriceLocationSelect(event: any) {
        const locationId = event.target.value;
        const location = this.userData?.locations?.find((loc: any) => loc._id === locationId);
        if (location) {
            this.editingLocationPrice.city = location.city;
            this.editingLocationPrice.state = location.state;
            this.editingLocationPrice.stateShort = location.stateShort || '';
            this.editingLocationPrice.type = location.type || 'city';
            
            // Check for existing location price and populate price fields
            const existingPrice = this.locationPrices.find((lp: any) =>
                lp.city === location.city &&
                lp.state === location.state &&
                lp.type === location.type
            );
            if (existingPrice && existingPrice.price) {
                this.editingLocationPrice.price = {
                    lead: existingPrice.price.lead ?? 0,
                    call: existingPrice.price.call ?? 0,
                    appointment: existingPrice.price.appointment ?? 0
                };
            } else {
                this.editingLocationPrice.price = { lead: 0, call: 0, appointment: 0 };
            }
        }
    }

    saveLocationPrice() {
        const userId = this.userData?._id;
        const { categoryId } = this.editingCategory;
        const { taskId } = this.editingTask;
        const { city, state, stateShort, type, price } = this.editingLocationPrice;

        if (!city || !state || !type) {
            alert('Location details are incomplete');
            return;
        }

        const payload = {
            categoryId,
            taskId,
            city,
            state,
            stateShort,
            type,
            price: {
                lead: Number(price.lead) || 0,
                call: Number(price.call) || 0,
                appointment: Number(price.appointment) || 0
            }
        };

        this.api.addOrUpdateLocationPrice(userId, payload).subscribe({
            next: (res: any) => {
                // Update local locationPrices list
                const existingIndex = this.locationPrices.findIndex((lp: any) =>
                    lp.city === city && lp.state === state && lp.type === type
                );

                const newLP = res?.data || { ...payload, _id: Date.now().toString() };

                if (existingIndex > -1) {
                    this.locationPrices[existingIndex] = newLP;
                } else {
                    this.locationPrices.push(newLP);
                }

                this.closeLocationPriceModal();
                alert('Location price saved successfully');

                // Reload task edit data to refresh effective prices
                this.loadTaskEditData(userId, this.editingCategory, this.editingTask);

                // Close the main Task Edit Modal after saving
                this.closeTaskEditModal();
            },
            error: err => {
                console.error('Failed to save location price', err);
                alert('Unable to save location price');
            }
        });
    }

    deleteLocationPriceById(locationPriceId: string) {
        if (!confirm('Delete this location price?')) return;

        const userId = this.userData?._id;
        if (!userId) return;

        this.api.deleteLocationPrice(userId, locationPriceId).subscribe({
            next: () => {
                this.locationPrices = this.locationPrices.filter((lp: any) => lp._id !== locationPriceId);
                alert('Location price deleted');

                // Reload task edit data to refresh effective prices
                this.loadTaskEditData(userId, this.editingCategory, this.editingTask);
            },
            error: err => {
                console.error('Failed to delete location price', err);
                alert('Unable to delete location price');
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
        this.cdr.markForCheck();
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