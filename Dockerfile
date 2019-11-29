FROM node:11

WORKDIR ./

COPY . .

COPY ./spec/config-for-dockerized-test.js /root/.config/slrp/index.js

RUN npm install -g lodash

RUN npm install

CMD [ "npm", "run", "test" ]
