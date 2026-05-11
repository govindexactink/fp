const taskModel = require("../model/taskModel");
const categoryModel = require("../model/categoryModel");
const globle = require("../utils/index");
const AppError = require("../utils/AppError");


const addCategory = async (value) => {
    const { name, description, status, taskId, price, categoryId } = value;
    const validateError = globle.validateFields({ name, taskId });

    if (validateError) {
        throw new AppError(validateError, 400);
    }

    const existingTask = await taskModel.findOne({ name, taskId });

    if (existingTask) {
        throw new AppError("Task already exists", 409);
    }

    const categories = await categoryModel.findOne({
        $or: [
            { name: name },
            { cateId: taskId }
        ]
    });

    if (categories) {
        throw new AppError("Category with same name or taskId already exists", 409);
    }


    const result = await taskModel.create({ name, description, status, categoryId, taskId, price });

    if (!result) {
        throw new AppError("server error", 500);
    }

    return result;
};

module.exports = {
    addCategory
}
