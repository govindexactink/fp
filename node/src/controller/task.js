const taskModel = require("../model/taskModel");
const globle = require('../utils/index');
const taskService = require('../services/taskService');
const locationService = require('../services/locationService');
const utilsService = require("../services/utils");


// ADD CATEGORY 
const addCategory = globle.asyncHandler(async (req, res) => {
  const result = await taskService.addCategory(req.body);

  globle.sendResponse(res, 201, "category succcessfully added", result);
});


// GET ALL CATEGORY
const getAll = globle.asyncHandler(async (req, res) => {

  const result = await utilsService.getAllService(taskModel);

  globle.sendResponse(res, 200, "get all categories successfully", result);
});


// GET CATEGORY BY OBJECT ID 
const getByObjId = globle.asyncHandler(async (req, res) => {
  const categoryId = req.headers['categoryid'] || req.query.categoryId;

  const result = await utilsService.getByIdService(req, taskModel);

  // Convert to plain object to allow adding locations property
  const taskData = result.toObject ? result.toObject() : result;

  let locations = [];
  if (result && result._id) {
    if (categoryId) {
      locations = await locationService.getLocationsByTaskId(result._id.toString(), categoryId);
    } else {
      locations = await locationService.getLocationsByTaskId(result._id.toString());
    }
  }

  taskData.locations = locations;

  globle.sendResponse(res, 200, "get category successfully", taskData);
});

// Delete CATEGORY BY OBJECT ID 
const deleteByObjId = globle.asyncHandler(async (req, res) => {

  const result = await utilsService.deleteByIdService(req, taskModel);

  globle.sendResponse(res, 200, "deleted category successfully", result);
});

// UPDATE CATEGORY / TASK BY OBJECT ID
const updateByObjId = globle.asyncHandler(async (req, res) => {

  const result = await utilsService.updateByIdService(req, taskModel);

  globle.sendResponse(res, 200, "updated category successfully", result);
});

const updateLocationServiceArea = globle.asyncHandler(async (req, res) => {
  const result = await locationService.updateLocationServiceArea(req.params.id, req.body);
  globle.sendResponse(res, 200, "service area updated successfully", result);
});

const addLocationsToTask = globle.asyncHandler(async (req, res) => {
  const result = await locationService.addLocationsToTask(req.params.id, req.body);
  globle.sendResponse(res, 200, "locations added successfully", result);
});

const deleteLocationFromTask = globle.asyncHandler(async (req, res) => {
  const result = await locationService.deleteLocationFromTask(req.params.id, req.body);
  globle.sendResponse(res, 200, "location deleted successfully", result);
});

// GET LOCATIONS
const getLocations = globle.asyncHandler(async (req, res) => {

  const result = await locationService.getLocations(req.body);

  globle.sendResponse(res, 200, "location get successfully", result);
});




module.exports = {
  addCategory,
  getAll,
  getByObjId,
  deleteByObjId,
  updateByObjId,
  updateLocationServiceArea,
  addLocationsToTask,
  deleteLocationFromTask,
  getLocations
}