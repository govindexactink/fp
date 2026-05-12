const express = require("express");
const userRouter = express.Router();
const ctrl = require("../controller/user");
const { protect, adminOnly } = require("../middleware/auth");

// ─── AUTH ROUTES ─────────────────────────────────────────────────
// POST /api/users/register
// POST /api/users/login
userRouter.post("/register", ctrl.register);
userRouter.post("/login", ctrl.login);

// ─── ADMIN ROUTES ──────────────────────────────────────────────────
// POST /api/users/admin/login
userRouter.post("/admin/login", ctrl.adminLogin);
// POST /api/users/:adminId/impersonate/:userId
userRouter.post("/:adminId/impersonate/:userId", protect, adminOnly, ctrl.impersonateUser);
// DELETE /api/users/:adminId/exit-impersonation/:userId
userRouter.delete("/:adminId/exit-impersonation/:userId", protect, adminOnly, ctrl.exitImpersonation);
// GET /api/users/locked-users
userRouter.get("/locked-users", protect, adminOnly, ctrl.getLockedUsers);

// GET /api/users/profile (current user)
userRouter.get("/profile", protect, ctrl.getProfile);

// ─── USER ROUTES ──────────────────────────────────────────────────
// GET    /api/users/
// GET    /api/users/:userId
// PUT    /api/users/:userId
// PUT /api/users/:userId/status
// DELETE /api/users/:userId
userRouter.get("/", protect, ctrl.getAllUsers);
userRouter.get("/:userId/task-edit-data", protect, ctrl.getTaskEditData);
userRouter.get("/:userId", protect, ctrl.getUserById);
userRouter.put("/:userId", protect, ctrl.updateUser);
userRouter.put("/:userId/unselected-zipcodes", protect, ctrl.updateUnselectedZipcodes);
userRouter.put("/:userId/status", protect, ctrl.updateUserStatus);
userRouter.delete("/:userId", protect, ctrl.deleteUser);

// ─── SERVICE ROUTES ──────────────────────────────────────────────
// POST   /api/users/:userId/services
// PUT    /api/users/:userId/services/:serviceId
// DELETE /api/users/:userId/services/:serviceId
userRouter.post("/:userId/services", protect, ctrl.addService);
userRouter.put("/:userId/services/:serviceId", protect, ctrl.updateService);
userRouter.delete("/:userId/services/:serviceId", protect, ctrl.deleteService);

// ─── CATEGORY ROUTES ─────────────────────────────────────────────
// POST   /api/users/:userId/services/:serviceId/categories
// PUT    /api/users/:userId/services/:serviceId/categories/:categoryId
// DELETE /api/users/:userId/services/:serviceId/categories/:categoryId
userRouter.post("/:userId/services/:serviceId/categories", protect, ctrl.addCategory);
userRouter.put("/:userId/services/:serviceId/categories/:categoryId", protect, ctrl.updateCategory);
userRouter.delete("/:userId/services/:serviceId/categories/:categoryId", protect, ctrl.deleteCategory);

// ─── TASK ROUTES ─────────────────────────────────────────────────
// POST   /api/users/:userId/services/:serviceId/categories/:categoryId/tasks
// PUT    /api/users/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId
// PATCH  /api/users/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId/toggle
// DELETE /api/users/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId
userRouter.post("/:userId/services/:serviceId/categories/:categoryId/tasks", protect, ctrl.addTask);
userRouter.put("/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId", protect, ctrl.updateTask);
userRouter.patch("/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId/toggle", protect, ctrl.toggleTaskChecked);
userRouter.delete("/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId", protect, ctrl.deleteTask);

// ─── FILTER ROUTES ───────────────────────────────────────────────
// POST   .../tasks/:taskId/filters
// PUT    .../tasks/:taskId/filters/:filterId
// PATCH  .../tasks/:taskId/filters/:filterId/toggle
// DELETE .../tasks/:taskId/filters/:filterId
const taskBase = "/:userId/services/:serviceId/categories/:categoryId/tasks/:taskId/filters";
userRouter.post(taskBase, protect, ctrl.addFilter);
userRouter.put(`${taskBase}/:filterId`, protect, ctrl.updateFilter);
userRouter.patch(`${taskBase}/:filterId/toggle`, protect, ctrl.toggleFilterChecked);
userRouter.delete(`${taskBase}/:filterId`, protect, ctrl.deleteFilter);

// ─── LOCATION ROUTES ─────────────────────────────────────────────
// POST   /api/users/:userId/locations
// PUT    /api/users/:userId/locations/:locationId
// DELETE /api/users/:userId/locations/:locationId
userRouter.post("/:userId/locations", protect, ctrl.addLocation);
userRouter.put("/:userId/locations/:locationId", protect, ctrl.updateLocation);
userRouter.delete("/:userId/locations/:locationId", protect, ctrl.deleteLocation);

// ─── OVERLAY / OVERRIDE ROUTES ───────────────────────────────────
// GET /api/users/:userId/zipcode-prices
// POST /api/users/:userId/zipcode-prices
// DELETE /api/users/:userId/zipcode-prices/:overrideId
userRouter.get("/:userId/zipcode-prices", protect, ctrl.getZipcodePriceOverrides);
userRouter.post("/:userId/zipcode-prices", protect, ctrl.addZipcodePriceOverride);
userRouter.delete("/:userId/zipcode-prices/:overrideId", protect, ctrl.deleteZipcodePriceOverride);

// ─── LOCATION PRICE ROUTES ────────────────────────────────────────
// GET /api/users/:userId/location-prices
// POST /api/users/:userId/location-prices
// DELETE /api/users/:userId/location-prices/:locationPriceId
userRouter.get("/:userId/location-prices", protect, ctrl.getLocationPrices);
userRouter.post("/:userId/location-prices", protect, ctrl.addOrUpdateLocationPrice);
userRouter.delete("/:userId/location-prices/:locationPriceId", protect, ctrl.deleteLocationPrice);

// ─── QUERY ROUTES ────────────────────────────────────────────────
// GET /api/users/:userId/checked-tasks
// GET /api/users/:userId/total-price
userRouter.get("/:userId/checked-tasks", protect, ctrl.getCheckedTasksWithFilters);
userRouter.get("/:userId/total-price", protect, ctrl.getTotalPrice);

module.exports = userRouter;
