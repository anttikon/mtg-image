FROM node:10.15.0-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/

RUN npm install

COPY ./src /usr/src/app/src
COPY .babelrc /usr/src/app/

RUN npm run build
RUN npm prune --production

EXPOSE 6565

CMD ["npm", "run", "start"]
