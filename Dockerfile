FROM node:12

ENV SLRP_DOCKER_TEST=true

COPY . .

COPY ./spec/config-for-dockerized-test.js /root/.config/slrp/index.js

RUN npm install -g lodash

CMD [ "npm", "run", "test" ]
