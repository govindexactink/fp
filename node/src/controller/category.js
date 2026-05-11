const categoryModel = require("../model/categoryModel");
const globle = require('../utils/index');
const categoryService = require('../services/categoryService');
const utilsService = require("../services/utils");


// ADD CATEGORY 
const addCategory = globle.asyncHandler( async (req, res) => { 
    const result = await categoryService.addCategory(req.body);

    globle.sendResponse(res, 201, "category succcessfully added", result);
});


// GET ALL CATEGORY
const getAll  = globle.asyncHandler( async (req, res) => {

  const result = await utilsService.getAllService(categoryModel);

  globle.sendResponse(res, 200, "get all categories successfully", result);
});


// GET CATEGORY BY OBJECT ID 
const getByObjId  = globle.asyncHandler( async (req, res) => {

  const result = await utilsService.getByIdService(req,categoryModel);

  globle.sendResponse(res, 200, "get category successfully", result);
});
 
// Delete CATEGORY BY OBJECT ID 
const deleteByObjId  = globle.asyncHandler( async (req, res) => {

  const result = await categoryService.deleteCategory(req.params);

  globle.sendResponse(res, 200, "deleted category successfully", result);
});
// const deleteByObjId  = globle.asyncHandler( async (req, res) => {

//   const result = await utilsService.deleteByIdService(req,categoryModel);

//   globle.sendResponse(res, 200, "deleted category successfully", result);
// });


// Delete CATEGORY BY OBJECT ID 
const updateCategory  = globle.asyncHandler( async (req, res) => {

  const result = await categoryService.updateCategory(req.body);

  globle.sendResponse(res, 200, "deleted category successfully", result);
});




module.exports = {
    addCategory,
    getAll,
    getByObjId,
    deleteByObjId,
    updateCategory
}