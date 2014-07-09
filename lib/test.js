/**
 * @project node-api-template
 * Node.js HTTP-based RESTful JSON API template
 * @file test.js
 * test harness website
 * @author curtis zimmerman
 * @contact software@curtisz.com
 * @license GPLv3
 * @version 0.0.1a
 */

var __test = (function() {
	/**
 	 * @cite http://www.nczonline.net/blog/2012/03/13/its-time-to-start-using-javascript-strict-mode/
 	 */
	"use strict";
	
	var __data = {
		state: {
			debug: true
		}
	};

	var _addEvent = function( element, event, handler ) {
		if (element.addEventListener) {
			element.addEventListener(event, handler, false);
		} else if (element.attachEvent) {
			element.attachEvent('on'+event, handler);
		} else {
			// client cannot handle events
		}
	};

	var _call = function( method, resource, request, async ) {
		var request = (typeof(request) === 'object') ? request : {};
		var xhr = new XMLHttpRequest();
		xhr.open(method, resource, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && __data.call.success.indexOf(xhr.status) > -1) {
				return async.success && typeof(async.success) === 'function' && async.success(JSON.parse(xhr.responseText));
			} else if (xhr.readyState == 4 && __data.call.fail.indexOf(xhr.status) > -1) {
				return async.failure && typeof(async.failure) === 'function' && async.failure();
			} else {
				_log.dbg('_call: something weird happened');
			}
		};
		xhr.send(request);
		return async.callback && typeof(async.callback) === 'function' && async.callback();
	};

	var _listeners = function() {
		//var buttonSubmit = document.getElementById('test-button');
		$( "#test-button" ).click(function() {
			_page.submit();
		});
	};

	var _log = (function() {
		var _con = function( data, type ) {
			var pre = ['[i] DEBUG: ', '[!] ERROR: ', '[+] '];
			console.log(pre[type]+data);
		};
		var _dbg = function( data ) {
			if (__data.state.debug === true) _con(data, 0);
		};
		var _err = function( data ) {
			_con(data, 1);
		};
		var _log = function( data ) {
			_con(data, 2);
		};
		return {
			dbg: _dbg,
			err: _err,
			log: _log
		};
	})();

	var _page = (function() {
		var _submit = function() {
			// phone home
		};
		return {
			submit: _submit
		};
	})();

	var _unittest = function( callback ) {
		mocha.setup('tdd');
		mocha.reporter('html');
		if (navigator.userAgent.indexOf('PhantomJS') < 0) {
			mocha.run();
		}
		return callback && typeof(callback) === 'function' && callback();
	};

	var init = function() {
		_unittest(function() {
			_listeners();
		});
		_log.dbg('initialization complete');
	};

	var IPL = (function() {
		_log.log('IPL')
		_addEvent(window, 'load', init);
	})();
})();