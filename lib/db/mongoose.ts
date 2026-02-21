import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment");
  }
  if (uri.includes("<db_password>")) {
    throw new Error(
      "MONGODB_URI contains placeholder <db_password>. Replace it with your real database password.",
    );
  }
  return uri;
};

const cached = global.mongooseCache ?? {
  connection: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.connection) {
    return cached.connection;
  }

  if (!cached.promise) {
    const uri = getMongoUri();
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.connection = await cached.promise;
  return cached.connection;
}
