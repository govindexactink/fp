const User = require("../model/userModel");
const ZipcodeOverride = require("../model/zipcodePriceOverrideModel");
const LocationPrice = require("../model/locationPriceModel");
const Task = require("../model/taskModel");
const jwt = require("jsonwebtoken");
const { resolveLocationZipcodes, getLocations } = require("./locationService");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ─── AUTH SERVICES ──────────────────────────────────────────────

const registerUser = async (data) => {
  const { username, email, password, categories = [], locations = [], excludedLocations = [], service_areas_zipcodes = [] } = data;


  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? "Email" : "Username";
    throw { status: 409, message: `${field} already exists` };
  }

  const user = await User.create({
    username,
    email,
    password,
    categories,
    locations,
    excludedLocations,
    service_areas_zipcodes
  });

  console.log("User created:", user);

  return { user: sanitizeUser(user) };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  console.log("user", user);
  if (!user || user.password !== password) {
    throw { status: 401, message: "Invalid email or password" };
  }
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user: sanitizeUser(user), token };
};

// ─── USER SERVICES ──────────────────────────────────────────────

const getAllUsers = async () => {
  return User.find({ isActive: true })
    .select("-__v -password")
    .populate('lockedByAdmin', 'username email');
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-__v -password");
  if (!user) throw { status: 404, message: "User not found" };
  const userObj = user.toObject();

  // Enrich categories with task prices from the Task model
  if (userObj.categories && Array.isArray(userObj.categories)) {
    for (const cat of userObj.categories) {
      if (cat.tasks && Array.isArray(cat.tasks)) {
        for (const task of cat.tasks) {
          const taskDoc = await Task.findOne({ _id: task.taskId }).lean();
          if (taskDoc && taskDoc.price && taskDoc.price.length > 0) {
            task.price = taskDoc.price[0];
          }
        }
      }
    }
  }

  return userObj;
};

const updateUser = async (userId, updateData) => {
  const forbidden = ["password", "role", "_id"];
  forbidden.forEach((f) => delete updateData[f]);
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

const updateUnselectedZipcodes = async (userId, updateData) => {
  const allowed = ["service_areas_zipcodes", "unselected_zipcodes"];
  const payload = {};
  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      payload[key] = updateData[key];
    }
  });
  if (!Object.keys(payload).length) {
    throw { status: 400, message: "No valid unselected zipcode data provided" };
  }
  const user = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

const updateUserStatus = async (userId, status) => {
  if (!["active", "pending"].includes(status)) {
    throw { status: 400, message: "Invalid status. Must be 'active' or 'pending'" };
  }
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true, runValidators: true });
  if (!user) throw { status: 404, message: "User not found" };
  return sanitizeUser(user);
};

const deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw { status: 404, message: "User not found" };
  return { message: "User deleted successfully" };
};

// ─── SERVICE SERVICES ───────────────────────────────────────────
// NOTE: Services have been removed. Categories are now at top level.

// ─── CATEGORY SERVICES ──────────────────────────────────────────

const addCategory = async (userId, categoryData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  user.categories.push(categoryData);
  await user.save();
  return user.categories[user.categories.length - 1];
};

const updateCategory = async (userId, categoryId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  Object.assign(category, updateData);
  await user.save();
  return category;
};

const deleteCategory = async (userId, categoryId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  category.deleteOne();
  await user.save();
  return { message: "Category deleted successfully" };
};

// ─── TASK SERVICES ──────────────────────────────────────────────

const addTask = async (userId, categoryId, taskData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  category.tasks.push(taskData);
  await user.save();
  return category.tasks[category.tasks.length - 1];
};

const updateTask = async (userId, categoryId, taskId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  Object.assign(task, updateData);
  await user.save();
  return task;
};

const toggleTaskChecked = async (userId, categoryId, taskId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  task.checked = !task.checked;
  await user.save();
  return task;
};

const deleteTask = async (userId, categoryId, taskId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  task.deleteOne();
  await user.save();
  return { message: "Task deleted successfully" };
};

// ─── FILTER SERVICES ────────────────────────────────────────────

const addFilter = async (userId, categoryId, taskId, filterData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  task.filters.push(filterData);
  await user.save();
  return task.filters[task.filters.length - 1];
};

const updateFilter = async (userId, categoryId, taskId, filterId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  const filter = task.filters.id(filterId);
  if (!filter) throw { status: 404, message: "Filter not found" };
  Object.assign(filter, updateData);
  await user.save();
  return filter;
};

const toggleFilterChecked = async (userId, categoryId, taskId, filterId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  const filter = task.filters.id(filterId);
  if (!filter) throw { status: 404, message: "Filter not found" };
  filter.isChecked = !filter.isChecked;
  await user.save();
  return filter;
};

const deleteFilter = async (userId, categoryId, taskId, filterId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const category = user.categories.id(categoryId);
  if (!category) throw { status: 404, message: "Category not found" };
  const task = category.tasks.id(taskId);
  if (!task) throw { status: 404, message: "Task not found" };
  const filter = task.filters.id(filterId);
  if (!filter) throw { status: 404, message: "Filter not found" };
  filter.deleteOne();
  await user.save();
  return { message: "Filter deleted successfully" };
};

// ─── LOCATION SERVICES ──────────────────────────────────────────

const addLocation = async (userId, locationData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  if (locationData?.action === 'exclude') {
    user.excludedLocations.push(locationData);
  } else {
    user.locations.push(locationData);
  }
  await user.save();
  return user.locations[user.locations.length - 1] || user.excludedLocations[user.excludedLocations.length - 1];
};

const updateLocation = async (userId, locationId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };
  const location = user.locations.id(locationId);
  if (!location) throw { status: 404, message: "Location not found" };
  Object.assign(location, updateData);
  await user.save();
  return location;
};

// const deleteLocation = async (userId, locationId) => {
//   const user = await User.findById(userId);
//   if (!user) throw { status: 404, message: "User not found" };
//   const location = user.locations.id(locationId);
//   if (!location) throw { status: 404, message: "Location not found" };

//   // Resolve all zipcodes for this location (city/state) from Zipcode collection
//   const locationZipcodes = await resolveLocationZipcodes(location);

//   // Remove these zipcodes from service_areas_zipcodes
//   if (locationZipcodes.length > 0) {
//     user.service_areas_zipcodes = user.service_areas_zipcodes.filter(
//       (zip) => !locationZipcodes.includes(zip)
//     );
//   }

//   // Remove these zipcodes from unselected_zipcodes
//   if (locationZipcodes.length > 0) {
//     user.unselected_zipcodes = user.unselected_zipcodes.filter(
//       (zip) => !locationZipcodes.includes(zip)
//     );
//   }

//   // Delete all zipcode price overrides for these zipcodes
//   if (locationZipcodes.length > 0) {
//     await ZipcodeOverride.deleteMany({
//       userId,
//       zipcode: { $in: locationZipcodes }
//     });
//   }

//   // Delete all location prices for this location (city/state/type)
//   const locationType = location.type || 'city';
//   await LocationPrice.deleteMany({
//     userId,
//     city: location.city,
//     state: location.state,
//     type: locationType
//   });

//   // Delete the location
//   location.deleteOne();
//   await user.save();
//   return { message: "Location deleted successfully" };
// };

const deleteLocation = async (userId, locationId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };

  const location = user.locations.id(locationId) || user.excludedLocations.id(locationId);
  if (!location) {
    throw { status: 404, message: "Location not found" };
  }
  // ── STEP 1: Resolve zipcodes for the location being deleted ──────
  const locationZipcodes = await resolveLocationZipcodes(location);

  // ── STEP 2: Get remaining locations (all except the one being deleted) ───
  const remainingLocations = user.locations.filter(
    (loc) => loc._id.toString() !== locationId.toString()
  );

  // ── STEP 3: Fetch zipcodes for ALL remaining locations ───────────────────
  let remainingZipcodes = [];
  if (remainingLocations.length > 0) {
    const supportedLocations = remainingLocations.filter(
      (loc) => loc.type === "city" || loc.type === "state"
    );

    if (supportedLocations.length > 0) {
      const remainingResults = await getLocations(
        supportedLocations.map((loc) => ({
          type: loc.type,
          city: loc.city,
          state: loc.state,
          stateShort: loc.stateShort,
          description: loc.description,
          location: loc.description,
          lead: null,
          call: null,
          appointment: null,
        }))
      );
      remainingResults.forEach((r) => {
        remainingZipcodes.push(...r.zipcodes);
      });
      // Deduplicate
      remainingZipcodes = [...new Set(remainingZipcodes)];
    }
  }

  // ── STEP 4: Snapshot current unselected_zipcodes BEFORE any cleanup ───────
  const previouslyUnselected = new Set(user.unselected_zipcodes);

  // ── STEP 5: Remove deleted location's zipcodes from service_areas & unselected
  if (locationZipcodes.length > 0) {
    user.service_areas_zipcodes = user.service_areas_zipcodes.filter(
      (zip) => !locationZipcodes.includes(zip)
    );
    user.unselected_zipcodes = user.unselected_zipcodes.filter(
      (zip) => !locationZipcodes.includes(zip)
    );
  }

  // ── STEP 6: Rebuild service_areas_zipcodes from remaining locations ────────
  // Set it fresh from all remaining location zipcodes
  user.service_areas_zipcodes = remainingZipcodes;

  // ── STEP 7: Restore unselected_zipcodes from snapshot ────────────────────
  // If a zipcode from remaining locations was previously unselected by the user,
  // put it back into unselected_zipcodes and remove from service_areas_zipcodes
  const restoredUnselected = [];

  for (const zip of remainingZipcodes) {
    if (previouslyUnselected.has(zip)) {
      restoredUnselected.push(zip);
      // Remove from service_areas since user had unselected it
      user.service_areas_zipcodes = user.service_areas_zipcodes.filter(
        (z) => z !== zip
      );
    }
  }

  user.unselected_zipcodes = restoredUnselected;

  // ── STEP 8: Delete zipcode price overrides for deleted location's zipcodes ─
  if (locationZipcodes.length > 0) {
    await ZipcodeOverride.deleteMany({
      userId,
      zipcode: { $in: locationZipcodes },
    });
  }

  // ── STEP 9: Delete location prices for the deleted location ───────────────
  const locationType = location.type || "city";
  await LocationPrice.deleteMany({
    userId,
    city: location.city,
    state: location.state,
    type: locationType,
  });

  // ── STEP 10: Delete the location and save ─────────────────────────────────
  location.deleteOne();
  await user.save();

  return { message: "Location deleted successfully" };
};

const addBulkLocationsToUser = async (userId, payload) => {
  const { locations, excludedLocations } = payload;

  console.log("Adding bulk locations for userId:", userId);
  console.log("Locations to add1234:", locations);

  // 1. Validate input
  for (const loc of locations) {
    if (!loc.city || !loc.state || !loc.type) {
      throw { status: 400, message: "Each location must have city, state, and type" };
    }
  }

  for (const exLoc of excludedLocations) {
    if (!exLoc.city || !exLoc.state || !exLoc.type) {
      throw { status: 400, message: "Each location must have city, state, and type" };
    }
  }

  // 2. Fetch user
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  // 3. Prepare new location documents
  const newLocations = locations.map(loc => ({
    description: loc.location || loc.description,
    city: loc.city,
    state: loc.state,
    stateShort: loc.stateShort || '',
    country: loc.country || '',
    type: loc.type || 'city',
    radius: loc.radius || null,
    unit: loc.unit || null
  }));

  // 3. Prepare new location documents
  const newExLocations = excludedLocations.map(exLoc => ({
    description: exLoc.location || exLoc.description,
    city: exLoc.city,
    state: exLoc.state,
    stateShort: exLoc.stateShort || '',
    country: exLoc.country || '',
    type: exLoc.type || 'city',
    radius: exLoc.radius || null,
    unit: exLoc.unit || null
  }));


  // 4. Push to user.locations array
  user.locations.push(...newLocations);

  // 4. Push to user.locations array
  user.excludedLocations.push(...newExLocations);

  // 5. Resolve zipcodes for all new locations
  const allNewZipcodes = new Set();

  for (const loc of newLocations) {
    const zipcodes = await resolveLocationZipcodes(loc);
    zipcodes.forEach(z => allNewZipcodes.add(z));
  }

  // 6. Update user.service_areas_zipcodes
  const currentZipcodes = new Set(user.service_areas_zipcodes || []);
  allNewZipcodes.forEach(z => currentZipcodes.add(z));
  user.service_areas_zipcodes = Array.from(currentZipcodes);

  // 7. Save user
  await user.save();

  console.log("Total locations added:", newLocations.length);
  console.log("Total new zipcodes added:", allNewZipcodes.size);

  return {
    locationsAdded: newLocations.length,
    zipcodesAdded: allNewZipcodes.size,
    locations: newLocations,
    excludedLocations: newExLocations
  };
};

const addOrUpdateZipcodePriceOverride = async (userId, overrideData) => {
  const { categoryId, taskId, zipcode, price } = overrideData;
  if (!zipcode || !price) {
    throw { status: 400, message: "Zipcode and price are required" };
  }

  const query = {
    userId,
    zipcode,
    ...(categoryId ? { categoryId } : {}),
    ...(taskId ? { taskId } : {}),
  };

  const update = {
    userId,
    categoryId,
    taskId,
    zipcode,
    price,
  };

  const result = await ZipcodeOverride.findOneAndUpdate(query, update, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  return result;
};

const getZipcodePriceOverrides = async (userId, filter = {}) => {
  const query = { userId, ...filter };
  return ZipcodeOverride.find(query).lean();
};

const deleteZipcodePriceOverride = async (userId, overrideId) => {
  const doc = await ZipcodeOverride.findOneAndDelete({ _id: overrideId, userId });
  if (!doc) throw { status: 404, message: "Override not found" };
  return { message: "Override deleted successfully" };
};

// ─── LOCATION PRICE SERVICES ───────────────────────────────────────

const addOrUpdateLocationPrice = async (userId, locationPriceData) => {
  const { categoryId, taskId, city, state, stateShort, type, price } = locationPriceData;

  if (!city || !state || !type || !price) {
    throw { status: 400, message: "City, state, type, and price are required" };
  }

  const query = {
    userId,
    city,
    state,
    type,
    ...(categoryId ? { categoryId } : {}),
    ...(taskId ? { taskId } : {}),
  };

  const update = {
    userId,
    categoryId,
    taskId,
    city,
    state,
    stateShort: stateShort || '',
    type,
    price,
  };

  const result = await LocationPrice.findOneAndUpdate(query, update, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  return result;
};

const getLocationPrices = async (userId, filter = {}) => {
  const query = { userId, ...filter };
  return LocationPrice.find(query).lean();
};

const deleteLocationPrice = async (userId, locationPriceId) => {
  const doc = await LocationPrice.findOneAndDelete({ _id: locationPriceId, userId });
  if (!doc) throw { status: 404, message: "Location price not found" };
  return { message: "Location price deleted successfully" };
};

// ─── QUERY SERVICES ─────────────────────────────────────────────

const getCheckedTasksWithFilters = async (userId) => {
  const user = await User.findById(userId);
  const getCheckedTasksWithFilters = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    const result = [];
    user.categories.forEach((category) => {
      category.tasks.forEach((task) => {
        if (task.checked) {
          const checkedFilters = task.filters.filter((f) => f.isChecked);
          result.push({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            taskId: task.taskId,
            taskName: task.taskName,
            taskPrice: task.taskPrice,
            checkedFilters,
          });
        }
      });
    });
    return result;
  };
}

const getTotalPrice = async (userId) => {
  const checkedItems = await getCheckedTasksWithFilters(userId);
  let total = 0;
  checkedItems.forEach((item) => {
    total += item.taskPrice;
    item.checkedFilters.forEach((f) => (total += f.filterPrice));
  });
  return { total, breakdown: checkedItems };
};

// ─── TASK EDIT DATA SERVICE ─────────────────────────────────────

const getTaskEditData = async (userId, categoryId, taskId) => {
  if (!userId) throw { status: 400, message: "userId is required" };
  if (!categoryId) throw { status: 400, message: "categoryId is required" };
  if (!taskId) throw { status: 400, message: "taskId is required" };

  // 1. User fetch karo
  const user = await User.findById(userId).select("-__v -password").lean();
  if (!user) throw { status: 404, message: "User not found" };

  // Excluded aur service area zipcodes ke fast-lookup Sets
  const excludedSet = new Set(user.unselected_zipcodes || []);
  const serviceAreaSet = new Set(user.service_areas_zipcodes || []);

  // 2. Task ka default price Task model se fetch karo
  const taskDoc = await Task.findById(taskId).lean();
  const defaultPrice =
    taskDoc && taskDoc.price && taskDoc.price.length > 0
      ? taskDoc.price[0]
      : { lead: 0, call: 0, appointment: 0 };

  // 3. Is task ke liye zipcode overrides fetch karo aur ek map banao
  const overridesDocs = await ZipcodeOverride.find({ userId, categoryId, taskId }).lean();
  const overridesMap = {};
  overridesDocs.forEach((o) => {
    overridesMap[o.zipcode] = o.price;
  });

  // 3.5 Fetch location prices (city/state level)
  const locationPriceDocs = await LocationPrice.find({
    userId,
    categoryId,
    taskId
  }).lean();
  const locationPriceMap = {};
  locationPriceDocs.forEach((lp) => {
    const key = `${lp.city}-${lp.state}-${lp.type}`;
    locationPriceMap[key] = lp.price;
  });

  // 4. Har user location ke liye:
  //    a) Zipcode DB se resolve karo (city/state query)
  //    b) Sirf wahi rakho jo service area mein hain aur excluded nahi hain
  //    c) Har zipcode ke liye price lagao: override > defaultPrice
  const enrichedLocations = await Promise.all(
    (user.locations || []).map(async (loc) => {
      // DB se zipcodes fetch karo for this city/state
      const allZipcodes = await resolveLocationZipcodes(loc);

      // Filter: service area mein ho + excluded na ho
      const filteredZipcodes = allZipcodes.filter(
        (z) => serviceAreaSet.has(z) && !excludedSet.has(z)
      );

      // Location-level price (city/state)
      const locationKey = `${loc.city}-${loc.state}-${loc.type}`;
      const locationPrice = locationPriceMap[locationKey];

      // Har zipcode ke liye price map
      // Priority: zipcode override > location price > default task price
      const serviceAreaPrices = {};
      filteredZipcodes.forEach((zip) => {
        serviceAreaPrices[zip] = overridesMap[zip] || locationPrice || defaultPrice;
      });

      return {
        locationId: String(loc._id),
        location: loc.description || loc.city || "",
        city: loc.city || "",
        state: loc.state || "",
        stateShort: loc.stateShort || "",
        type: loc.type || "city",
        zipcodes: filteredZipcodes,
        serviceAreaPrices,
      };
    })
  );

  // 5. locationServiceAreas = wahi locations jinka koi bhi zipcode
  //    task ke zipcodes se match karta ho
  //    Agar task model mein zipcodes nahi hain → sari locations dikhao
  const taskZipcodes = taskDoc ? (taskDoc.zipcodes || []) : [];
  const locationServiceAreas =
    taskZipcodes.length > 0
      ? enrichedLocations.filter((loc) =>
        loc.zipcodes.some((z) => taskZipcodes.includes(z))
      )
      : enrichedLocations;

  return {
    userId,
    categoryId,
    taskId,
    defaultPrice,
    locationServiceAreas,
    userLocations: enrichedLocations,
    locationPrices: locationPriceDocs,
    overrides: overridesDocs,
    userServiceAreas: user.service_areas_zipcodes || [],
  };
};

// ─── ADMIN SERVICES ────────────────────────────────────────────────

const adminLogin = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw { status: 401, message: "Invalid credentials" };

  // DEBUG: Log user role
  console.log("Admin login attempt for user:", email, "Role in DB:", user.role);

  // Check if user is an admin
  if (user.role !== 'admin') {
    console.log("Access denied: User is not an admin");
    throw { status: 403, message: "Access denied. Admin privileges required." };
  }

  // Password check commented for dev (bcrypt not set up)
  // const isPasswordValid = await user.comparePassword(password);
  // if (!isPasswordValid) {
  //   throw { status: 401, message: "Invalid credentials" };
  // }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  console.log("Admin token generated with role:", user.role);
  return { user: sanitizeUser(user), token };
};

const impersonateUser = async (adminId, userId) => {
  // Verify admin exists
  console.log("Admin ID for impersonation:", adminId);
  const admin = await User.findById(adminId);
  console.log("admin:", admin);
  if (!admin || admin.role !== 'admin') {
    throw { status: 403, message: "Only admins can impersonate users" };
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };

  // Set admin login flag on user
  user.isAdminLogin = true;
  user.lockedByAdmin = adminId;
  user.lockedAt = new Date();
  await user.save();

  // Generate token for user (not admin)
  const token = jwt.sign(
    { id: user._id, role: 'user', impersonatedBy: adminId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return { user: sanitizeUser(user), token };
};

const exitImpersonation = async (userId, adminId) => {
  // Verify admin exists
  const admin = await User.findById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw { status: 403, message: "Only admins can exit impersonation" };
  }

  // Verify user exists and is currently impersonated
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: "User not found" };

  if (!user.isAdminLogin) {
    throw { status: 400, message: "User is not currently being impersonated" };
  }

  // Clear admin login flag
  user.isAdminLogin = false;
  user.lockedByAdmin = null;
  user.lockedAt = null;
  await user.save();

  return { message: "Impersonation ended successfully" };
};

const getLockedUsers = async () => {
  // Get all users that are currently locked by admin
  const users = await User.find({ isAdminLogin: true, role: 'user' })
    .populate('lockedByAdmin', 'username email')
    .select('-password')
    .lean();
  return users;
};

// ─── HELPERS ────────────────────────────────────────────────────

const sanitizeUser = (user) => {
  const u = user.toObject();
  delete u.password;
  return u;
};

module.exports = {
  registerUser, loginUser,
  getAllUsers, getUserById, updateUser, deleteUser, updateUserStatus,
  addCategory, updateCategory, deleteCategory,
  addTask, updateTask, toggleTaskChecked, deleteTask,
  addFilter, updateFilter, toggleFilterChecked, deleteFilter,
  addLocation, updateLocation, deleteLocation, addBulkLocationsToUser,
  addOrUpdateZipcodePriceOverride, getZipcodePriceOverrides, deleteZipcodePriceOverride,
  addOrUpdateLocationPrice, getLocationPrices, deleteLocationPrice,
  getCheckedTasksWithFilters, getTotalPrice, updateUnselectedZipcodes,
  getTaskEditData,
  adminLogin, impersonateUser, exitImpersonation, getLockedUsers,
};
