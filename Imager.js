(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Imager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _addEvent$applyEach$getKeys = require('./src/shims.js');

var _returnFn$noop$trueFn$debounce = require('./src/utils.js');

var _import = require('./src/transforms.js');

var transforms = _interopRequireWildcard(_import);

'use strict';

var doc = document;
var defaultWidths = [96, 130, 165, 200, 235, 270, 304, 340, 375, 410, 445, 485, 520, 555, 590, 625, 660, 695, 736];

/*
    Construct a new Imager instance, passing an optional configuration object.

    Example usage:

        {
            // Available widths for your images
            availableWidths: [Number],

            // Selector to be used to locate your div placeholders
            selector: '',

            // Class name to give your resizable images
            className: '',

            // If set to true, Imager will update the src attribute of the relevant images
            onResize: Boolean,

            // Toggle the lazy load functionality on or off
            lazyload: Boolean,

            // Used alongside the lazyload feature (helps performance by setting a higher delay)
            scrollDelay: Number
        }

    @param {object} configuration settings
    @return {object} instance of Imager
 */

var Imager = (function () {
    function Imager(elements) {
        var _this = this;

        var opts = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, Imager);

        if (elements === undefined) {
            throw new Error('Imager.js now expects the first argument to be either a CSS string selector or a collection of HTMLElement.');
        }

        // selector string (not elements)
        if (typeof elements === 'string') {
            opts.selector = elements;
            elements = undefined;
        }

        // 'opts' object (not elements)
        else if (typeof elements.length === 'undefined') {
            opts = elements;
            elements = undefined;
        }

        this.viewportHeight = doc.documentElement.clientHeight;
        this.selector = !elements ? opts.selector || '.delayed-image-load' : null;
        this.className = opts.className || 'image-replace';
        this.gif = doc.createElement('img');
        this.gif.src = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7';
        this.gif.className = this.className;
        this.gif.alt = '';
        this.lazyloadOffset = opts.lazyloadOffset || 0;
        this.scrollDelay = opts.scrollDelay || 250;
        this.onResize = opts.hasOwnProperty('onResize') ? opts.onResize : true;
        this.lazyload = opts.hasOwnProperty('lazyload') ? opts.lazyload : false;
        this.scrolled = false;
        this.availablePixelRatios = opts.availablePixelRatios || [1, 2];
        this.availableWidths = opts.availableWidths || defaultWidths;
        this.onImagesReplaced = opts.onImagesReplaced || _returnFn$noop$trueFn$debounce.noop;
        this.widthsMap = {};
        this.refreshPixelRatio();
        this.widthInterpolator = opts.widthInterpolator || _returnFn$noop$trueFn$debounce.returnFn;

        // Needed as IE8 adds a default `width`/`height` attribute…
        this.gif.removeAttribute('height');
        this.gif.removeAttribute('width');

        if (typeof this.availableWidths !== 'function') {
            if (typeof this.availableWidths.length === 'number') {
                this.widthsMap = Imager.createWidthsMap(this.availableWidths, this.widthInterpolator, this.devicePixelRatio);
            } else {
                this.widthsMap = this.availableWidths;
                this.availableWidths = _addEvent$applyEach$getKeys.getKeys(this.availableWidths);
            }

            this.availableWidths = this.availableWidths.sort(function (a, b) {
                return a - b;
            });
        }

        this.divs = [];
        this.add(elements || this.selector);
        this.ready(opts.onReady);

        setTimeout(function () {
            return _this.init();
        }, 0);
    }

    _createClass(Imager, [{
        key: 'init',
        value: function init() {
            var _this2 = this;

            this.initialized = true;
            var filterFn = _returnFn$noop$trueFn$debounce.trueFn;

            if (this.lazyload) {
                this.registerScrollEvent();

                this.scrolled = true;
                this.scrollCheck();

                filterFn = function (element) {
                    return _this2.isPlaceholder(element) === false;
                };
            } else {
                this.checkImagesNeedReplacing(this.divs);
            }

            if (this.onResize) {
                this.registerResizeEvent(filterFn);
            }

            this.onReady();
        }
    }, {
        key: 'ready',

        /**
         * Executes a function when Imager is ready to work
         * It acts as a convenient/shortcut for `new Imager({ onReady: fn })`
         *
         * @since 0.3.1
         * @param {Function} fn
         */
        value: function ready(fn) {
            this.onReady = fn || _returnFn$noop$trueFn$debounce.noop;
        }
    }, {
        key: 'add',
        value: function add(elementsOrSelector) {

            elementsOrSelector = elementsOrSelector || this.selector;
            var elements = typeof elementsOrSelector === 'string' ? document.querySelectorAll(elementsOrSelector) : // Selector
            elementsOrSelector; // Elements (NodeList or array of Nodes)

            if (elements && elements.length) {
                var additional = _addEvent$applyEach$getKeys.applyEach(elements, _returnFn$noop$trueFn$debounce.returnFn);
                this.changeDivsToEmptyImages(additional);
                this.divs = this.divs.concat(additional);
            }
        }
    }, {
        key: 'scrollCheck',
        value: function scrollCheck() {
            var _this3 = this;

            var offscreenImageCount = 0;
            var elements = [];

            if (this.scrolled) {
                // collects a subset of not-yet-responsive images and not offscreen anymore
                _addEvent$applyEach$getKeys.applyEach(this.divs, function (element) {
                    if (_this3.isPlaceholder(element)) {
                        ++offscreenImageCount;

                        if (_this3.isThisElementOnScreen(element)) {
                            elements.push(element);
                        }
                    }
                });

                if (offscreenImageCount === 0) {
                    window.clearInterval(this.interval);
                }

                this.changeDivsToEmptyImages(elements);
                this.scrolled = false;
            }
        }
    }, {
        key: 'createGif',
        value: function createGif(element) {
            // if the element is already a responsive image then we don't replace it again
            if (element.className.match(new RegExp('(^| )' + this.className + '( |$)'))) {
                return element;
            }

            var elementClassName = element.getAttribute('data-class');
            var elementWidth = element.getAttribute('data-width');
            var gif = this.gif.cloneNode(false);

            if (elementWidth) {
                gif.width = elementWidth;
                gif.setAttribute('data-width', elementWidth);
            }

            gif.className = (elementClassName ? elementClassName + ' ' : '') + this.className;
            gif.setAttribute('data-src', element.getAttribute('data-src'));
            gif.setAttribute('alt', element.getAttribute('data-alt') || this.gif.alt);

            element.parentNode.replaceChild(gif, element);

            return gif;
        }
    }, {
        key: 'changeDivsToEmptyImages',
        value: function changeDivsToEmptyImages(elements) {
            var _this4 = this;

            _addEvent$applyEach$getKeys.applyEach(elements, function (element, i) {
                elements[i] = _this4.createGif(element);
            });

            if (this.initialized) {
                this.checkImagesNeedReplacing(elements);
            }
        }
    }, {
        key: 'isPlaceholder',

        /**
         * Indicates if an element is an Imager placeholder
         *
         * @since 1.3.1
         * @param {HTMLImageElement} element
         * @returns {boolean}
         */
        value: function isPlaceholder(element) {
            return element.src === this.gif.src;
        }
    }, {
        key: 'isThisElementOnScreen',

        /**
         * Returns true if an element is located within a screen offset.
         *
         * @param {HTMLElement} element
         * @returns {boolean}
         */
        value: function isThisElementOnScreen(element) {
            // document.body.scrollTop was working in Chrome but didn't work on Firefox, so had to resort to window.pageYOffset
            // but can't fallback to document.body.scrollTop as that doesn't work in IE with a doctype (?) so have to use document.documentElement.scrollTop
            var elementOffsetTop = 0;
            var offset = Imager.getPageOffset() + this.lazyloadOffset;

            if (element.offsetParent) {
                do {
                    elementOffsetTop += element.offsetTop;
                } while (element = element.offsetParent);
            }

            return elementOffsetTop < this.viewportHeight + offset;
        }
    }, {
        key: 'checkImagesNeedReplacing',
        value: function checkImagesNeedReplacing(images, filterFn) {
            var _this5 = this;

            filterFn = filterFn || _returnFn$noop$trueFn$debounce.trueFn;

            if (!this.isResizing) {
                this.isResizing = true;
                this.refreshPixelRatio();

                _addEvent$applyEach$getKeys.applyEach(images, function (image) {
                    if (filterFn(image)) {
                        _this5.replaceImagesBasedOnScreenDimensions(image);
                    }
                });

                this.isResizing = false;
                this.onImagesReplaced(images);
            }
        }
    }, {
        key: 'replaceImagesBasedOnScreenDimensions',

        /**
         * Upgrades an image from an empty placeholder to a fully sourced image element
         *
         * @param {HTMLImageElement} image
         */
        value: function replaceImagesBasedOnScreenDimensions(image) {
            var computedWidth, naturalWidth;

            naturalWidth = Imager.getNaturalWidth(image);
            computedWidth = typeof this.availableWidths === 'function' ? this.availableWidths(image) : this.determineAppropriateResolution(image);

            image.width = computedWidth;

            if (!this.isPlaceholder(image) && computedWidth <= naturalWidth) {
                return;
            }

            image.src = this.changeImageSrcToUseNewImageDimensions(image.getAttribute('data-src'), computedWidth);
            image.removeAttribute('width');
            image.removeAttribute('height');
        }
    }, {
        key: 'determineAppropriateResolution',
        value: function determineAppropriateResolution(image) {
            return Imager.getClosestValue(image.getAttribute('data-width') || image.parentNode.clientWidth, this.availableWidths);
        }
    }, {
        key: 'refreshPixelRatio',

        /**
         * Updates the device pixel ratio value used by Imager
         *
         * It is performed before each replacement loop, in case a user zoomed in/out
         * and thus updated the `window.devicePixelRatio` value.
         *
         * @api
         * @since 1.0.1
         */
        value: function refreshPixelRatio() {
            this.devicePixelRatio = Imager.getClosestValue(Imager.getPixelRatio(), this.availablePixelRatios);
        }
    }, {
        key: 'changeImageSrcToUseNewImageDimensions',
        value: function changeImageSrcToUseNewImageDimensions(src, selectedWidth) {
            return src.replace(/{width}/g, transforms.width(selectedWidth, this.widthsMap)).replace(/{pixel_ratio}/g, transforms.pixelRatio(this.devicePixelRatio));
        }
    }, {
        key: 'registerResizeEvent',
        value: function registerResizeEvent(filterFn) {
            var _this6 = this;

            _addEvent$applyEach$getKeys.addEvent(window, 'resize', _returnFn$noop$trueFn$debounce.debounce(function () {
                return _this6.checkImagesNeedReplacing(_this6.divs, filterFn);
            }, 100));
        }
    }, {
        key: 'registerScrollEvent',
        value: function registerScrollEvent() {
            var _this7 = this;

            this.scrolled = false;

            this.interval = window.setInterval(function () {
                return _this7.scrollCheck();
            }, this.scrollDelay);

            _addEvent$applyEach$getKeys.addEvent(window, 'scroll', function () {
                _this7.scrolled = true;
            });

            _addEvent$applyEach$getKeys.addEvent(window, 'resize', function () {
                _this7.viewportHeight = document.documentElement.clientHeight;
                _this7.scrolled = true;
            });
        }
    }], [{
        key: 'getPixelRatio',
        value: function getPixelRatio(context) {
            return (context || window).devicePixelRatio || 1;
        }
    }, {
        key: 'createWidthsMap',
        value: function createWidthsMap(widths, interpolator, pixelRatio) {
            var map = {},
                i = widths.length;

            while (i--) {
                map[widths[i]] = interpolator(widths[i], pixelRatio);
            }

            return map;
        }
    }, {
        key: 'getClosestValue',

        /**
         * Returns the closest upper value.
         *
         * ```js
         * var candidates = [1, 1.5, 2];
         *
         * Imager.getClosestValue(0.8, candidates); // -> 1
         * Imager.getClosestValue(1, candidates); // -> 1
         * Imager.getClosestValue(1.3, candidates); // -> 1.5
         * Imager.getClosestValue(3, candidates); // -> 2
         * ```
         *
         * @api
         * @since 1.0.1
         * @param {Number} baseValue
         * @param {Array.<Number>} candidates
         * @returns {Number}
         */
        value: function getClosestValue(baseValue, candidates) {
            var i = candidates.length,
                selectedWidth = candidates[i - 1];

            baseValue = parseFloat(baseValue);

            while (i--) {
                if (baseValue <= candidates[i]) {
                    selectedWidth = candidates[i];
                }
            }

            return selectedWidth;
        }
    }, {
        key: 'getPageOffsetGenerator',
        value: function getPageOffsetGenerator(testCase) {
            if (testCase) {
                return function () {
                    return window.pageYOffset;
                };
            } else {
                return function () {
                    return document.documentElement.scrollTop;
                };
            }
        }
    }]);

    return Imager;
})();

exports['default'] = Imager;

/**
 * Returns the naturalWidth of an image element.
 *
 * @since 1.3.1
 * @param {HTMLImageElement} image
 * @return {Number} Image width in pixels
 */
Imager.getNaturalWidth = (function () {
    if ('naturalWidth' in new Image()) {
        return function (image) {
            return image.naturalWidth;
        };
    }
    // non-HTML5 browsers workaround
    return function (image) {
        var imageCopy = document.createElement('img');
        imageCopy.src = image.src;
        return imageCopy.width;
    };
})();

// This form is used because it seems impossible to stub `window.pageYOffset`
Imager.getPageOffset = Imager.getPageOffsetGenerator(Object.prototype.hasOwnProperty.call(window, 'pageYOffset'));

// Exporting for testing and convenience purpose
Imager.applyEach = _addEvent$applyEach$getKeys.applyEach;
Imager.addEvent = _addEvent$applyEach$getKeys.addEvent;
Imager.debounce = _returnFn$noop$trueFn$debounce.debounce;
module.exports = exports['default'];

},{"./src/shims.js":2,"./src/transforms.js":3,"./src/utils.js":4}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.applyEach = applyEach;
'use strict';

var addEvent = (function () {
    if (document.addEventListener) {
        return function addStandardEventListener(el, eventName, fn) {
            return el.addEventListener(eventName, fn, false);
        };
    } else {
        return function addIEEventListener(el, eventName, fn) {
            return el.attachEvent('on' + eventName, fn);
        };
    }
})();

exports.addEvent = addEvent;

function applyEach(collection, callbackEach) {
    var i = 0,
        length = collection.length,
        new_collection = [];

    for (; i < length; i++) {
        new_collection[i] = callbackEach(collection[i], i);
    }

    return new_collection;
}

;

var getKeys = typeof Object.keys === 'function' ? Object.keys : function (object) {
    var keys = [],
        key;

    for (key in object) {
        keys.push(key);
    }

    return keys;
};
exports.getKeys = getKeys;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.pixelRatio = pixelRatio;
exports.width = width;
'use strict';

function pixelRatio(value) {
    return value === 1 ? '' : '-' + value + 'x';
}

function width(width, map) {
    return map[width] || width;
}

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.returnFn = returnFn;
exports.noop = noop;
exports.trueFn = trueFn;
exports.debounce = debounce;
'use strict';

function returnFn(value) {
    return value;
}

function noop() {}

function trueFn() {
    return true;
}

function debounce(fn, wait) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function later() {
            timeout = null;
            fn.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvdGhvbWFzcGEvUHJvamVjdHMvaW1hZ2VyLWpzL2luZGV4LmpzIiwiL1VzZXJzL3Rob21hc3BhL1Byb2plY3RzL2ltYWdlci1qcy9zcmMvc2hpbXMuanMiLCIvVXNlcnMvdGhvbWFzcGEvUHJvamVjdHMvaW1hZ2VyLWpzL3NyYy90cmFuc2Zvcm1zLmpzIiwiL1VzZXJzL3Rob21hc3BhL1Byb2plY3RzL2ltYWdlci1qcy9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7MENDRTZDLGdCQUFnQjs7NkNBQ1osZ0JBQWdCOztzQkFDckMscUJBQXFCOztJQUFyQyxVQUFVOztBQUp0QixZQUFZLENBQUM7O0FBTWIsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDO0FBQ3JCLElBQU0sYUFBYSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLE1BQU07QUFDWCxhQURLLE1BQU0sQ0FDVixRQUFRLEVBQWE7OztZQUFYLElBQUksZ0NBQUcsRUFBRTs7OEJBRGYsTUFBTTs7QUFHbkIsWUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQ3hCLGtCQUFNLElBQUksS0FBSyxDQUFDLDZHQUE2RyxDQUFDLENBQUE7U0FDakk7OztBQUdELFlBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO0FBQzlCLGdCQUFJLENBQUMsUUFB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SyxFQUFFLEdBQUcsRUFBRTtBQUMvQixXQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUM7Q0FDOUI7Ozs7Ozs7O1FDTmUsUUFBUSxHQUFSLFFBQVE7UUFJUixJQUFJLEdBQUosSUFBSTtRQUdKLE1BQU0sR0FBTixNQUFNO1FBSU4sUUFBUSxHQUFSLFFBQVE7QUFieEIsWUFBWSxDQUFDOztBQUVOLFNBQVMsUUFBUSxDQUFFLEtBQUssRUFBRTtBQUM3QixXQUFPLEtBQUssQ0FBQztDQUNoQjs7QUFFTSxTQUFTLElBQUksR0FBSSxFQUN2Qjs7QUFFTSxTQUFTLE1BQU0sR0FBSTtBQUN0QixXQUFPLElBQUksQ0FBQztDQUNmOztBQUVNLFNBQVMsUUFBUSxDQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUU7QUFDaEMsUUFBSSxPQUFPLENBQUM7QUFDWixXQUFPLFlBQVk7QUFDZixZQUFJLE9BQU8sR0FBRyxJQUFJO1lBQUUsSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUNyQyxZQUFJLEtBQUssR0FBRyxpQkFBWTtBQUNwQixtQkFBTyxHQUFHLElBQUksQ0FBQztBQUNmLGNBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzNCLENBQUM7QUFDRixvQkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3RCLGVBQU8sR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3JDLENBQUM7Q0FDTCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGFkZEV2ZW50LCBhcHBseUVhY2gsIGdldEtleXMgfSBmcm9tICcuL3NyYy9zaGltcy5qcyc7XG5pbXBvcnQgeyByZXR1cm5Gbiwgbm9vcCwgdHJ1ZUZuLCBkZWJvdW5jZSB9IGZyb20gJy4vc3JjL3V0aWxzLmpzJztcbmltcG9ydCAqIGFzIHRyYW5zZm9ybXMgZnJvbSAnLi9zcmMvdHJhbnNmb3Jtcy5qcyc7XG5cbmNvbnN0IGRvYyA9IGRvY3VtZW50O1xuY29uc3QgZGVmYXVsdFdpZHRocyA9IFs5NiwgMTMwLCAxNjUsIDIwMCwgMjM1LCAyNzAsIDMwNCwgMzQwLCAzNzUsIDQxMCwgNDQ1LCA0ODUsIDUyMCwgNTU1LCA1OTAsIDYyNSwgNjYwLCA2OTUsIDczNl07XG5cblxuLypcbiAgICBDb25zdHJ1Y3QgYSBuZXcgSW1hZ2VyIGluc3RhbmNlLCBwYXNzaW5nIGFuIG9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuXG4gICAgRXhhbXBsZSB1c2FnZTpcblxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBBdmFpbGFibGUgd2lkdGhzIGZvciB5b3VyIGltYWdlc1xuICAgICAgICAgICAgYXZhaWxhYmxlV2lkdGhzOiBbTnVtYmVyXSxcblxuICAgICAgICAgICAgLy8gU2VsZWN0b3IgdG8gYmUgdXNlZCB0byBsb2NhdGUgeW91ciBkaXYgcGxhY2Vob2xkZXJzXG4gICAgICAgICAgICBzZWxlY3RvcjogJycsXG5cbiAgICAgICAgICAgIC8vIENsYXNzIG5hbWUgdG8gZ2l2ZSB5b3VyIHJlc2l6YWJsZSBpbWFnZXNcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJycsXG5cbiAgICAgICAgICAgIC8vIElmIHNldCB0byB0cnVlLCBJbWFnZXIgd2lsbCB1cGRhdGUgdGhlIHNyYyBhdHRyaWJ1dGUgb2YgdGhlIHJlbGV2YW50IGltYWdlc1xuICAgICAgICAgICAgb25SZXNpemU6IEJvb2xlYW4sXG5cbiAgICAgICAgICAgIC8vIFRvZ2dsZSB0aGUgbGF6eSBsb2FkIGZ1bmN0aW9uYWxpdHkgb24gb3Igb2ZmXG4gICAgICAgICAgICBsYXp5bG9hZDogQm9vbGVhbixcblxuICAgICAgICAgICAgLy8gVXNlZCBhbG9uZ3NpZGUgdGhlIGxhenlsb2FkIGZlYXR1cmUgKGhlbHBzIHBlcmZvcm1hbmNlIGJ5IHNldHRpbmcgYSBoaWdoZXIgZGVsYXkpXG4gICAgICAgICAgICBzY3JvbGxEZWxheTogTnVtYmVyXG4gICAgICAgIH1cblxuICAgIEBwYXJhbSB7b2JqZWN0fSBjb25maWd1cmF0aW9uIHNldHRpbmdzXG4gICAgQHJldHVybiB7b2JqZWN0fSBpbnN0YW5jZSBvZiBJbWFnZXJcbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWFnZXIge1xuICAgIGNvbnN0cnVjdG9yIChlbGVtZW50cywgb3B0cyA9IHt9KSB7XG5cbiAgICAgICAgaWYgKGVsZW1lbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW1hZ2VyLmpzIG5vdyBleHBlY3RzIHRoZSBmaXJzdCBhcmd1bWVudCB0byBiZSBlaXRoZXIgYSBDU1Mgc3RyaW5nIHNlbGVjdG9yIG9yIGEgY29sbGVjdGlvbiBvZiBIVE1MRWxlbWVudC4nKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2VsZWN0b3Igc3RyaW5nIChub3QgZWxlbWVudHMpXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvcHRzLnNlbGVjdG9yID0gZWxlbWVudHM7XG4gICAgICAgICAgICBlbGVtZW50cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdvcHRzJyBvYmplY3QgKG5vdCBlbGVtZW50cylcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGVsZW1lbnRzLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9wdHMgPSBlbGVtZW50cztcbiAgICAgICAgICAgIGVsZW1lbnRzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52aWV3cG9ydEhlaWdodCA9IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICB0aGlzLnNlbGVjdG9yID0gIWVsZW1lbnRzID8gKG9wdHMuc2VsZWN0b3IgfHwgJy5kZWxheWVkLWltYWdlLWxvYWQnKSA6IG51bGw7XG4gICAgICAgIHRoaXMuY2xhc3NOYW1lID0gb3B0cy5jbGFzc05hbWUgfHwgJ2ltYWdlLXJlcGxhY2UnO1xuICAgICAgICB0aGlzLmdpZiA9IGRvYy5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgdGhpcy5naWYuc3JjID0gJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEVBQUpBSUFBQVAvLy93QUFBQ0g1QkFFQUFBQUFMQUFBQUFBUUFBa0FBQUlLaEkrcHkrMFBvNXlVRlFBNyc7XG4gICAgICAgIHRoaXMuZ2lmLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lO1xuICAgICAgICB0aGlzLmdpZi5hbHQgPSAnJztcbiAgICAgICAgdGhpcy5sYXp5bG9hZE9mZnNldCA9IG9wdHMubGF6eWxvYWRPZmZzZXQgfHwgMDtcbiAgICAgICAgdGhpcy5zY3JvbGxEZWxheSA9IG9wdHMuc2Nyb2xsRGVsYXkgfHwgMjUwO1xuICAgICAgICB0aGlzLm9uUmVzaXplID0gb3B0cy5oYXNPd25Qcm9wZXJ0eSgnb25SZXNpemUnKSA/IG9wdHMub25SZXNpemUgOiB0cnVlO1xuICAgICAgICB0aGlzLmxhenlsb2FkID0gb3B0cy5oYXNPd25Qcm9wZXJ0eSgnbGF6eWxvYWQnKSA/IG9wdHMubGF6eWxvYWQgOiBmYWxzZTtcbiAgICAgICAgdGhpcy5zY3JvbGxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF2YWlsYWJsZVBpeGVsUmF0aW9zID0gb3B0cy5hdmFpbGFibGVQaXhlbFJhdGlvcyB8fCBbMSwgMl07XG4gICAgICAgIHRoaXMuYXZhaWxhYmxlV2lkdGhzID0gb3B0cy5hdmFpbGFibGVXaWR0aHMgfHwgZGVmYXVsdFdpZHRocztcbiAgICAgICAgdGhpcy5vbkltYWdlc1JlcGxhY2VkID0gb3B0cy5vbkltYWdlc1JlcGxhY2VkIHx8IG5vb3A7XG4gICAgICAgIHRoaXMud2lkdGhzTWFwID0ge307XG4gICAgICAgIHRoaXMucmVmcmVzaFBpeGVsUmF0aW8oKTtcbiAgICAgICAgdGhpcy53aWR0aEludGVycG9sYXRvciA9IG9wdHMud2lkdGhJbnRlcnBvbGF0b3IgfHwgcmV0dXJuRm47XG5cbiAgICAgICAgLy8gTmVlZGVkIGFzIElFOCBhZGRzIGEgZGVmYXVsdCBgd2lkdGhgL2BoZWlnaHRgIGF0dHJpYnV0ZeKAplxuICAgICAgICB0aGlzLmdpZi5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgICAgICB0aGlzLmdpZi5yZW1vdmVBdHRyaWJ1dGUoJ3dpZHRoJyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmF2YWlsYWJsZVdpZHRocyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmF2YWlsYWJsZVdpZHRocy5sZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aHNNYXAgPSBJbWFnZXIuY3JlYXRlV2lkdGhzTWFwKHRoaXMuYXZhaWxhYmxlV2lkdGhzLCB0aGlzLndpZHRoSW50ZXJwb2xhdG9yLCB0aGlzLmRldmljZVBpeGVsUmF0aW8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aHNNYXAgPSB0aGlzLmF2YWlsYWJsZVdpZHRocztcbiAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZVdpZHRocyA9IGdldEtleXModGhpcy5hdmFpbGFibGVXaWR0aHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmF2YWlsYWJsZVdpZHRocyA9IHRoaXMuYXZhaWxhYmxlV2lkdGhzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGl2cyA9IFtdO1xuICAgICAgICB0aGlzLmFkZChlbGVtZW50cyB8fCB0aGlzLnNlbGVjdG9yKTtcbiAgICAgICAgdGhpcy5yZWFkeShvcHRzLm9uUmVhZHkpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0KCksIDApO1xuICAgIH1cblxuICAgIGluaXQgKCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGZpbHRlckZuID0gdHJ1ZUZuO1xuXG4gICAgICAgIGlmICh0aGlzLmxhenlsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2Nyb2xsRXZlbnQoKTtcblxuICAgICAgICAgICAgdGhpcy5zY3JvbGxlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbENoZWNrKCk7XG5cbiAgICAgICAgICAgIGZpbHRlckZuID0gKGVsZW1lbnQpID0+IHRoaXMuaXNQbGFjZWhvbGRlcihlbGVtZW50KSA9PT0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrSW1hZ2VzTmVlZFJlcGxhY2luZyh0aGlzLmRpdnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub25SZXNpemUpIHtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJSZXNpemVFdmVudChmaWx0ZXJGbik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9uUmVhZHkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdoZW4gSW1hZ2VyIGlzIHJlYWR5IHRvIHdvcmtcbiAgICAgKiBJdCBhY3RzIGFzIGEgY29udmVuaWVudC9zaG9ydGN1dCBmb3IgYG5ldyBJbWFnZXIoeyBvblJlYWR5OiBmbiB9KWBcbiAgICAgKlxuICAgICAqIEBzaW5jZSAwLjMuMVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICovXG4gICAgcmVhZHkgKGZuKSB7XG4gICAgICAgIHRoaXMub25SZWFkeSA9IGZuIHx8IG5vb3A7XG4gICAgfVxuXG4gICAgYWRkIChlbGVtZW50c09yU2VsZWN0b3IpIHtcblxuICAgICAgICBlbGVtZW50c09yU2VsZWN0b3IgPSBlbGVtZW50c09yU2VsZWN0b3IgfHwgdGhpcy5zZWxlY3RvcjtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gdHlwZW9mIGVsZW1lbnRzT3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtZW50c09yU2VsZWN0b3IpIDogLy8gU2VsZWN0b3JcbiAgICAgICAgICAgIGVsZW1lbnRzT3JTZWxlY3RvcjsgLy8gRWxlbWVudHMgKE5vZGVMaXN0IG9yIGFycmF5IG9mIE5vZGVzKVxuXG4gICAgICAgIGlmIChlbGVtZW50cyAmJiBlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsID0gYXBwbHlFYWNoKGVsZW1lbnRzLCByZXR1cm5Gbik7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpdnNUb0VtcHR5SW1hZ2VzKGFkZGl0aW9uYWwpO1xuICAgICAgICAgICAgdGhpcy5kaXZzID0gdGhpcy5kaXZzLmNvbmNhdChhZGRpdGlvbmFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNjcm9sbENoZWNrICgpIHtcbiAgICAgICAgdmFyIG9mZnNjcmVlbkltYWdlQ291bnQgPSAwO1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBbXTtcblxuICAgICAgICBpZiAodGhpcy5zY3JvbGxlZCkge1xuICAgICAgICAgICAgLy8gY29sbGVjdHMgYSBzdWJzZXQgb2Ygbm90LXlldC1yZXNwb25zaXZlIGltYWdlcyBhbmQgbm90IG9mZnNjcmVlbiBhbnltb3JlXG4gICAgICAgICAgICBhcHBseUVhY2godGhpcy5kaXZzLCAoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgKytvZmZzY3JlZW5JbWFnZUNvdW50O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVGhpc0VsZW1lbnRPblNjcmVlbihlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAob2Zmc2NyZWVuSW1hZ2VDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpdnNUb0VtcHR5SW1hZ2VzKGVsZW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNyZWF0ZUdpZiAoZWxlbWVudCkge1xuICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyBhbHJlYWR5IGEgcmVzcG9uc2l2ZSBpbWFnZSB0aGVuIHdlIGRvbid0IHJlcGxhY2UgaXQgYWdhaW5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhefCApJyArIHRoaXMuY2xhc3NOYW1lICsgJyggfCQpJykpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbGVtZW50Q2xhc3NOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2xhc3MnKTtcbiAgICAgICAgdmFyIGVsZW1lbnRXaWR0aCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXdpZHRoJyk7XG4gICAgICAgIHZhciBnaWYgPSB0aGlzLmdpZi5jbG9uZU5vZGUoZmFsc2UpO1xuXG4gICAgICAgIGlmIChlbGVtZW50V2lkdGgpIHtcbiAgICAgICAgICAgIGdpZi53aWR0aCA9IGVsZW1lbnRXaWR0aDtcbiAgICAgICAgICAgIGdpZi5zZXRBdHRyaWJ1dGUoJ2RhdGEtd2lkdGgnLCBlbGVtZW50V2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2lmLmNsYXNzTmFtZSA9IChlbGVtZW50Q2xhc3NOYW1lID8gZWxlbWVudENsYXNzTmFtZSArICcgJyA6ICcnKSArIHRoaXMuY2xhc3NOYW1lO1xuICAgICAgICBnaWYuc2V0QXR0cmlidXRlKCdkYXRhLXNyYycsIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpKTtcbiAgICAgICAgZ2lmLnNldEF0dHJpYnV0ZSgnYWx0JywgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYWx0JykgfHwgdGhpcy5naWYuYWx0KTtcblxuICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGdpZiwgZWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIGdpZjtcbiAgICB9XG5cbiAgICBjaGFuZ2VEaXZzVG9FbXB0eUltYWdlcyAoZWxlbWVudHMpIHtcbiAgICAgICAgYXBwbHlFYWNoKGVsZW1lbnRzLCAoZWxlbWVudCwgaSkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudHNbaV0gPSB0aGlzLmNyZWF0ZUdpZihlbGVtZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJbWFnZXNOZWVkUmVwbGFjaW5nKGVsZW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluZGljYXRlcyBpZiBhbiBlbGVtZW50IGlzIGFuIEltYWdlciBwbGFjZWhvbGRlclxuICAgICAqXG4gICAgICogQHNpbmNlIDEuMy4xXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNQbGFjZWhvbGRlciAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudC5zcmMgPT09IHRoaXMuZ2lmLnNyYztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgYW4gZWxlbWVudCBpcyBsb2NhdGVkIHdpdGhpbiBhIHNjcmVlbiBvZmZzZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNUaGlzRWxlbWVudE9uU2NyZWVuIChlbGVtZW50KSB7XG4gICAgICAgIC8vIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHdhcyB3b3JraW5nIGluIENocm9tZSBidXQgZGlkbid0IHdvcmsgb24gRmlyZWZveCwgc28gaGFkIHRvIHJlc29ydCB0byB3aW5kb3cucGFnZVlPZmZzZXRcbiAgICAgICAgLy8gYnV0IGNhbid0IGZhbGxiYWNrIHRvIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIGFzIHRoYXQgZG9lc24ndCB3b3JrIGluIElFIHdpdGggYSBkb2N0eXBlICg/KSBzbyBoYXZlIHRvIHVzZSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0VG9wID0gMDtcbiAgICAgICAgdmFyIG9mZnNldCA9IEltYWdlci5nZXRQYWdlT2Zmc2V0KCkgKyB0aGlzLmxhenlsb2FkT2Zmc2V0O1xuXG4gICAgICAgIGlmIChlbGVtZW50Lm9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRPZmZzZXRUb3AgKz0gZWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQub2Zmc2V0UGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50T2Zmc2V0VG9wIDwgKHRoaXMudmlld3BvcnRIZWlnaHQgKyBvZmZzZXQpO1xuICAgIH1cblxuICAgIGNoZWNrSW1hZ2VzTmVlZFJlcGxhY2luZyAoaW1hZ2VzLCBmaWx0ZXJGbikge1xuICAgICAgICBmaWx0ZXJGbiA9IGZpbHRlckZuIHx8IHRydWVGbjtcblxuICAgICAgICBpZiAoIXRoaXMuaXNSZXNpemluZykge1xuICAgICAgICAgICAgdGhpcy5pc1Jlc2l6aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFBpeGVsUmF0aW8oKTtcblxuICAgICAgICAgICAgYXBwbHlFYWNoKGltYWdlcywgKGltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlckZuKGltYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2VJbWFnZXNCYXNlZE9uU2NyZWVuRGltZW5zaW9ucyhpbWFnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuaXNSZXNpemluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5vbkltYWdlc1JlcGxhY2VkKGltYWdlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGdyYWRlcyBhbiBpbWFnZSBmcm9tIGFuIGVtcHR5IHBsYWNlaG9sZGVyIHRvIGEgZnVsbHkgc291cmNlZCBpbWFnZSBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlXG4gICAgICovXG4gICAgcmVwbGFjZUltYWdlc0Jhc2VkT25TY3JlZW5EaW1lbnNpb25zIChpbWFnZSkge1xuICAgICAgICB2YXIgY29tcHV0ZWRXaWR0aCwgbmF0dXJhbFdpZHRoO1xuXG4gICAgICAgIG5hdHVyYWxXaWR0aCA9IEltYWdlci5nZXROYXR1cmFsV2lkdGgoaW1hZ2UpO1xuICAgICAgICBjb21wdXRlZFdpZHRoID0gdHlwZW9mIHRoaXMuYXZhaWxhYmxlV2lkdGhzID09PSAnZnVuY3Rpb24nID8gdGhpcy5hdmFpbGFibGVXaWR0aHMoaW1hZ2UpXG4gICAgICAgICAgICA6IHRoaXMuZGV0ZXJtaW5lQXBwcm9wcmlhdGVSZXNvbHV0aW9uKGltYWdlKTtcblxuICAgICAgICBpbWFnZS53aWR0aCA9IGNvbXB1dGVkV2lkdGg7XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzUGxhY2Vob2xkZXIoaW1hZ2UpICYmIGNvbXB1dGVkV2lkdGggPD0gbmF0dXJhbFdpZHRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbWFnZS5zcmMgPSB0aGlzLmNoYW5nZUltYWdlU3JjVG9Vc2VOZXdJbWFnZURpbWVuc2lvbnMoaW1hZ2UuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpLCBjb21wdXRlZFdpZHRoKTtcbiAgICAgICAgaW1hZ2UucmVtb3ZlQXR0cmlidXRlKCd3aWR0aCcpO1xuICAgICAgICBpbWFnZS5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgIH1cblxuICAgIGRldGVybWluZUFwcHJvcHJpYXRlUmVzb2x1dGlvbiAoaW1hZ2UpIHtcbiAgICAgICAgcmV0dXJuIEltYWdlci5nZXRDbG9zZXN0VmFsdWUoaW1hZ2UuZ2V0QXR0cmlidXRlKCdkYXRhLXdpZHRoJykgfHwgaW1hZ2UucGFyZW50Tm9kZS5jbGllbnRXaWR0aCwgdGhpcy5hdmFpbGFibGVXaWR0aHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGRldmljZSBwaXhlbCByYXRpbyB2YWx1ZSB1c2VkIGJ5IEltYWdlclxuICAgICAqXG4gICAgICogSXQgaXMgcGVyZm9ybWVkIGJlZm9yZSBlYWNoIHJlcGxhY2VtZW50IGxvb3AsIGluIGNhc2UgYSB1c2VyIHpvb21lZCBpbi9vdXRcbiAgICAgKiBhbmQgdGh1cyB1cGRhdGVkIHRoZSBgd2luZG93LmRldmljZVBpeGVsUmF0aW9gIHZhbHVlLlxuICAgICAqXG4gICAgICogQGFwaVxuICAgICAqIEBzaW5jZSAxLjAuMVxuICAgICAqL1xuICAgIHJlZnJlc2hQaXhlbFJhdGlvICgpIHtcbiAgICAgICAgdGhpcy5kZXZpY2VQaXhlbFJhdGlvID0gSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZShJbWFnZXIuZ2V0UGl4ZWxSYXRpbygpLCB0aGlzLmF2YWlsYWJsZVBpeGVsUmF0aW9zKTtcbiAgICB9XG5cbiAgICBjaGFuZ2VJbWFnZVNyY1RvVXNlTmV3SW1hZ2VEaW1lbnNpb25zIChzcmMsIHNlbGVjdGVkV2lkdGgpIHtcbiAgICAgICAgcmV0dXJuIHNyY1xuICAgICAgICAgICAgLnJlcGxhY2UoL3t3aWR0aH0vZywgdHJhbnNmb3Jtcy53aWR0aChzZWxlY3RlZFdpZHRoLCB0aGlzLndpZHRoc01hcCkpXG4gICAgICAgICAgICAucmVwbGFjZSgve3BpeGVsX3JhdGlvfS9nLCB0cmFuc2Zvcm1zLnBpeGVsUmF0aW8odGhpcy5kZXZpY2VQaXhlbFJhdGlvKSk7XG4gICAgfVxuXG5cblxuICAgIHJlZ2lzdGVyUmVzaXplRXZlbnQgKGZpbHRlckZuKSB7XG4gICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIGRlYm91bmNlKCgpID0+IHRoaXMuY2hlY2tJbWFnZXNOZWVkUmVwbGFjaW5nKHRoaXMuZGl2cywgZmlsdGVyRm4pLCAxMDApKTtcbiAgICB9XG5cbiAgICByZWdpc3RlclNjcm9sbEV2ZW50ICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxlZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5zY3JvbGxDaGVjaygpLCB0aGlzLnNjcm9sbERlbGF5KTtcblxuICAgICAgICBhZGRFdmVudCh3aW5kb3csICdzY3JvbGwnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVkID0gdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBhZGRFdmVudCh3aW5kb3csICdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXdwb3J0SGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGl4ZWxSYXRpbyAoY29udGV4dCkge1xuICAgICAgICByZXR1cm4gKGNvbnRleHQgfHwgd2luZG93KVsnZGV2aWNlUGl4ZWxSYXRpbyddIHx8IDE7XG4gICAgfTtcblxuICAgIHN0YXRpYyBjcmVhdGVXaWR0aHNNYXAgKHdpZHRocywgaW50ZXJwb2xhdG9yLCBwaXhlbFJhdGlvKSB7XG4gICAgICAgIHZhciBtYXAgPSB7fSxcbiAgICAgICAgICAgIGkgICA9IHdpZHRocy5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgbWFwW3dpZHRoc1tpXV0gPSBpbnRlcnBvbGF0b3Iod2lkdGhzW2ldLCBwaXhlbFJhdGlvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjbG9zZXN0IHVwcGVyIHZhbHVlLlxuICAgICAqXG4gICAgICogYGBganNcbiAgICAgKiB2YXIgY2FuZGlkYXRlcyA9IFsxLCAxLjUsIDJdO1xuICAgICAqXG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgwLjgsIGNhbmRpZGF0ZXMpOyAvLyAtPiAxXG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgxLCBjYW5kaWRhdGVzKTsgLy8gLT4gMVxuICAgICAqIEltYWdlci5nZXRDbG9zZXN0VmFsdWUoMS4zLCBjYW5kaWRhdGVzKTsgLy8gLT4gMS41XG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgzLCBjYW5kaWRhdGVzKTsgLy8gLT4gMlxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGFwaVxuICAgICAqIEBzaW5jZSAxLjAuMVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBiYXNlVmFsdWVcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSBjYW5kaWRhdGVzXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0Q2xvc2VzdFZhbHVlIChiYXNlVmFsdWUsIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgdmFyIGkgPSBjYW5kaWRhdGVzLmxlbmd0aCxcbiAgICAgICAgICAgIHNlbGVjdGVkV2lkdGggPSBjYW5kaWRhdGVzW2kgLSAxXTtcblxuICAgICAgICBiYXNlVmFsdWUgPSBwYXJzZUZsb2F0KGJhc2VWYWx1ZSk7XG5cbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgaWYgKGJhc2VWYWx1ZSA8PSBjYW5kaWRhdGVzW2ldKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRXaWR0aCA9IGNhbmRpZGF0ZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZWN0ZWRXaWR0aDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGFnZU9mZnNldEdlbmVyYXRvciAodGVzdENhc2UpIHtcbiAgICAgICAgaWYgKHRlc3RDYXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbmF0dXJhbFdpZHRoIG9mIGFuIGltYWdlIGVsZW1lbnQuXG4gKlxuICogQHNpbmNlIDEuMy4xXG4gKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEltYWdlIHdpZHRoIGluIHBpeGVsc1xuICovXG5JbWFnZXIuZ2V0TmF0dXJhbFdpZHRoID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ25hdHVyYWxXaWR0aCcgaW4gKG5ldyBJbWFnZSgpKSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGltYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyBub24tSFRNTDUgYnJvd3NlcnMgd29ya2Fyb3VuZFxuICAgIHJldHVybiBmdW5jdGlvbiAoaW1hZ2UpIHtcbiAgICAgICAgdmFyIGltYWdlQ29weSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgICBpbWFnZUNvcHkuc3JjID0gaW1hZ2Uuc3JjO1xuICAgICAgICByZXR1cm4gaW1hZ2VDb3B5LndpZHRoO1xuICAgIH07XG59KSgpO1xuXG4vLyBUaGlzIGZvcm0gaXMgdXNlZCBiZWNhdXNlIGl0IHNlZW1zIGltcG9zc2libGUgdG8gc3R1YiBgd2luZG93LnBhZ2VZT2Zmc2V0YFxuSW1hZ2VyLmdldFBhZ2VPZmZzZXQgPSBJbWFnZXIuZ2V0UGFnZU9mZnNldEdlbmVyYXRvcihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwod2luZG93LCAncGFnZVlPZmZzZXQnKSk7XG5cbi8vIEV4cG9ydGluZyBmb3IgdGVzdGluZyBhbmQgY29udmVuaWVuY2UgcHVycG9zZVxuSW1hZ2VyLmFwcGx5RWFjaCA9IGFwcGx5RWFjaDtcbkltYWdlci5hZGRFdmVudCA9IGFkZEV2ZW50O1xuSW1hZ2VyLmRlYm91bmNlID0gZGVib3VuY2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCB2YXIgYWRkRXZlbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBhZGRTdGFuZGFyZEV2ZW50TGlzdGVuZXIoZWwsIGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZm4sIGZhbHNlKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBhZGRJRUV2ZW50TGlzdGVuZXIoZWwsIGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBmbik7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5RWFjaChjb2xsZWN0aW9uLCBjYWxsYmFja0VhY2gpIHtcbiAgICB2YXIgaSA9IDAsXG4gICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoLFxuICAgICAgICBuZXdfY29sbGVjdGlvbiA9IFtdO1xuXG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBuZXdfY29sbGVjdGlvbltpXSA9IGNhbGxiYWNrRWFjaChjb2xsZWN0aW9uW2ldLCBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3X2NvbGxlY3Rpb247XG59O1xuXG5leHBvcnQgdmFyIGdldEtleXMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgPyBPYmplY3Qua2V5cyA6IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdLFxuICAgICAgICBrZXk7XG5cbiAgICBmb3IgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGl4ZWxSYXRpbyAodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDEgPyAnJyA6ICctJyArIHZhbHVlICsgJ3gnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2lkdGggKHdpZHRoLCBtYXApIHtcbiAgICByZXR1cm4gbWFwW3dpZHRoXSB8fCB3aWR0aDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGZ1bmN0aW9uIHJldHVybkZuICh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vb3AgKCkge1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJ1ZUZuICgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlIChmbiwgd2FpdCkge1xuICAgIHZhciB0aW1lb3V0O1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICBmbi5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgfTtcbn1cbiJdfQ==
