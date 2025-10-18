import mongoose from "mongoose";

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.Mongo_URI); //mongodb mizin .env ye yazdığımız urlsi ne bağlanıyor
    console.log("Connected to MongoDB");
    
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectToMongoDB;
