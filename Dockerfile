FROM node:8

# Create working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Install fork of msdfgen (https://github.com/soimy/msdf-bmfont-xml/issues/21#issuecomment-364707045)
# Make msdf-bmfont binaries executable (https://github.com/soimy/msdf-bmfont-xml/issues/19)
RUN apt-get update && apt-get install -y build-essential g++ cmake \
  && git clone https://github.com/ckohnert/msdfgen.git \
  && mkdir msdfgen/out && cd msdfgen/out && cmake .. && make \
  && cd ../.. && cp msdfgen/out/msdfgen node_modules/msdf-bmfont-xml/bin/msdfgen.linux \
  && chmod a+x node_modules/msdf-bmfont-xml/bin/msdfgen.linux

# Bundle source
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
