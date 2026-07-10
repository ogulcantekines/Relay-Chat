import mongoose from "mongoose";

const connectToMongoDB = async () => {
  const uri = process.env.MONGO_URI || process.env.Mongo_URI;

  if (!uri) {
    console.error("MONGO_URI is not defined. Check your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri); //mongodb mizin .env ye yazdığımız urlsine bağlanıyor
    console.log("Connected to MongoDB");
  } catch (error) {
    // Bağlantı kurulamazsa sunucuyu ayakta tutmanın anlamı yok:
    // tüm istekler "buffering timed out" hatasıyla 500 dönerdi.
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectToMongoDB;
