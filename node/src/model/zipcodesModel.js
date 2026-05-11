const mongoose = require("mongoose");

const zipcodeSchema = new mongoose.Schema({
    zip: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String
    },
    decommissioned: {
        type: Boolean,
        default: false
    },
    primary_city: {
        type: String
    },
    acceptable_cities: {
        type: String
    },
    unacceptable_cities: {
        type: String
    },
    state: {
        type: String
    },
    county: {
        type: String
    },
    timezone: {
        type: String
    },
    area_codes: {
        type: String
    },
    world_region: {
        type: String
    },
    country: {
        type: String
    },
    approximate_latitude: {
        type: Number
    },
    approximate_longitude: {
        type: Number
    },
    polygon_offset_latitude: {
        type: Number
    },
    polygon_offset_longitude: {
        type: Number
    },
    internal_point_latitude: {
        type: Number
    },
    internal_point_longitude: {
        type: Number
    },
    latitude_min: {
        type: Number
    },
    latitude_max: {
        type: Number
    },
    longitude_min: {
        type: Number
    },
    longitude_max: {
        type: Number
    },
    area_land: {
        type: Number
    },
    area_water: {
        type: Number
    },
    housing_count: {
        type: Number
    },
    population_count: {
        type: Number
    },
    irs_estimated_population_2015: {
        type: Number
    },
    white: {
        type: Number
    },
    black_or_african_american: {
        type: Number
    },
    american_indian_or_alaskan_native: {
        type: Number
    },
    asian: {
        type: Number
    },
    native_hawaiian_and_other_pacific_islander: {
        type: Number
    },
    other_race: {
        type: Number
    },
    two_or_more_races: {
        type: Number
    },
    total_male_population: {
        type: Number
    },
    total_female_population: {
        type: Number
    },
    pop_under_10: {
        type: Number
    },
    pop_10_to_19: {
        type: Number
    },
    pop_20_to_29: {
        type: Number
    },
    pop_30_to_39: {
        type: Number
    },
    pop_40_to_49: {
        type: Number
    },
    pop_50_to_59: {
        type: Number
    },
    pop_60_to_69: {
        type: Number
    },
    pop_70_to_79: {
        type: Number
    },
    pop_80_plus: {
        type: Number
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: "2dsphere"
        }
    }
}, { timestamps: true });

const Zipcode = mongoose.model("zipcodes", zipcodeSchema);

module.exports = Zipcode;