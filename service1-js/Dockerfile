FROM node:14.17.3-alpine3.14

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install 
COPY ./server.js ./

CMD ["npm","start"]