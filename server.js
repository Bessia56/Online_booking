require("dotenv").config();

const app = require("./app");
const db = require("./src/config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await db.raw("SELECT 1");

        console.log("PostgreSQL connected!");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});