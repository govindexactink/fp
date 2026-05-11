const mongoose =require("mongoose");

 const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB successfullly connected");
    } catch (error) {
        console.log("DB connection error", error);
    }
}

module.exports = connectDB;