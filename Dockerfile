FROM node:8.7

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN yarn

COPY ./src /usr/src/app/src
RUN yarn build
RUN yarn --production

EXPOSE 6565

CMD ["yarn", "start"]
