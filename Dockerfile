FROM node:12

COPY . .

COPY ./spec/config-for-dockerized-test.js /root/.config/slrp/index.js

RUN npm install -g lodash

CMD [ "npm", "run", "test" ]
