FROM node:14-alpine


WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install && npm install typescript -g
COPY . .
COPY ./dist ./
RUN tsc

ENV NODE_ENV=production

EXPOSE 5000 8000

CMD [ "node", "./build/src/index.js" ]