const categoryModel = require("../model/categoryModel");
const taskModel = require("../model/taskModel");
const globle = require("../utils/index");
const AppError = require("../utils/AppError");
const utilsService = require("../services/utils");
 

const addCategory = async (value) => {
    const {name, description, status, cateId, } = value;


    const validateError = globle.validateFields({name, cateId});

    if(validateError) {
        throw new AppError(validateError, 400);
    }

    const category = await categoryModel.findOne({name, cateId});
    if(category) {
        throw new AppError("category already exist", 400);
    }


    const result = await categoryModel.create({name, description, status, cateId});

    if(!result) {
        throw new AppError("server error", 500);
    }
    
    return result;
};


const updateCategory = async (value) => {
    const {id, name, description, status, cateId} = value;


    const validateError = globle.validateFields({id, name, cateId});

    if(validateError) {
        throw new AppError(validateError, 400);
    }

    utilsService.checkMongooseObjectId(id);

    const existingCategory = await categoryModel.findOne({
        _id: { $ne: id }, // exclude current record
        $or: [
            { name },
            { cateId }
        ]
    });

    if (existingCategory) {
        throw new AppError("Category already exists", 409);
    }
    
    const task = await taskModel.findOne({
        $or: [
            { name: name },
            { taskId: cateId }
        ]
    });
    
    if (task) {
        throw new AppError("Task with same name or taskId already exists", 409);
    }

    const result = await categoryModel.findByIdAndUpdate(
        id,
        { name, description, status, cateId },
        { new: true }
    );

    if(!result) {
        throw new AppError("server error", 500);
    }
    
    return result;
};


const deleteCategory = async (value) => {
    const { id } = value;

    const validateError = globle.validateFields({ id });
    if (validateError) {
        throw new AppError(validateError, 400);
    }

    utilsService.checkMongooseObjectId(id);

    // check category exists
    const category = await categoryModel.findById(id);
    if (!category) {
        throw new AppError("Category not found", 404);
    }

    // find all tasks using this category
    const tasks = await taskModel.find({ categoryId: id });

    for (const task of tasks) {
        if (task.categoryId.length === 1) {
            // ❌ only one category → delete task
            await taskModel.findByIdAndDelete(task._id);
        } else {
            // remove category from array
            await taskModel.findByIdAndUpdate(task._id, {
                $pull: { categoryId: id }
            });
        }
    }

    // delete category
    const result = await categoryModel.findByIdAndDelete(id);

    if(!result) {
        throw new AppError("server error", 500);
    }
    
    return result;
};


module.exports = {
    addCategory,
    updateCategory,
    deleteCategory
}
