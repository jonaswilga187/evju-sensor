# Build Stage
FROM node:18-alpine as build

WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm install

# Source-Code kopieren
COPY . .

# Production Build erstellen
RUN npm run build

# Production Stage mit Nginx
FROM nginx:alpine

# Build-Dateien von Build Stage kopieren
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port 80 exponieren
EXPOSE 80

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]

