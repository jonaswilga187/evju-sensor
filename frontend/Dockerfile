# Build Stage
FROM node:18-alpine as build

WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm install

# Source-Code kopieren
COPY . .

# Build Argument für API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Production Build erstellen
RUN npm run build

# Production Stage mit Nginx
FROM nginx:alpine

# openssl wird gebraucht, um beim Start das Basic-Auth-Passwort zu hashen
RUN apk add --no-cache openssl

# Build-Dateien von Build Stage kopieren
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint: erzeugt .htpasswd aus DASHBOARD_USERNAME/DASHBOARD_PASSWORD
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Port 80 exponieren
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]

