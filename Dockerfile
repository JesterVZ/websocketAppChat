FROM node:20
RUN mkdir -p /root/websocketAppChat/node_modules && chown -R node:node /root/websocketAppChat/
WORKDIR /root/websocketAppChat
COPY package*.json ./
RUN npm install
EXPOSE 3001
CMD [ "node", "index.js" ]