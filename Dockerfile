FROM node:8

# Create working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Bundle source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
