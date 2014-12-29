# DOCKER-VERSION 0.3.4

FROM google/nodejs
MAINTAINER curtis zimmerman <software@curtisz.com>

RUN apt-get install -y git
RUN mkdir -p /var/www/node-api-template/
RUN git clone https://github.com/curtiszimmerman/node-api-template /var/www/node-api-template/
WORKDIR /var/www/node-api-template/
# pm2 is having problems
# RUN npm install pm2 -g --unsafe-perm
RUN npm -g install
RUN npm install

EXPOSE 4488

CMD ["/nodejs/bin/node", "/var/www/node-api-template/api.js"]
