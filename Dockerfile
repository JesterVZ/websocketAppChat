FROM node:20
RUN mkdir -p /root/websocketAppChatDir/node_modules && chown -R node:node /root/websocketAppChatDir/
WORKDIR /root/websocketAppChatDir
COPY package*.json ./
RUN npm install
EXPOSE 3001
CMD [ "npm", "start" ]