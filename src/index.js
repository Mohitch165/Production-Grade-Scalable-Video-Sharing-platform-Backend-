import { app } from "./app.js";
import dotenv from 'dotenv';
import DB_Connect from "./db/index.js";

dotenv.config({
    path: "./.env"
})

const PORT = process.env.PORT;

DB_Connect().then(() => {
    app.listen(PORT, () => {
    console.log(`Testing port, server running on ${PORT}`);
})
}).catch((err) => {
    console.log("Eror in DB connection",err);
});