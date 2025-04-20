import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const DB_Connect =  async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(` \n MongoDB Connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB Connection error");
        process.exit(1);
    }
}

export default DB_Connect