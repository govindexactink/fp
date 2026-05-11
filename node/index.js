const app = require("./src/app");
const connectDB = require('./src/config/connection');
const dotenv = require("dotenv");

dotenv.config();

connectDB();

const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, (req,res) => {
    return console.log(`app running on localhost:${PORT} port`);
});
