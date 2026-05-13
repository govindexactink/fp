import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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

    constructor(private api: Api) { }

    ngOnInit() {
        this.loadUserData();
        this.loadLocations();
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

        lines.forEach((input: string) => {
            const inputLower = input.toLowerCase();

            if (this.restrictedLocations.includes(inputLower)) {
                return;
            }

            let matches = this.availableLocations.filter(avail =>
                avail.location?.toLowerCase() === inputLower
            );

            if (matches.length === 0) {
                matches = this.availableLocations.filter(avail =>
                    avail.city?.toLowerCase() === inputLower
                );
            }

            if (matches.length === 0) {
                matches = this.availableLocations.filter(avail =>
                    avail.state?.toLowerCase() === inputLower ||
                    avail.stateShort?.toLowerCase() === inputLower
                );
            }

            matches.forEach(match => {
                const matchDesc = match.location?.toLowerCase();
                const existingUserLoc = userLocationsMap.get(matchDesc);

                if (existingUserLoc) {
                    this.processedLocations.push({
                        location: match.location,
                        city: match.city,
                        state: match.state,
                        stateShort: match.stateShort,
                        type: match.type,
                        checkedInclude: false,
                        checkedExclude: false,
                        isExisting: true,
                        locationId: existingUserLoc._id
                    });
                } else {
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
                }
            });

            if (matches.length === 0) {
                console.warn(`Location not found: "${input}"`);
            }
        });

        if (this.processedLocations.length === 0) {
            this.processError = 'No locations found. Try area names (Downtown, Capitol Hill) or city/state names.';
        } else {
            const newCount = this.processedLocations.filter(l => !l.isExisting).length;
            const existingCount = this.processedLocations.filter(l => l.isExisting).length;
            this.processSuccess = `Found ${this.processedLocations.length} locations: ${newCount} new, ${existingCount} existing.`;
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

        if (locationsToAdd.length === 0 && locationsToRemove.length === 0) {
            this.processError = 'Please select at least one location to add or remove.';
            return;
        }

        this.processing = true;
        let totalOperations = locationsToAdd.length + locationsToRemove.length;
        let completedOperations = 0;

        const checkComplete = () => {
            completedOperations++;
            if (completedOperations === totalOperations) {
                this.finishSave();
            }
        };

        locationsToAdd.forEach(loc => {
            this.addSingleLocation(loc).then(() => checkComplete()).catch(err => {
                console.error('Failed to add location', err);
                checkComplete();
            });
        });

        locationsToRemove.forEach(loc => {
            this.removeSingleLocation(loc).then(() => checkComplete()).catch(err => {
                console.error('Failed to remove location', err);
                checkComplete();
            });
        });

        if (totalOperations === 0) {
            this.finishSave();
        }
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
            type: location.type || 'city',
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
