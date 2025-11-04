import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8+ benötigt keine zusätzlichen Optionen mehr
    });

    console.log(`✅ MongoDB verbunden: ${conn.connection.host}`);
    console.log(`📦 Datenbank: ${conn.connection.name}`);

    // Connection Events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Fehler:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Verbindung getrennt');
    });

    // Graceful Shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB Verbindung geschlossen');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB Verbindungsfehler:', error.message);
    process.exit(1);
  }
};

export default connectDB;

