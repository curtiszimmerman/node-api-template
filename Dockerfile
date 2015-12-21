
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

FROM google/nodejs
MAINTAINER curtis zimmerman <software@curtisz.com>

ENV port 80

RUN apt-get install -y git
RUN mkdir -p /var/www/node-api-template/
RUN git clone https://github.com/curtiszimmerman/node-api-template /var/www/node-api-template/
WORKDIR /var/www/node-api-template/
# pm2 is having problems TESTING TESTING TESTING
# RUN npm install pm2 -g --unsafe-perm
# RUN npm -g install
RUN npm install

EXPOSE ${port}

CMD ["/nodejs/bin/node", "/var/www/node-api-template/app.js", "-p ${port}", "-vvvvv", "-s"]
