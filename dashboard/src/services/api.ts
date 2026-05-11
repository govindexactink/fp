import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
   providedIn: 'root',
})
export class Api {
   private baseUrl = 'http://localhost:3000/v1';

   constructor(private http: HttpClient) { }

   private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
   }

   getCategories(): Observable<any> {
      return this.http.get(`${this.baseUrl}/category/getAll`);
   }

   addCategory(data: any): Observable<any> {
      return this.http.post(`${this.baseUrl}/category/add`, data);
   }

   daleteCategories(id: any): Observable<any> {
      return this.http.delete(`${this.baseUrl}/category/delete/${id}`);
   }

   getTasks(): Observable<any> {
      return this.http.get(`${this.baseUrl}/task/getAll`);
   }

   getTaskById(id: string, categoryId?: string): Observable<any> {
      const options = categoryId ? { headers: { categoryid: categoryId } } : {};
      return this.http.get(`${this.baseUrl}/task/get/${id}`, options);
   }

   addTask(data: any): Observable<any> {
      return this.http.post(`${this.baseUrl}/task/add`, data);
   }

   deleteTask(id: string): Observable<any> {
      return this.http.delete(`${this.baseUrl}/task/delete/${id}`);
   }

   updateTask(id: string, data: any): Observable<any> {
      return this.http.put(`${this.baseUrl}/task/update/${id}`, data);
   }

   updateLocationServiceArea(id: string, data: any): Observable<any> {
      return this.http.put(`${this.baseUrl}/task/update-service-area/${id}`, data);
   }

   addLocationsToTask(id: string, data: any): Observable<any> {
      return this.http.put(`${this.baseUrl}/task/add-locations/${id}`, data);
   }

   deleteLocationFromTask(id: string, data: any): Observable<any> {
      return this.http.delete(`${this.baseUrl}/task/delete-location/${id}`, { body: data });
   }

   getLocations() {
      return this.http.get<any[]>('assets/locations.json');
   }

   sendLocation(data: any) {
      return this.http.post(`${this.baseUrl}/task/location`, data);
   }

   registerUser(data: any) {
      return this.http.post(`${this.baseUrl}/user/register`, data);
   }

   loginUser(data: any) {
      return this.http.post(`${this.baseUrl}/user/login`, data);
   }

   getUserProfile(): Observable<any> {
      return this.http.get(`${this.baseUrl}/user/profile`, {
         headers: this.getAuthHeaders()
      });
   }

   getAllUsers(): Observable<any> {
      return this.http.get(`${this.baseUrl}/user`, {
         headers: this.getAuthHeaders()
      });
   }

   getUserById(userId: string): Observable<any> {
      return this.http.get(`${this.baseUrl}/user/${userId}`, {
         headers: this.getAuthHeaders()
      });
   }

   updateUserStatus(userId: string, status: string): Observable<any> {
      return this.http.put(`${this.baseUrl}/user/${userId}/status`, { status }, {
         headers: this.getAuthHeaders()
      });
   }

   deleteUser(userId: string): Observable<any> {
      return this.http.delete(`${this.baseUrl}/user/${userId}`, {
         headers: this.getAuthHeaders()
      });
   }
}
