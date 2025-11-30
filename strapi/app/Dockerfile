FROM node:18-alpine

# Set working directory
WORKDIR /opt/app

# Install dependencies
RUN apk update && apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git

# Copy package files from strapi/app directory
COPY strapi/app/package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Copy app files from strapi/app directory
COPY strapi/app/ .

# Build admin panel
ENV NODE_ENV=production
RUN npm run build

# Expose port
EXPOSE 1337

# Start Strapi
CMD ["npm", "run", "start"]
