FROM node:14
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 7028
CMD [ "node", "server.js" ]
