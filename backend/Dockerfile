FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm install --production

# Curl für Healthcheck installieren
RUN apk add --no-cache curl

# App-Code kopieren
COPY . .

# Port exponieren
EXPOSE 5000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:5000/health || exit 1

# Server starten
CMD ["npm", "start"]


