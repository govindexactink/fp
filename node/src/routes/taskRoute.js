const express = require("express");
const taskRouter = express.Router();
const task = require('../controller/task')

// ADD CATEGORY 
taskRouter.post("/add", task.addCategory);

// GET ALL CATEGORY
taskRouter.get("/getAll", task.getAll);

// GET CATEGORY BY OBJECT ID 
taskRouter.get("/get/:id", task.getByObjId);

// DELETE  CATEGORY BY OBJECT ID 
taskRouter.delete("/delete/:id", task.deleteByObjId);


// GET LOCATIONS
taskRouter.post("/location", task.getLocations);

// UPDATE CATEGORY / TASK BY OBJECT ID
taskRouter.put("/update/:id", task.updateByObjId);

// UPDATE LOCATION SERVICE AREA PRICE
taskRouter.put("/update-service-area/:id", task.updateLocationServiceArea);

// ADD LOCATIONS TO TASK
taskRouter.put("/add-locations/:id", task.addLocationsToTask);

// DELETE LOCATION FROM TASK
taskRouter.delete("/delete-location/:id", task.deleteLocationFromTask);

module.exports = taskRouter;