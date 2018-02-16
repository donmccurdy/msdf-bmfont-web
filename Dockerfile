FROM node:8

# Create working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

RUN chmod a+x node_modules/msdf-bmfont-xml/bin/linux/msdfgen.linux

# Bundle source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
