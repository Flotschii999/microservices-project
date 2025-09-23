FROM node:14.17.3-alpine3.14

WORKDIR /app

RUN npm install 

# copy everything form the host into the container
COPY app/ .

CMD ["npm","start"]