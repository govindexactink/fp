import { Routes } from '@angular/router';
import { Categories } from './modules/categories/categories';
import { AddTask } from './modules/add-task/add-task';
// import { EditTask } from './modules/add-task/edit-task';
import { EditTask } from './modules/add-task/edit-task';
import { Login } from './modules/login/login';
import { Signup } from './modules/signup/signup';
import { authGuard } from './auth.guard';
import { noAuthGuard } from './no-auth.guard';
import { User } from './modules/user/user';
import { AdminUsers } from './modules/admin-users/admin-users';
import { AddCategory } from './modules/add-category/add-category';

export const routes: Routes = [
    {
        path: 'categories',
        component: Categories,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'add-category',
        component: AddCategory,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'add-task',
        component: AddTask,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'edit-task/:taskId/:categoryId',
        component: EditTask,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin-users',
        component: AdminUsers,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },

    // ✅ USER ROUTE
    {
        path: 'user',
        component: User,
        canActivate: [authGuard],
        data: { role: 'user' }
    },

    // AUTH
    { path: 'login', component: Login, canActivate: [noAuthGuard] },
    { path: 'register', component: Signup, canActivate: [noAuthGuard] },

    // DEFAULT REDIRECT
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];