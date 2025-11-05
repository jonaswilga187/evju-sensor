import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SensorMesswert from '../models/SensorMesswert.js';

dotenv.config();

// Beispieldaten generieren
const generateSampleData = () => {
  const data = [];
  const now = new Date();
  
  // 24 Stunden Daten (alle 15 Minuten)
  const intervallMinuten = 15;
  const anzahlPunkte = (24 * 60) / intervallMinuten; // 96 Punkte
  
  for (let i = 0; i < anzahlPunkte; i++) {
    const zeitstempel = new Date(now.getTime() - (anzahlPunkte - 1 - i) * intervallMinuten * 60 * 1000);
    
    // Realistische Tagesverlauf-Simulation
    const stunde = zeitstempel.getHours();
    const baseTemp = 18 + Math.sin((stunde - 6) * Math.PI / 12) * 6; // Sinuskurve für Tag/Nacht
    const baseHumidity = 70 - Math.sin((stunde - 6) * Math.PI / 12) * 15;
    const basePower = 300 + Math.sin((stunde - 8) * Math.PI / 10) * 400 + Math.random() * 100;
    
    data.push({
      zeitstempel,
      temperatur: parseFloat((baseTemp + (Math.random() - 0.5) * 2).toFixed(1)),
      luftfeuchtigkeit: parseInt(baseHumidity + (Math.random() - 0.5) * 10),
      stromverbrauch: parseInt(basePower),
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


