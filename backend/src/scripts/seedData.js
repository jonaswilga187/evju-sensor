import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SensorMesswert from '../models/SensorMesswert.js';

dotenv.config();

// Beispieldaten generieren
const generateSampleData = () => {
  const data = [];
  const now = new Date();
  
  // 24 Stunden Daten (alle 2 Stunden)
  for (let i = 0; i < 12; i++) {
    const zeitstempel = new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000);
    
    data.push({
      zeitstempel,
      temperatur: parseFloat((16 + Math.random() * 12).toFixed(1)),
      luftfeuchtigkeit: parseInt(45 + Math.random() * 30),
      stromverbrauch: parseInt(250 + Math.random() * 700),
      meta: {
        standort: 'Wohnzimmer',
        sensor_id: 'sensor_001'
      }
    });
  }
  
  return data;
};

// Seed-Funktion
const seedDatabase = async () => {
  try {
    // Verbindung zur Datenbank
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB verbunden');

    // Alte Daten löschen (optional)
    await SensorMesswert.deleteMany({});
    console.log('🗑️  Alte Daten gelöscht');

    // Neue Daten einfügen
    const sampleData = generateSampleData();
    await SensorMesswert.insertMany(sampleData);
    console.log(`✅ ${sampleData.length} Messwerte eingefügt`);

    // Verbindung schließen
    await mongoose.connection.close();
    console.log('🔌 Verbindung geschlossen');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler beim Seeding:', error);
    process.exit(1);
  }
};

seedDatabase();


