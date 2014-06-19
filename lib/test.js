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
	var addEvent = function( element, event, handler ) {
		if (element.addEventListener) {
			element.addEventListener(event, handler, false);
		} else if (element.attachEvent) {
			element.attachEvent('on'+event, handler);
		} else {
			// client cannot handle events
		}
	}
})();