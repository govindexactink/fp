const mongoose = require('mongoose');

const locationPriceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categoryId: {
        type: String,
        required: true
    },
    taskId: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    stateShort: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['city', 'state'],
        required: true
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

module.exports = mongoose.model('LocationPrice', locationPriceSchema);
