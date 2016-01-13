node-api-template
=================

This repository is an extensible, HTTP-based, RESTful, JSON API template. It optionally uses Redis for connection logging. It supports HTTPS connections.

###Status
[![Build Status](https://api.shippable.com/projects/540e747b3479c5ea8f9e62a7/badge?branchName=master)](https://app.shippable.com/projects/540e747b3479c5ea8f9e62a7/builds/latest)

### Installation

```sh
git clone https://github.com/curtiszimmerman/node-api-template.git
cd node-api-template
node ./app.js <OPTIONS>
```

The node-api-template application accepts some optional command-line arguments, listed below, with sane defaults. Alternatively, you may also specify the values as environment variables. You can view the usage pattern for these CLI opts with `node ./app.js --help` or `node ./app.js -h`:

```sh
Usage: ../../../../.nvm/versions/node/v4.2.1/bin/node ./app.js [OPTIONS]

Options:
  -a, --address      address to listen on. default "0.0.0.0" to appease docker.                          
  -c, --certificate  path to SSL certificate. requires key.                                              
  -d, --database     use a database (not yet implemented).                                               
  -f, --files        specify directory containing files to serve. relative to server root. default "pub".
  -k, --key          path to host key for SSL. requires certificate.                                     
  -p, --port         port to listen on. default 80 for HTTP, 443 for HTTPS.                              
  -q, --quiet        quiet operation (no console output).                                                
  -s, --static       static file server (serve any existing file in files directory). default false.     
  -v, --verbosity    loglevel verbosity (0-5). default 2.                                                
  -h, --help         this help information.  
```

Additionally, you may specify the above configuration information via environment variables. The format of the variable is `NODE_<option>` unless otherwise specified:

```sh
NODE_ADDRESS
NODE_CERTIFICATE
NODE_DATABASE
NODE_FILES
NODE_KEY
NODE_PORT
NODE_QUIET
NODE_STATIC
NODE_DEBUG (this environment variable indicates the --verbosity)
```

### Docker

This application can easily be dockerized, and a Dockerfile is provided for that purpose. Additionally, sample build and run scripts are available in the `deploy/` directory.

### Contributions

PRs are welcome. PRs with semantic or stylistic changes will not be accepted. Please adhere to common sense rules for submitting changes, and I'll get to your PR as soon as I have time. Thanks!

### License

GPLv3, baby.
