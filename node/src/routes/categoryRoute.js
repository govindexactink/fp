const express = require("express");
const categoryRouter = express.Router();
const category = require('../controller/category')

// ADD CATEGORY 
categoryRouter.post("/add", category.addCategory);

// GET ALL CATEGORY
categoryRouter.get("/getAll", category.getAll);

// GET CATEGORY BY OBJECT ID 
categoryRouter.get("/get/:id", category.getByObjId);

// DELETE  CATEGORY BY OBJECT ID 
categoryRouter.delete("/delete/:id", category.deleteByObjId);

// UPDATE CATEGORY
categoryRouter.patch("/update", category.updateCategory);


module.exports = categoryRouter;