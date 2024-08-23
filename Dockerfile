FROM node:alpine

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build
RUN cp -r ./src/views/ ./dist/views/
RUN cp -r ./public/ ./dist/public/

CMD ["npm", "start"]