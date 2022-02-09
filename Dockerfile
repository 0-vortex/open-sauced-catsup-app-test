FROM node:16-alpine as development

WORKDIR /app

COPY package.json ./
COPY npm-shrinkwrap.json ./
COPY .npmrc ./
COPY *config.?js ./
COPY *config.json ./
COPY .env* ./

RUN npm install --global npm@latest
RUN npm ci

COPY src ./src

CMD [ "npm", "start"]
