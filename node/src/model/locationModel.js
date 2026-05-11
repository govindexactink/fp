const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: [true, "taskId is required"]
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "categoryId is required"]
    },
    location: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    type: {
        type: String,
    },
    stateShort: {
        type: String,
    },
    prices: [
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
    ],
    serviceArea: [
        {
            zipcode: {
                type: String,
            },
            prices: [
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
        }
    ]
}, { timestamps: true });

const locationModel = mongoose.model('Location', locationSchema);

module.exports = locationModel;