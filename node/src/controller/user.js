const userService = require("../services/userService");
const globle = require("../utils/index");

// const globle.sendResponse = (res, status, message, data = null) => {
//   const payload = { success: status < 400, message };
//   if (data !== null) payload.data = data;
//   res.status(status).json(payload);
// };

// const asyncHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch((err) => {
//     const status = err.status || 500;
//     const message = err.message || "Internal Server Error";
//     globle.sendResponse(res, status, message);
//   });
// };

// ─── AUTH ────────────────────────────────────────────────────────

exports.register = globle.asyncHandler(async (req, res) => {
  const result = await userService.registerUser(req.body);
  globle.sendResponse(res, 201, "User registered successfully", result);
});

exports.login = globle.asyncHandler(async (req, res) => {
  const result = await userService.loginUser(req.body);
  globle.sendResponse(res, 200, "Login successful", result);
});

// exports.getProfile = (req, res) => {
//   console.log("req.user", req.user);
//   globle.sendResponse(res, 200, "Profile fetched", req.user);
// };

exports.getProfile = globle.asyncHandler(async (req, res) => {
  console.log("req.userId", req.user);
  const user = await userService.getUserById(req.user);
  globle.sendResponse(res, 200, "Profile fetched", user);
});

// ─── USERS ───────────────────────────────────────────────────────

exports.getAllUsers = globle.asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  globle.sendResponse(res, 200, "Users fetched", users);
});

exports.getUserById = globle.asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  globle.sendResponse(res, 200, "User fetched", user);
});

exports.updateUser = globle.asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.userId, req.body);
  globle.sendResponse(res, 200, "User updated", user);
});

exports.updateUnselectedZipcodes = globle.asyncHandler(async (req, res) => {
  const user = await userService.updateUnselectedZipcodes(req.params.userId, req.body);
  globle.sendResponse(res, 200, "Unselected zipcodes updated", user);
});

exports.deleteUser = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.userId);
  globle.sendResponse(res, 200, result.message);
});

exports.updateUserStatus = globle.asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await userService.updateUserStatus(req.params.userId, status);
  globle.sendResponse(res, 200, `User status updated to ${status}`, user);
});

// ─── SERVICES ────────────────────────────────────────────────────

exports.addService = globle.asyncHandler(async (req, res) => {
  const service = await userService.addService(req.params.userId, req.body);
  globle.sendResponse(res, 201, "Service added", service);
});

exports.updateService = globle.asyncHandler(async (req, res) => {
  const service = await userService.updateService(req.params.userId, req.params.serviceId, req.body);
  globle.sendResponse(res, 200, "Service updated", service);
});

exports.deleteService = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteService(req.params.userId, req.params.serviceId);
  globle.sendResponse(res, 200, result.message);
});

// ─── CATEGORIES ──────────────────────────────────────────────────

exports.addCategory = globle.asyncHandler(async (req, res) => {
  const category = await userService.addCategory(req.params.userId, req.params.serviceId, req.body);
  globle.sendResponse(res, 201, "Category added", category);
});

exports.updateCategory = globle.asyncHandler(async (req, res) => {
  const category = await userService.updateCategory(
    req.params.userId, req.params.serviceId, req.params.categoryId, req.body
  );
  globle.sendResponse(res, 200, "Category updated", category);
});

exports.deleteCategory = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteCategory(
    req.params.userId, req.params.serviceId, req.params.categoryId
  );
  globle.sendResponse(res, 200, result.message);
});

// ─── TASKS ───────────────────────────────────────────────────────

exports.addTask = globle.asyncHandler(async (req, res) => {
  const task = await userService.addTask(
    req.params.userId, req.params.serviceId, req.params.categoryId, req.body
  );
  globle.sendResponse(res, 201, "Task added", task);
});

exports.updateTask = globle.asyncHandler(async (req, res) => {
  const task = await userService.updateTask(
    req.params.userId, req.params.serviceId, req.params.categoryId, req.params.taskId, req.body
  );
  globle.sendResponse(res, 200, "Task updated", task);
});

exports.toggleTaskChecked = globle.asyncHandler(async (req, res) => {
  const task = await userService.toggleTaskChecked(
    req.params.userId, req.params.serviceId, req.params.categoryId, req.params.taskId
  );
  globle.sendResponse(res, 200, `Task ${task.isChecked ? "checked" : "unchecked"}`, task);
});

exports.deleteTask = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteTask(
    req.params.userId, req.params.serviceId, req.params.categoryId, req.params.taskId
  );
  globle.sendResponse(res, 200, result.message);
});

// ─── FILTERS ─────────────────────────────────────────────────────

exports.addFilter = globle.asyncHandler(async (req, res) => {
  const filter = await userService.addFilter(
    req.params.userId, req.params.serviceId, req.params.categoryId, req.params.taskId, req.body
  );
  globle.sendResponse(res, 201, "Filter added", filter);
});

exports.updateFilter = globle.asyncHandler(async (req, res) => {
  const filter = await userService.updateFilter(
    req.params.userId, req.params.serviceId, req.params.categoryId,
    req.params.taskId, req.params.filterId, req.body
  );
  globle.sendResponse(res, 200, "Filter updated", filter);
});

exports.toggleFilterChecked = globle.asyncHandler(async (req, res) => {
  const filter = await userService.toggleFilterChecked(
    req.params.userId, req.params.serviceId, req.params.categoryId,
    req.params.taskId, req.params.filterId
  );
  globle.sendResponse(res, 200, `Filter ${filter.isChecked ? "checked" : "unchecked"}`, filter);
});

exports.deleteFilter = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteFilter(
    req.params.userId, req.params.serviceId, req.params.categoryId,
    req.params.taskId, req.params.filterId
  );
  globle.sendResponse(res, 200, result.message);
});

// ─── LOCATIONS ───────────────────────────────────────────────────

exports.addLocation = globle.asyncHandler(async (req, res) => {
  const location = await userService.addLocation(req.params.userId, req.body);
  globle.sendResponse(res, 201, "Location added", location);
});

exports.updateLocation = globle.asyncHandler(async (req, res) => {
  const location = await userService.updateLocation(
    req.params.userId, req.params.locationId, req.body
  );
  globle.sendResponse(res, 200, "Location updated", location);
});

exports.deleteLocation = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteLocation(req.params.userId, req.params.locationId);
  globle.sendResponse(res, 200, result.message);
});
exports.addZipcodePriceOverride = globle.asyncHandler(async (req, res) => {
  const result = await userService.addOrUpdateZipcodePriceOverride(req.params.userId, req.body);
  globle.sendResponse(res, 201, 'Zipcode override saved', result);
});

exports.getZipcodePriceOverrides = globle.asyncHandler(async (req, res) => {
  const filter = {
    categoryId: req.query.categoryId,
    taskId: req.query.taskId,
    zipcode: req.query.zipcode
  };
  Object.keys(filter).forEach(key => filter[key] == null && delete filter[key]);
  const result = await userService.getZipcodePriceOverrides(req.params.userId, filter);
  globle.sendResponse(res, 200, 'Zipcode overrides fetched', result);
});

exports.deleteZipcodePriceOverride = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteZipcodePriceOverride(req.params.userId, req.params.overrideId);
  globle.sendResponse(res, 200, result.message);
});

exports.addOrUpdateLocationPrice = globle.asyncHandler(async (req, res) => {
  const result = await userService.addOrUpdateLocationPrice(req.params.userId, req.body);
  globle.sendResponse(res, 201, 'Location price saved', result);
});

exports.getLocationPrices = globle.asyncHandler(async (req, res) => {
  const filter = {
    categoryId: req.query.categoryId,
    taskId: req.query.taskId,
    city: req.query.city,
    state: req.query.state,
    type: req.query.type
  };
  Object.keys(filter).forEach(key => filter[key] == null && delete filter[key]);
  const result = await userService.getLocationPrices(req.params.userId, filter);
  globle.sendResponse(res, 200, 'Location prices fetched', result);
});

exports.addOrUpdateLocationPrice = globle.asyncHandler(async (req, res) => {
  const result = await userService.addOrUpdateLocationPrice(req.params.userId, req.body);
  globle.sendResponse(res, 201, 'Location price saved', result);
});

exports.deleteLocationPrice = globle.asyncHandler(async (req, res) => {
  const result = await userService.deleteLocationPrice(req.params.userId, req.params.locationPriceId);
  globle.sendResponse(res, 200, result.message);
});

exports.getTaskEditData = globle.asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { categoryId, taskId } = req.query;
  const data = await userService.getTaskEditData(userId, categoryId, taskId);
  globle.sendResponse(res, 200, "Task edit data fetched", data);
});

// ─── ADMIN SERVICES ───────────────────────────────────────────────

exports.adminLogin = globle.asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await userService.adminLogin({ email, password });
  globle.sendResponse(res, 200, "Admin login successful", result);
});

exports.impersonateUser = globle.asyncHandler(async (req, res) => {
  const adminId = req.user; // from auth middleware (protect sets req.user)
  const { userId } = req.params;
  const result = await userService.impersonateUser(adminId, userId);
  globle.sendResponse(res, 200, "User impersonation started", result);
});

exports.exitImpersonation = globle.asyncHandler(async (req, res) => {
  const adminId = req.user;
  const { userId } = req.params;
  const result = await userService.exitImpersonation(userId, adminId);
  globle.sendResponse(res, 200, result.message);
});

exports.getLockedUsers = globle.asyncHandler(async (req, res) => {
  const result = await userService.getLockedUsers();
  globle.sendResponse(res, 200, 'Locked users fetched', result);
});

// ─── QUERY ───────────────────────────────────────────────────────

exports.getCheckedTasksWithFilters = globle.asyncHandler(async (req, res) => {
  const data = await userService.getCheckedTasksWithFilters(req.params.userId);
  globle.sendResponse(res, 200, "Checked tasks fetched", data);
});

exports.getTotalPrice = globle.asyncHandler(async (req, res) => {
  const data = await userService.getTotalPrice(req.params.userId);
  globle.sendResponse(res, 200, "Total price calculated", data);
});
