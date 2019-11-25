FROM node:13.1.0-alpine3.10

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/

RUN npm install --production

COPY ./src /usr/src/app/src

EXPOSE 6565

CMD ["npm", "run", "start"]
