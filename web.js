/**
 * @project node-api-template
 * Node.js HTTP-based RESTful JSON API template
 * @file web.js
 * primary application driver
 * @author curtis zimmerman
 * @contact curtis.zimmerman@gmail.com
 * @license GPLv2
 * @version 0.0.1a
 */

var assert = require('assert');
var fs = require('fs');
var http = require('http');
var url = require('url');

var __appData = {
	debug: true,
	listenPort: 2000,
	timestamps: {
		last: 0,
		up: 0
	}
};

var __serverData = {
	clients: {}
};

var _base64 = function( data, type ) {
	var type = (typeof(type) === 'string') ? type : 'encode';
	if (type === 'decode') {
		return new Buffer(data, 'base64').toString('ascii');
	} else {
		return new Buffer(data).toString('base64');
	}
};

var _getID = function( IDLength ) {

};

var _sendFile = function( requestID, file ) {

};

var _sendStatus = function( requestID, code ) {

};

/*\
|*| pub/sub/unsub pattern utility closure
\*/
var _pubsub = (function() {
	var cache = {};
	function _flush() {
		cache = {};
	};
	function _pub( topic, args, scope ) {
		if (cache[topic]) {
			var currentTopic = cache[topic],
				topicLength = currentTopic.length;
			for (var i=0; i<topicLength; i++) {
				currentTopic[i].apply(scope || this, args || []);
			}
		}
	};
	function _sub( topic, callback ) {
		if (!cache[topic]) {
			cache[topic] = [];
		}
		cache[topic].push(callback);
		return [topic, callback];
	};
	function _unsub( handle, total ) {
		var topic = handle[0],
			cacheLength = cache[topic].length;
		if (cache[topic]) {
			for (var i=0; i<cacheLength; i++) {
				if (cache[topic][i] === handle) {
					cache[topic].splice(cache[topic][i], 1);
					if (total) {
						delete cache[topic];
					}
				}
			}
		}
	};
	return {
		flush: _flush,
		pub: _pub,
		sub: _sub,
		unsub: _unsub
	};
})();

var init = (function() {
	
})();

var api = (function() {
	var server = http.createServer(function(req, res) {

	}).on('error', function(err) {
		_log.err(err);
	}).listen( __appData.listenPort );
	_log.log('listening on tcp/'+__appData.listenPort);
})();