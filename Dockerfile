FROM node:16.11.1
RUN mkdir /hashed-private-code
COPY . /hashed-private-code
WORKDIR /hashed-private-code
RUN node src/index.js