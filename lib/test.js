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

/**
 * @cite http://www.nczonline.net/blog/2012/03/13/its-time-to-start-using-javascript-strict-mode/
 */
"use strict";

var __test = (function() {
	var __appData = {
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

	var _log = (function() {
		var _con = function( data, type ) {
			var pre = ['[i] DEBUG: ', '[!] ERROR: ', '[+] '];
			console.log(pre[type]+data);
		};
		var _dbg = function( data ) {
			if (__appData.state.debug === true) _con(data, 0);
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

	var init = function() {
		_log.dbg('initialization complete');
	};

	var IPL = (function() {
		_log.log('IPL')
		_addEvent(window, 'load', init);
	})();
})();