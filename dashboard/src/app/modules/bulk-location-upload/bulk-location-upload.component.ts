import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';

@Component({
    selector: 'app-bulk-location-upload',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bulk-location-upload.component.html',
    styleUrls: ['./bulk-location-upload.component.css']
})
export class BulkLocationUploadComponent implements OnInit {
    userData: any = null;
    loadingUser = true;
    availableLocations: any[] = [];
    locationsLoaded = false;

    locationsText = '';
    restrictedLocationsText = '';
    restrictedLocations: string[] = [];

    processedLocations: any[] = [];

    showProcessedList = false;
    processing = false;
    processError = '';
    processSuccess = '';

    locationModal = false;

    @Output() onClose = new EventEmitter<void>();

    constructor(private api: Api, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.loadUserData();
        this.loadLocations();
        this.cdr.markForCheck();
    }

    loadUserData() {
        this.loadingUser = true;
        this.api.getUserProfile().subscribe({
            next: (res: any) => {
                this.userData = res?.data || {};
                if (!Array.isArray(this.userData.locations)) {
                    this.userData.locations = [];
                }
                if (!Array.isArray(this.userData.service_areas_zipcodes)) {
                    this.userData.service_areas_zipcodes = [];
                }
                this.loadingUser = false;
            },
            error: err => {
                console.error('Failed to load user data', err);
                this.loadingUser = false;
            }
        });
    }

    loadLocations() {
        if (this.locationsLoaded) return;
        this.api.getLocations().subscribe({
            next: (res: any[]) => {
                this.availableLocations = res || [];
                this.locationsLoaded = true;
            },
            error: err => {
                console.error('Failed to load locations', err);
                this.locationsLoaded = true;
            }
        });
    }

    processLocations() {
        this.processError = '';
        this.processSuccess = '';
        this.processedLocations = [];
        this.showProcessedList = false;

        if (!this.locationsText?.trim()) {
            this.processError = 'Please enter at least one location.';
            return;
        }

        const lines = this.locationsText.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line);

        this.restrictedLocations = this.restrictedLocationsText
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter((line: string) => line)
            .map((loc: string) => loc.toLowerCase());

        const userLocationsMap = new Map<string, any>();
        this.userData.locations.forEach((loc: any) => {
            userLocationsMap.set(loc.description.toLowerCase(), loc);
        });

        let skippedExistingCount = 0;

        lines.forEach((input: string) => {
            const inputLower = input.toLowerCase();

            if (this.restrictedLocations.includes(inputLower)) {
                return;
            }

            // Match by location name, city, state, or stateShort (case-insensitive)
            const matches = this.availableLocations.filter(avail =>
                avail.location?.toLowerCase().includes(inputLower) ||
                avail.city?.toLowerCase().includes(inputLower) ||
                avail.state?.toLowerCase().includes(inputLower) ||
                avail.stateShort?.toLowerCase().includes(inputLower)
            );

            matches.forEach(match => {
                const matchDesc = match.location?.toLowerCase();
                const existingUserLoc = userLocationsMap.get(matchDesc);

                // Skip locations already in user's profile
                if (existingUserLoc) {
                    skippedExistingCount++;
                    return;
                }

                this.processedLocations.push({
                    location: match.location,
                    city: match.city,
                    state: match.state,
                    stateShort: match.stateShort,
                    type: match.type,
                    checkedInclude: false,
                    checkedExclude: false,
                    isExisting: false
                });
            });

            if (matches.length === 0) {
                console.warn(`Location not found: "${input}"`);
            }
        });

        if (this.processedLocations.length === 0) {
            if (skippedExistingCount > 0) {
                this.processError = `All entered locations (${skippedExistingCount}) already exist in your profile. No new locations to add.`;
            } else {
                this.processError = 'No locations found. Try area names (Downtown, Capitol Hill) or city/state names.';
            }
        } else {
            this.processSuccess = `Found ${this.processedLocations.length} new locations to add. ${skippedExistingCount} existing location(s) skipped.`;
            this.showProcessedList = true;
        }
    }

    toggleIncludeAll() {
        const newLocations = this.processedLocations.filter(loc => !loc.isExisting);
        const includeAll = newLocations.every(loc => loc.checkedInclude);
        newLocations.forEach(loc => {
            loc.checkedInclude = !includeAll;
            if (!includeAll) {
                loc.checkedExclude = false;
            }
        });
    }

    toggleExcludeAll() {
        const existingLocations = this.processedLocations.filter(loc => loc.isExisting);
        const excludeAll = existingLocations.every(loc => loc.checkedExclude);
        existingLocations.forEach(loc => {
            loc.checkedExclude = !excludeAll;
            if (!excludeAll) {
                loc.checkedInclude = false;
            }
        });
    }

    onIncludeChange(loc: any) {
        if (loc.checkedInclude) {
            loc.checkedExclude = false;
        }
    }

    onExcludeChange(loc: any) {
        if (loc.checkedExclude) {
            loc.checkedInclude = false;
        }
    }

    get allIncluded(): boolean {
        const newLocations = this.processedLocations.filter(loc => !loc.isExisting);
        if (newLocations.length === 0) return true;
        return newLocations.every(loc => loc.checkedInclude);
    }

    get allExcluded(): boolean {
        const existingLocations = this.processedLocations.filter(loc => loc.isExisting);
        if (existingLocations.length === 0) return true;
        return existingLocations.every(loc => loc.checkedExclude);
    }

    saveLocations() {
        if (!this.userData?._id) {
            this.processError = 'User data not available.';
            return;
        }

        const locationsToAdd = this.processedLocations.filter(loc => loc.checkedInclude && !loc.checkedExclude && !loc.isExisting);
        const locationsToRemove = this.processedLocations.filter(loc => loc.checkedExclude && loc.isExisting);
        const locationsToExclude = this.processedLocations.filter(loc => loc.checkedExclude && !loc.isExisting);

        if (locationsToAdd.length === 0 && locationsToRemove.length === 0 && locationsToExclude.length === 0) {
            this.processError = 'Please select at least one location to add, exclude, or remove.';
            return;
        }

        this.processing = true;

        // Build excluded locations array (jo uncheck kiye hain)
        const excludedLocationsArray = locationsToExclude.map(loc => ({
            location: loc.location,
            city: loc.city,
            state: loc.state,
            country: '',
            type: loc.type || 'city',
            stateShort: loc.stateShort
        }));

        // Handle additions in bulk
        if (locationsToAdd.length > 0) {
            const bulkPayload = {
                locations: locationsToAdd.map(loc => ({
                    location: loc.location,
                    city: loc.city,
                    state: loc.state,
                    country: '',
                    type: loc.type || 'city',
                    stateShort: loc.stateShort
                })),
                // ✅ Excluded locations add ho rahe hain payload mein
                excludedLocations: excludedLocationsArray
            };

            console.log('Bulk Add Payload with Excluded:', bulkPayload);

            this.api.addBulkUserLocations(this.userData._id, bulkPayload).subscribe({
                next: (res: any) => {
                    console.log('Bulk locations added:', res);
                    // Continue with removals if any
                    if (locationsToRemove.length > 0) {
                        this.processRemovals(locationsToRemove);
                    } else {
                        this.finishSave();
                    }
                },
                error: err => {
                    console.error('Failed to add bulk locations', err);
                    this.processError = err?.error?.message || 'Failed to add locations.';
                    this.processing = false;
                }
            });
        } else {
            // Only removals or only exclusions (without additions)
            if (locationsToExclude.length > 0) {
                const excludePayload = {
                    excludedLocations: excludedLocationsArray
                };
                console.log('Exclude Only Payload:', excludePayload);
                // Agar sirf exclude karna hai to API call karo (optional)
            }

            if (locationsToRemove.length > 0) {
                this.processRemovals(locationsToRemove);
            } else {
                // Sirf exclude karna tha
                this.finishSave();
            }
        }
    }

    private processRemovals(locationsToRemove: any[]) {
        let completed = 0;
        const total = locationsToRemove.length;

        if (total === 0) {
            this.finishSave();
            return;
        }

        locationsToRemove.forEach(loc => {
            this.removeSingleLocation(loc).then(() => {
                completed++;
                if (completed === total) {
                    this.finishSave();
                }
            }).catch(err => {
                console.error('Failed to remove location', err);
                completed++;
                if (completed === total) {
                    this.finishSave();
                }
            });
        });
    }

    private finishSave() {
        this.processing = false;
        this.processSuccess = 'Changes saved successfully.';
        this.onClose.emit();
    }

    private addSingleLocation(location: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const userId = this.userData._id;
            const locationPayload = {
                description: location.location,
                city: location.city,
                state: location.state,
                country: '',
                zipcode: null,
                type: location.type,
                stateShort: location.stateShort,
                zipcodes: []
            };

            this.api.addUserLocation(userId, locationPayload).subscribe({
                next: () => {
                    this.addZipcodesToServiceArea(location, userId).subscribe({
                        next: (res: any) => {
                            const first = Array.isArray(res?.data) ? res.data[0] : null;
                            const zipcodes: string[] = Array.isArray(first?.zipcodes) ? first.zipcodes : [];
                            if (zipcodes.length > 0) {
                                const currentZipcodes = this.userData.service_areas_zipcodes || [];
                                const newZipcodes = [...new Set([...currentZipcodes, ...zipcodes])];
                                this.api.updateUser(userId, { service_areas_zipcodes: newZipcodes }).subscribe({
                                    next: () => resolve(),
                                    error: err => reject(err)
                                });
                            } else {
                                resolve();
                            }
                        },
                        error: err => reject(err)
                    });
                },
                error: err => reject(err)
            });
        });
    }

    private removeSingleLocation(location: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const userId = this.userData._id;
            const locationId = location.locationId;

            if (!locationId) {
                console.error('Cannot remove location: missing location ID');
                resolve();
                return;
            }

            this.api.deleteUserLocation(userId, locationId).subscribe({
                next: () => {
                    this.removeZipcodesFromServiceArea(location, userId).then(() => resolve()).catch(err => reject(err));
                },
                error: err => reject(err)
            });
        });
    }

    private removeZipcodesFromServiceArea(location: any, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const locationKey = `${location.location}|${location.city}|${location.state}|${location.type}`.toLowerCase();
            const matchingLocations = this.availableLocations.filter(avail => {
                const availKey = `${avail.location}|${avail.city}|${avail.state}|${avail.type}`.toLowerCase();
                return availKey === locationKey;
            });

            const zipcodesToRemove = matchingLocations.flatMap(loc => loc.zipcodes || []);

            if (zipcodesToRemove.length === 0) {
                resolve();
                return;
            }

            const currentZipcodes = this.userData.service_areas_zipcodes || [];
            const newZipcodes = currentZipcodes.filter((z: string) => !zipcodesToRemove.includes(z));

            this.api.updateUser(userId, { service_areas_zipcodes: newZipcodes }).subscribe({
                next: () => {
                    // Update local userData to reflect change immediately
                    this.userData.service_areas_zipcodes = newZipcodes;
                    resolve();
                },
                error: err => reject(err)
            });
        });
    }

    private addZipcodesToServiceArea(location: any, userId: string) {
        const payload = [{
            location: location.location,
            city: location.city,
            state: location.state,
            stateShort: location.stateShort,
            type: location.type || 'city' || 'state',
            lead: 0,
            call: 0,
            appointment: 0
        }];

        return this.api.sendLocation(payload).pipe(
            // Convert the observable to a promise and handle zipcodes merging
            // Actually sendLocation returns Observable, we'll subscribe in addSingleLocation
            // This method just returns the observable so the caller can handle the response
        );
    }

    clearForm() {
        this.locationsText = '';
        this.restrictedLocationsText = '';
        this.processedLocations = [];
        this.showProcessedList = false;
        this.processError = '';
        this.processSuccess = '';
    }

    closeModal() {
        this.onClose.emit();
    }
}
