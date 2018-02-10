FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production

# Make msdf-bmfont binaries executable (https://github.com/soimy/msdf-bmfont-xml/issues/19)
RUN chmod a+x node_modules/msdf-bmfont-xml/bin/msdfgen.linux

# Bundle app source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
