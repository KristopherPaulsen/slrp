FROM node:11

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

COPY ./spec/config-slrp-index.js /root/.config/slrp/index.js

RUN npm install -g lodash

RUN npm install

COPY . .

CMD [ "npm", "run", "test" ]
