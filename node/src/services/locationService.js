const locationModel = require("../model/locationModel");
const Zipcode = require("../model/zipcodesModel");
const globle = require("../utils/index");
const AppError = require("../utils/AppError");

const getLocations = async (values) => {
    if (!Array.isArray(values)) {
        throw new AppError("Invalid input format", 400);
    }
    console.log("values", values)
    const results = [];

    for (const item of values) {
        const { type, city, state, stateShort } = item;
        console.log("item", item)
        let query = {};

        if (type === "state") {
            query.state = { $regex: `^${stateShort}$`, $options: "i" };
        } else if (type === "city") {
            query.primary_city = city;
        } else {
            throw new AppError("Invalid type", 400);
        }

        console.log("query", query);
        const data = await Zipcode.find(query, { zip: 1, _id: 0 });

        const zipcodes = data.map(d => d.zip);

        results.push({
            location: item.location,
            city: item.city,
            state: item.state,
            type: item.type,
            lead: item.lead,
            stateShort: item.stateShort,
            call: item.call,
            appointment: item.appointment,
            zipcodes
        });
    }

    return results;
};

const resolveLocationZipcodes = async (location) => {
    if (!location || !location.type) {
        return [];
    }

    const query = location.type === 'state'
        ? { state: { $regex: `^${location.stateShort || location.state}$`, $options: 'i' } }
        : { primary_city: { $regex: `^${location.city}$`, $options: 'i' } };

    console.log("query", query);
    const data = await Zipcode.find(query, { zip: 1, _id: 0 });
    return [...new Set(data.map(d => d.zip))];
};

const attachZipcodesToLocations = async (locations) => {
    if (!locations?.length) {
        return locations;
    }

    const updatedLocations = await Promise.all(locations.map(async (loc) => {
        const locationData = loc.toObject ? loc.toObject() : loc;

        const { type, city, state, stateShort } = locationData;

        let query = {};

        if (type === "state") {
            query.state = { $regex: `^${stateShort || state}$`, $options: "i" };
        } else if (type === "city") {
            query.primary_city = { $regex: `^${city}$`, $options: "i" };
        } else {
            return {
                ...locationData,
                zipcodes: [],
                prices: Array.isArray(locationData.prices)
                    ? locationData.prices
                    : locationData.prices ? [locationData.prices] : [{ lead: 0, call: 0, appointment: 0 }]
            };
        }

        const data = await Zipcode.find(query, { zip: 1, _id: 0 });
        const zipcodes = [...new Set(data.map(d => d.zip))];

        const rawPrices = Array.isArray(locationData.prices)
            ? locationData.prices
            : locationData.prices ? [locationData.prices] : [];

        const price = rawPrices.length > 0
            ? rawPrices[0]
            : { lead: 0, call: 0, appointment: 0 };

        const existingServiceArea = locationData.serviceArea || [];
        const existingZipcodes = new Set(existingServiceArea.map((sa) => sa.zipcode));

        const serviceArea = zipcodes.map((zip) => {
            const existing = existingServiceArea.find((sa) => sa.zipcode === zip);
            return existing || { zipcode: zip, prices: [price] };
        });

        return {
            ...locationData,
            zipcodes,
            prices: [price],
            serviceArea
        };
    }));

    return updatedLocations;
};

const updateLocationServiceArea = async (taskId, payload) => {
    const { city, state, type, zipcode, price, categoryId } = payload;

    const location = await locationModel.findOne({
        taskId,
        city,
        state,
        type
    });

    if (!location) {
        throw new AppError("Location not found", 404);
    }

    if (categoryId) {
        location.categoryId = categoryId;
    }

    location.serviceArea = location.serviceArea || [];
    const existingZip = location.serviceArea.find((sa) => sa.zipcode === zipcode);
    const prices = [
        {
            lead: Number(price.lead) || 0,
            call: Number(price.call) || 0,
            appointment: Number(price.appointment) || 0
        }
    ];

    if (existingZip) {
        existingZip.prices = prices;
    } else {
        location.serviceArea.push({ zipcode, prices });
    }

    await location.save();
    return location;
};

const addLocationsToTask = async (taskId, payload) => {
    const { locations } = payload;

    console.log("Adding locations for taskId:", taskId);
    console.log("Locations to add:", locations);

    const locationDocs = locations.map(loc => ({
        ...loc,
        taskId,
        categoryId: loc.categoryId || payload.categoryId
    }));

    console.log("Location docs to insert:", locationDocs);

    const result = await locationModel.insertMany(locationDocs);

    console.log("Inserted locations:", result);

    return result;
};

const deleteLocationFromTask = async (taskId, payload) => {
    const { city, state, type } = payload;

    const result = await locationModel.deleteOne({
        taskId,
        city,
        state,
        type
    });

    return result;
};

const getLocationsByTaskId = async (taskId, categoryId = null) => {
    console.log("Fetching locations for taskId:", taskId, "categoryId:", categoryId);

    let query = { taskId };
    if (categoryId) {
        query.categoryId = categoryId;
    }

    console.log("Query:", query);

    const locations = await locationModel.find(query).populate('categoryId');

    console.log("Found locations:", locations);

    if (!locations || locations.length === 0) {
        return [];
    }

    const locationsWithZipcodes = await attachZipcodesToLocations(locations);
    return locationsWithZipcodes;
};

module.exports = {
    getLocations,
    resolveLocationZipcodes,
    attachZipcodesToLocations,
    updateLocationServiceArea,
    addLocationsToTask,
    deleteLocationFromTask,
    getLocationsByTaskId
};