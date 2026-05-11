const mongoose = require("mongoose");

const category =  mongoose.Schema({
    name : {
        type:String,
        required:[true, "category name is required",],
    },
    description : {
        type:String,
    },
    cateId : {
        type:String,
    },
    status : {
        type:String,
        enum:["ACTIVE", "INACTIVE"],
        default:"ACTIVE",
    }
}, {timestamps : true});

const categoryModel = mongoose.model('Category', category)

module.exports = categoryModel;
