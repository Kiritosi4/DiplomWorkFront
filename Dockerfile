FROM node:18-alpine

WORKDIR /app
COPY /vue-project/package*.json ./
RUN npm install

COPY /vue-project .

RUN npm install -g @vue/cli-service

RUN npm run build
EXPOSE 4173

CMD ["npm", "run", "preview"]
