const globle = require('../utils/index');
const mongoose = require("mongoose");

const getAllService = async (model) => {
    const result = await model.find();

    return result;
}


const getByIdService = async (req, model) => {
    const {id} = req.params;
    const validateField = globle.validateFields({id});
    if(validateField) {
        throw new globle.AppError(validateField, 400);
    }

    checkMongooseObjectId (id);

    const result = await model.findById(id);

    return result;
}

const deleteByIdService = async (req, model) => {
    const {id} = req.params;
    const validateField = globle.validateFields({id});
    if(validateField) {
        throw new globle.AppError(validateField, 400);
    }

    checkMongooseObjectId (id);

    const result = await model.findByIdAndDelete(id);

    if(!result) {
        throw new globle.AppError("data not exist", 400);
    }
    return result;
}

const updateByIdService = async (req, model) => {
    const {id} = req.params;
    const validateField = globle.validateFields({id});
    if(validateField) {
        throw new globle.AppError(validateField, 400);
    }

    checkMongooseObjectId(id);

    const result = await model.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    if(!result) {
        throw new globle.AppError("data not exist", 400);
    }
    return result;
}

const checkMongooseObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new globle.AppError("Invalid ID format", 400);
    }
}


module.exports = {
    getAllService,
    getByIdService,
    deleteByIdService,
    checkMongooseObjectId,
    updateByIdService
}