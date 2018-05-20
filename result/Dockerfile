FROM node:8.9-alpine

RUN mkdir -p /app
WORKDIR /app

RUN npm install -g nodemon
RUN npm config set registry https://registry.npmjs.org
COPY package.json /app/package.json
# ENV NODE_PATH /node_modules
RUN rm -rf node_modules
# RUN npm cache clean --force
RUN npm install 
RUN mv /app/node_modules /node_modules
COPY . /app

ENV PORT 80
EXPOSE 80

CMD ["node", "server.js"]
