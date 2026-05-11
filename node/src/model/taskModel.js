const mongoose = require("mongoose");

const task = mongoose.Schema({
    name: {
        type: String,
        required: [true, "task name is required",],
    },
    description: {
        type: String,
    },
    taskId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
    },
    categoryId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "category required"]
    }],
    price: [
        {
            lead: {
                type: Number,
            },
            call: {
                type: Number,
            },
            appointment: {
                type: Number,
            },
        }
    ]
}, { timestamps: true });

const taskModel = mongoose.model('Task', task);

module.exports = taskModel;
