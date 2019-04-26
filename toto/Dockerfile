FROM node:10-alpine

RUN mkdir -p /opt && mkdir -p /opt/toto

ADD . /opt/toto

WORKDIR /opt/toto

RUN npm install && npm run build

CMD ["node", "./server/index.js"]
