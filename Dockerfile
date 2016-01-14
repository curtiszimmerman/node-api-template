
 #################################################################
###    ###    ###    #  ##  #     #     ##     #    #  ####     ###
### ##  #  ##  #  ####  #  ##  ####  ##  #  #####  ##  ####  ######
### ##  #  ##  #  ####    ###     #     ##     ##  ##  ####     ###
### ##  #  ##  #  ####  #  ##  ####  ##  #  #####  ##  ####  ######
###    ###    ###    #  ##  #     #  ##  #  ####    #     #     ###
 #################################################################

# ________-=< to get a shell on the running container >=-________ #
#/                                                               \#
#|             docker exec myContainer -it /bin/bash             |#
#\_______________________________________________________________/#

FROM node:4.2.4
MAINTAINER curtis zimmerman <software@curtisz.com>

ARG BASEBUILD
RUN echo "Building basebuild ${BASEBUILD}..."

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y git

ARG VERSION
RUN echo "Building version ${VERSION}..."

RUN mkdir -p /var/www/node-api-template/
RUN git clone https://github.com/curtiszimmerman/node-api-template /var/www/node-api-template/
WORKDIR /var/www/node-api-template/
# pm2 is having problems TESTING TESTING TESTING
# RUN npm install pm2 -g --unsafe-perm
# RUN npm -g install
RUN npm install

CMD "/usr/local/bin/node /var/www/node-api-template/app.js"
