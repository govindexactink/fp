const mongoose = require('mongoose');

const zipcodePriceOverrideSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categoryId: {
        type: String,
        required: false
    },
    taskId: {
        type: String,
        required: false
    },
    zipcode: {
        type: String,
        required: [true, 'Zipcode is required']
    },
    price: {
        lead: {
            type: Number,
            default: 0
        },
        call: {
            type: Number,
            default: 0
        },
        appointment: {
            type: Number,
            default: 0
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('ZipcodePriceOverride', zipcodePriceOverrideSchema);
