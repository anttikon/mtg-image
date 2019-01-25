FROM node:10.15.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY ./src /usr/src/app/src
RUN npm run build

EXPOSE 6565

CMD ["npm", "run", "start"]
