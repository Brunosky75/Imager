(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Imager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (typeof obj === 'object' && obj !== null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

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

    Imager.prototype.init = function init() {
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
    };

    /**
     * Executes a function when Imager is ready to work
     * It acts as a convenient/shortcut for `new Imager({ onReady: fn })`
     *
     * @since 0.3.1
     * @param {Function} fn
     */

    Imager.prototype.ready = function ready(fn) {
        this.onReady = fn || _returnFn$noop$trueFn$debounce.noop;
    };

    Imager.prototype.add = function add(elementsOrSelector) {

        elementsOrSelector = elementsOrSelector || this.selector;
        var elements = typeof elementsOrSelector === 'string' ? document.querySelectorAll(elementsOrSelector) : // Selector
        elementsOrSelector; // Elements (NodeList or array of Nodes)

        if (elements && elements.length) {
            var additional = _addEvent$applyEach$getKeys.applyEach(elements, _returnFn$noop$trueFn$debounce.returnFn);
            this.changeDivsToEmptyImages(additional);
            this.divs = this.divs.concat(additional);
        }
    };

    Imager.prototype.scrollCheck = function scrollCheck() {
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
    };

    Imager.prototype.createGif = function createGif(element) {
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
    };

    Imager.prototype.changeDivsToEmptyImages = function changeDivsToEmptyImages(elements) {
        var _this4 = this;

        _addEvent$applyEach$getKeys.applyEach(elements, function (element, i) {
            elements[i] = _this4.createGif(element);
        });

        if (this.initialized) {
            this.checkImagesNeedReplacing(elements);
        }
    };

    /**
     * Indicates if an element is an Imager placeholder
     *
     * @since 1.3.1
     * @param {HTMLImageElement} element
     * @returns {boolean}
     */

    Imager.prototype.isPlaceholder = function isPlaceholder(element) {
        return element.src === this.gif.src;
    };

    /**
     * Returns true if an element is located within a screen offset.
     *
     * @param {HTMLElement} element
     * @returns {boolean}
     */

    Imager.prototype.isThisElementOnScreen = function isThisElementOnScreen(element) {
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
    };

    Imager.prototype.checkImagesNeedReplacing = function checkImagesNeedReplacing(images, filterFn) {
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
    };

    /**
     * Upgrades an image from an empty placeholder to a fully sourced image element
     *
     * @param {HTMLImageElement} image
     */

    Imager.prototype.replaceImagesBasedOnScreenDimensions = function replaceImagesBasedOnScreenDimensions(image) {
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
    };

    Imager.prototype.determineAppropriateResolution = function determineAppropriateResolution(image) {
        return Imager.getClosestValue(image.getAttribute('data-width') || image.parentNode.clientWidth, this.availableWidths);
    };

    /**
     * Updates the device pixel ratio value used by Imager
     *
     * It is performed before each replacement loop, in case a user zoomed in/out
     * and thus updated the `window.devicePixelRatio` value.
     *
     * @api
     * @since 1.0.1
     */

    Imager.prototype.refreshPixelRatio = function refreshPixelRatio() {
        this.devicePixelRatio = Imager.getClosestValue(Imager.getPixelRatio(), this.availablePixelRatios);
    };

    Imager.prototype.changeImageSrcToUseNewImageDimensions = function changeImageSrcToUseNewImageDimensions(src, selectedWidth) {
        return src.replace(/{width}/g, transforms.width(selectedWidth, this.widthsMap)).replace(/{pixel_ratio}/g, transforms.pixelRatio(this.devicePixelRatio));
    };

    Imager.prototype.registerResizeEvent = function registerResizeEvent(filterFn) {
        var _this6 = this;

        _addEvent$applyEach$getKeys.addEvent(window, 'resize', _returnFn$noop$trueFn$debounce.debounce(function () {
            return _this6.checkImagesNeedReplacing(_this6.divs, filterFn);
        }, 100));
    };

    Imager.prototype.registerScrollEvent = function registerScrollEvent() {
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
    };

    Imager.getPixelRatio = function getPixelRatio(context) {
        return (context || window).devicePixelRatio || 1;
    };

    Imager.createWidthsMap = function createWidthsMap(widths, interpolator, pixelRatio) {
        var map = {},
            i = widths.length;

        while (i--) {
            map[widths[i]] = interpolator(widths[i], pixelRatio);
        }

        return map;
    };

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

    Imager.getClosestValue = function getClosestValue(baseValue, candidates) {
        var i = candidates.length,
            selectedWidth = candidates[i - 1];

        baseValue = parseFloat(baseValue);

        while (i--) {
            if (baseValue <= candidates[i]) {
                selectedWidth = candidates[i];
            }
        }

        return selectedWidth;
    };

    Imager.getPageOffsetGenerator = function getPageOffsetGenerator(testCase) {
        if (testCase) {
            return function () {
                return window.pageYOffset;
            };
        } else {
            return function () {
                return document.documentElement.scrollTop;
            };
        }
    };

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

exports.__esModule = true;
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

exports.__esModule = true;
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

exports.__esModule = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvb25jbGV0b20vd29ya3NwYWNlL0ltYWdlci5qcy9pbmRleC5qcyIsIi9Vc2Vycy9vbmNsZXRvbS93b3Jrc3BhY2UvSW1hZ2VyLmpzL3NyYy9zaGltcy5qcyIsIi9Vc2Vycy9vbmNsZXRvbS93b3Jrc3BhY2UvSW1hZ2VyLmpzL3NyYy90cmFuc2Zvcm1zLmpzIiwiL1VzZXJzL29uY2xldG9tL3dvcmtzcGFjZS9JbWFnZXIuanMvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7MENDRTZDLGdCQUFnQjs7NkNBQ1osZ0JBQWdCOztzQkFDckMscUJBQXFCOztJQUFyQyxVQUFVOztBQUp0QixZQUFZLENBQUM7O0FBTWIsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDO0FBQ3JCLElBQU0sYUFBYSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLE1BQU07QUFDWCxhQURLLE1BQU0sQ0FDVixRQUFRLEVBQWE7OztZQUFYLElBQUksZ0NBQUcsRUFBRTs7OEJBRGYsTUFBTTs7QUFHbkIsWUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQ3hCLGtCQUFNLElBQUksS0FBSyxDQUFDLDZHQUE2RyxDQUFDLENBQUE7U0FDakk7OztBQUdELFlBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO0FBQzlCLGdCQUFJLENBQUMsUUFB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QzNCLENBQUM7QUFDRixvQkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3RCLGVBQU8sR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3JDLENBQUM7Q0FDTCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGFkZEV2ZW50LCBhcHBseUVhY2gsIGdldEtleXMgfSBmcm9tICcuL3NyYy9zaGltcy5qcyc7XG5pbXBvcnQgeyByZXR1cm5Gbiwgbm9vcCwgdHJ1ZUZuLCBkZWJvdW5jZSB9IGZyb20gJy4vc3JjL3V0aWxzLmpzJztcbmltcG9ydCAqIGFzIHRyYW5zZm9ybXMgZnJvbSAnLi9zcmMvdHJhbnNmb3Jtcy5qcyc7XG5cbmNvbnN0IGRvYyA9IGRvY3VtZW50O1xuY29uc3QgZGVmYXVsdFdpZHRocyA9IFs5NiwgMTMwLCAxNjUsIDIwMCwgMjM1LCAyNzAsIDMwNCwgMzQwLCAzNzUsIDQxMCwgNDQ1LCA0ODUsIDUyMCwgNTU1LCA1OTAsIDYyNSwgNjYwLCA2OTUsIDczNl07XG5cblxuLypcbiAgICBDb25zdHJ1Y3QgYSBuZXcgSW1hZ2VyIGluc3RhbmNlLCBwYXNzaW5nIGFuIG9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuXG4gICAgRXhhbXBsZSB1c2FnZTpcblxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBBdmFpbGFibGUgd2lkdGhzIGZvciB5b3VyIGltYWdlc1xuICAgICAgICAgICAgYXZhaWxhYmxlV2lkdGhzOiBbTnVtYmVyXSxcblxuICAgICAgICAgICAgLy8gU2VsZWN0b3IgdG8gYmUgdXNlZCB0byBsb2NhdGUgeW91ciBkaXYgcGxhY2Vob2xkZXJzXG4gICAgICAgICAgICBzZWxlY3RvcjogJycsXG5cbiAgICAgICAgICAgIC8vIENsYXNzIG5hbWUgdG8gZ2l2ZSB5b3VyIHJlc2l6YWJsZSBpbWFnZXNcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJycsXG5cbiAgICAgICAgICAgIC8vIElmIHNldCB0byB0cnVlLCBJbWFnZXIgd2lsbCB1cGRhdGUgdGhlIHNyYyBhdHRyaWJ1dGUgb2YgdGhlIHJlbGV2YW50IGltYWdlc1xuICAgICAgICAgICAgb25SZXNpemU6IEJvb2xlYW4sXG5cbiAgICAgICAgICAgIC8vIFRvZ2dsZSB0aGUgbGF6eSBsb2FkIGZ1bmN0aW9uYWxpdHkgb24gb3Igb2ZmXG4gICAgICAgICAgICBsYXp5bG9hZDogQm9vbGVhbixcblxuICAgICAgICAgICAgLy8gVXNlZCBhbG9uZ3NpZGUgdGhlIGxhenlsb2FkIGZlYXR1cmUgKGhlbHBzIHBlcmZvcm1hbmNlIGJ5IHNldHRpbmcgYSBoaWdoZXIgZGVsYXkpXG4gICAgICAgICAgICBzY3JvbGxEZWxheTogTnVtYmVyXG4gICAgICAgIH1cblxuICAgIEBwYXJhbSB7b2JqZWN0fSBjb25maWd1cmF0aW9uIHNldHRpbmdzXG4gICAgQHJldHVybiB7b2JqZWN0fSBpbnN0YW5jZSBvZiBJbWFnZXJcbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWFnZXIge1xuICAgIGNvbnN0cnVjdG9yIChlbGVtZW50cywgb3B0cyA9IHt9KSB7XG5cbiAgICAgICAgaWYgKGVsZW1lbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW1hZ2VyLmpzIG5vdyBleHBlY3RzIHRoZSBmaXJzdCBhcmd1bWVudCB0byBiZSBlaXRoZXIgYSBDU1Mgc3RyaW5nIHNlbGVjdG9yIG9yIGEgY29sbGVjdGlvbiBvZiBIVE1MRWxlbWVudC4nKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2VsZWN0b3Igc3RyaW5nIChub3QgZWxlbWVudHMpXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvcHRzLnNlbGVjdG9yID0gZWxlbWVudHM7XG4gICAgICAgICAgICBlbGVtZW50cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdvcHRzJyBvYmplY3QgKG5vdCBlbGVtZW50cylcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGVsZW1lbnRzLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9wdHMgPSBlbGVtZW50cztcbiAgICAgICAgICAgIGVsZW1lbnRzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52aWV3cG9ydEhlaWdodCA9IGRvYy5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICB0aGlzLnNlbGVjdG9yID0gIWVsZW1lbnRzID8gKG9wdHMuc2VsZWN0b3IgfHwgJy5kZWxheWVkLWltYWdlLWxvYWQnKSA6IG51bGw7XG4gICAgICAgIHRoaXMuY2xhc3NOYW1lID0gb3B0cy5jbGFzc05hbWUgfHwgJ2ltYWdlLXJlcGxhY2UnO1xuICAgICAgICB0aGlzLmdpZiA9IGRvYy5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgdGhpcy5naWYuc3JjID0gJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEVBQUpBSUFBQVAvLy93QUFBQ0g1QkFFQUFBQUFMQUFBQUFBUUFBa0FBQUlLaEkrcHkrMFBvNXlVRlFBNyc7XG4gICAgICAgIHRoaXMuZ2lmLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lO1xuICAgICAgICB0aGlzLmdpZi5hbHQgPSAnJztcbiAgICAgICAgdGhpcy5sYXp5bG9hZE9mZnNldCA9IG9wdHMubGF6eWxvYWRPZmZzZXQgfHwgMDtcbiAgICAgICAgdGhpcy5zY3JvbGxEZWxheSA9IG9wdHMuc2Nyb2xsRGVsYXkgfHwgMjUwO1xuICAgICAgICB0aGlzLm9uUmVzaXplID0gb3B0cy5oYXNPd25Qcm9wZXJ0eSgnb25SZXNpemUnKSA/IG9wdHMub25SZXNpemUgOiB0cnVlO1xuICAgICAgICB0aGlzLmxhenlsb2FkID0gb3B0cy5oYXNPd25Qcm9wZXJ0eSgnbGF6eWxvYWQnKSA/IG9wdHMubGF6eWxvYWQgOiBmYWxzZTtcbiAgICAgICAgdGhpcy5zY3JvbGxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF2YWlsYWJsZVBpeGVsUmF0aW9zID0gb3B0cy5hdmFpbGFibGVQaXhlbFJhdGlvcyB8fCBbMSwgMl07XG4gICAgICAgIHRoaXMuYXZhaWxhYmxlV2lkdGhzID0gb3B0cy5hdmFpbGFibGVXaWR0aHMgfHwgZGVmYXVsdFdpZHRocztcbiAgICAgICAgdGhpcy5vbkltYWdlc1JlcGxhY2VkID0gb3B0cy5vbkltYWdlc1JlcGxhY2VkIHx8IG5vb3A7XG4gICAgICAgIHRoaXMud2lkdGhzTWFwID0ge307XG4gICAgICAgIHRoaXMucmVmcmVzaFBpeGVsUmF0aW8oKTtcbiAgICAgICAgdGhpcy53aWR0aEludGVycG9sYXRvciA9IG9wdHMud2lkdGhJbnRlcnBvbGF0b3IgfHwgcmV0dXJuRm47XG5cbiAgICAgICAgLy8gTmVlZGVkIGFzIElFOCBhZGRzIGEgZGVmYXVsdCBgd2lkdGhgL2BoZWlnaHRgIGF0dHJpYnV0ZeKAplxuICAgICAgICB0aGlzLmdpZi5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgICAgICB0aGlzLmdpZi5yZW1vdmVBdHRyaWJ1dGUoJ3dpZHRoJyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmF2YWlsYWJsZVdpZHRocyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmF2YWlsYWJsZVdpZHRocy5sZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aHNNYXAgPSBJbWFnZXIuY3JlYXRlV2lkdGhzTWFwKHRoaXMuYXZhaWxhYmxlV2lkdGhzLCB0aGlzLndpZHRoSW50ZXJwb2xhdG9yLCB0aGlzLmRldmljZVBpeGVsUmF0aW8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aHNNYXAgPSB0aGlzLmF2YWlsYWJsZVdpZHRocztcbiAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZVdpZHRocyA9IGdldEtleXModGhpcy5hdmFpbGFibGVXaWR0aHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmF2YWlsYWJsZVdpZHRocyA9IHRoaXMuYXZhaWxhYmxlV2lkdGhzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGl2cyA9IFtdO1xuICAgICAgICB0aGlzLmFkZChlbGVtZW50cyB8fCB0aGlzLnNlbGVjdG9yKTtcbiAgICAgICAgdGhpcy5yZWFkeShvcHRzLm9uUmVhZHkpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbml0KCksIDApO1xuICAgIH1cblxuICAgIGluaXQgKCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGZpbHRlckZuID0gdHJ1ZUZuO1xuXG4gICAgICAgIGlmICh0aGlzLmxhenlsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2Nyb2xsRXZlbnQoKTtcblxuICAgICAgICAgICAgdGhpcy5zY3JvbGxlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbENoZWNrKCk7XG5cbiAgICAgICAgICAgIGZpbHRlckZuID0gKGVsZW1lbnQpID0+IHRoaXMuaXNQbGFjZWhvbGRlcihlbGVtZW50KSA9PT0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrSW1hZ2VzTmVlZFJlcGxhY2luZyh0aGlzLmRpdnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub25SZXNpemUpIHtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJSZXNpemVFdmVudChmaWx0ZXJGbik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9uUmVhZHkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdoZW4gSW1hZ2VyIGlzIHJlYWR5IHRvIHdvcmtcbiAgICAgKiBJdCBhY3RzIGFzIGEgY29udmVuaWVudC9zaG9ydGN1dCBmb3IgYG5ldyBJbWFnZXIoeyBvblJlYWR5OiBmbiB9KWBcbiAgICAgKlxuICAgICAqIEBzaW5jZSAwLjMuMVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICovXG4gICAgcmVhZHkgKGZuKSB7XG4gICAgICAgIHRoaXMub25SZWFkeSA9IGZuIHx8IG5vb3A7XG4gICAgfVxuXG4gICAgYWRkIChlbGVtZW50c09yU2VsZWN0b3IpIHtcblxuICAgICAgICBlbGVtZW50c09yU2VsZWN0b3IgPSBlbGVtZW50c09yU2VsZWN0b3IgfHwgdGhpcy5zZWxlY3RvcjtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gdHlwZW9mIGVsZW1lbnRzT3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtZW50c09yU2VsZWN0b3IpIDogLy8gU2VsZWN0b3JcbiAgICAgICAgICAgIGVsZW1lbnRzT3JTZWxlY3RvcjsgLy8gRWxlbWVudHMgKE5vZGVMaXN0IG9yIGFycmF5IG9mIE5vZGVzKVxuXG4gICAgICAgIGlmIChlbGVtZW50cyAmJiBlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsID0gYXBwbHlFYWNoKGVsZW1lbnRzLCByZXR1cm5Gbik7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpdnNUb0VtcHR5SW1hZ2VzKGFkZGl0aW9uYWwpO1xuICAgICAgICAgICAgdGhpcy5kaXZzID0gdGhpcy5kaXZzLmNvbmNhdChhZGRpdGlvbmFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNjcm9sbENoZWNrICgpIHtcbiAgICAgICAgdmFyIG9mZnNjcmVlbkltYWdlQ291bnQgPSAwO1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBbXTtcblxuICAgICAgICBpZiAodGhpcy5zY3JvbGxlZCkge1xuICAgICAgICAgICAgLy8gY29sbGVjdHMgYSBzdWJzZXQgb2Ygbm90LXlldC1yZXNwb25zaXZlIGltYWdlcyBhbmQgbm90IG9mZnNjcmVlbiBhbnltb3JlXG4gICAgICAgICAgICBhcHBseUVhY2godGhpcy5kaXZzLCAoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgKytvZmZzY3JlZW5JbWFnZUNvdW50O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVGhpc0VsZW1lbnRPblNjcmVlbihlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAob2Zmc2NyZWVuSW1hZ2VDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNoYW5nZURpdnNUb0VtcHR5SW1hZ2VzKGVsZW1lbnRzKTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNyZWF0ZUdpZiAoZWxlbWVudCkge1xuICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyBhbHJlYWR5IGEgcmVzcG9uc2l2ZSBpbWFnZSB0aGVuIHdlIGRvbid0IHJlcGxhY2UgaXQgYWdhaW5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lLm1hdGNoKG5ldyBSZWdFeHAoJyhefCApJyArIHRoaXMuY2xhc3NOYW1lICsgJyggfCQpJykpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbGVtZW50Q2xhc3NOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2xhc3MnKTtcbiAgICAgICAgdmFyIGVsZW1lbnRXaWR0aCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXdpZHRoJyk7XG4gICAgICAgIHZhciBnaWYgPSB0aGlzLmdpZi5jbG9uZU5vZGUoZmFsc2UpO1xuXG4gICAgICAgIGlmIChlbGVtZW50V2lkdGgpIHtcbiAgICAgICAgICAgIGdpZi53aWR0aCA9IGVsZW1lbnRXaWR0aDtcbiAgICAgICAgICAgIGdpZi5zZXRBdHRyaWJ1dGUoJ2RhdGEtd2lkdGgnLCBlbGVtZW50V2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2lmLmNsYXNzTmFtZSA9IChlbGVtZW50Q2xhc3NOYW1lID8gZWxlbWVudENsYXNzTmFtZSArICcgJyA6ICcnKSArIHRoaXMuY2xhc3NOYW1lO1xuICAgICAgICBnaWYuc2V0QXR0cmlidXRlKCdkYXRhLXNyYycsIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpKTtcbiAgICAgICAgZ2lmLnNldEF0dHJpYnV0ZSgnYWx0JywgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYWx0JykgfHwgdGhpcy5naWYuYWx0KTtcblxuICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGdpZiwgZWxlbWVudCk7XG5cbiAgICAgICAgcmV0dXJuIGdpZjtcbiAgICB9XG5cbiAgICBjaGFuZ2VEaXZzVG9FbXB0eUltYWdlcyAoZWxlbWVudHMpIHtcbiAgICAgICAgYXBwbHlFYWNoKGVsZW1lbnRzLCAoZWxlbWVudCwgaSkgPT4ge1xuICAgICAgICAgICAgZWxlbWVudHNbaV0gPSB0aGlzLmNyZWF0ZUdpZihlbGVtZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJbWFnZXNOZWVkUmVwbGFjaW5nKGVsZW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluZGljYXRlcyBpZiBhbiBlbGVtZW50IGlzIGFuIEltYWdlciBwbGFjZWhvbGRlclxuICAgICAqXG4gICAgICogQHNpbmNlIDEuMy4xXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNQbGFjZWhvbGRlciAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudC5zcmMgPT09IHRoaXMuZ2lmLnNyYztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgYW4gZWxlbWVudCBpcyBsb2NhdGVkIHdpdGhpbiBhIHNjcmVlbiBvZmZzZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNUaGlzRWxlbWVudE9uU2NyZWVuIChlbGVtZW50KSB7XG4gICAgICAgIC8vIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHdhcyB3b3JraW5nIGluIENocm9tZSBidXQgZGlkbid0IHdvcmsgb24gRmlyZWZveCwgc28gaGFkIHRvIHJlc29ydCB0byB3aW5kb3cucGFnZVlPZmZzZXRcbiAgICAgICAgLy8gYnV0IGNhbid0IGZhbGxiYWNrIHRvIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIGFzIHRoYXQgZG9lc24ndCB3b3JrIGluIElFIHdpdGggYSBkb2N0eXBlICg/KSBzbyBoYXZlIHRvIHVzZSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0VG9wID0gMDtcbiAgICAgICAgdmFyIG9mZnNldCA9IEltYWdlci5nZXRQYWdlT2Zmc2V0KCkgKyB0aGlzLmxhenlsb2FkT2Zmc2V0O1xuXG4gICAgICAgIGlmIChlbGVtZW50Lm9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRPZmZzZXRUb3AgKz0gZWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQub2Zmc2V0UGFyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50T2Zmc2V0VG9wIDwgKHRoaXMudmlld3BvcnRIZWlnaHQgKyBvZmZzZXQpO1xuICAgIH1cblxuICAgIGNoZWNrSW1hZ2VzTmVlZFJlcGxhY2luZyAoaW1hZ2VzLCBmaWx0ZXJGbikge1xuICAgICAgICBmaWx0ZXJGbiA9IGZpbHRlckZuIHx8IHRydWVGbjtcblxuICAgICAgICBpZiAoIXRoaXMuaXNSZXNpemluZykge1xuICAgICAgICAgICAgdGhpcy5pc1Jlc2l6aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFBpeGVsUmF0aW8oKTtcblxuICAgICAgICAgICAgYXBwbHlFYWNoKGltYWdlcywgKGltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlckZuKGltYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2VJbWFnZXNCYXNlZE9uU2NyZWVuRGltZW5zaW9ucyhpbWFnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuaXNSZXNpemluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5vbkltYWdlc1JlcGxhY2VkKGltYWdlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGdyYWRlcyBhbiBpbWFnZSBmcm9tIGFuIGVtcHR5IHBsYWNlaG9sZGVyIHRvIGEgZnVsbHkgc291cmNlZCBpbWFnZSBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlXG4gICAgICovXG4gICAgcmVwbGFjZUltYWdlc0Jhc2VkT25TY3JlZW5EaW1lbnNpb25zIChpbWFnZSkge1xuICAgICAgICB2YXIgY29tcHV0ZWRXaWR0aCwgbmF0dXJhbFdpZHRoO1xuXG4gICAgICAgIG5hdHVyYWxXaWR0aCA9IEltYWdlci5nZXROYXR1cmFsV2lkdGgoaW1hZ2UpO1xuICAgICAgICBjb21wdXRlZFdpZHRoID0gdHlwZW9mIHRoaXMuYXZhaWxhYmxlV2lkdGhzID09PSAnZnVuY3Rpb24nID8gdGhpcy5hdmFpbGFibGVXaWR0aHMoaW1hZ2UpXG4gICAgICAgICAgICA6IHRoaXMuZGV0ZXJtaW5lQXBwcm9wcmlhdGVSZXNvbHV0aW9uKGltYWdlKTtcblxuICAgICAgICBpbWFnZS53aWR0aCA9IGNvbXB1dGVkV2lkdGg7XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzUGxhY2Vob2xkZXIoaW1hZ2UpICYmIGNvbXB1dGVkV2lkdGggPD0gbmF0dXJhbFdpZHRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbWFnZS5zcmMgPSB0aGlzLmNoYW5nZUltYWdlU3JjVG9Vc2VOZXdJbWFnZURpbWVuc2lvbnMoaW1hZ2UuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpLCBjb21wdXRlZFdpZHRoKTtcbiAgICAgICAgaW1hZ2UucmVtb3ZlQXR0cmlidXRlKCd3aWR0aCcpO1xuICAgICAgICBpbWFnZS5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgIH1cblxuICAgIGRldGVybWluZUFwcHJvcHJpYXRlUmVzb2x1dGlvbiAoaW1hZ2UpIHtcbiAgICAgICAgcmV0dXJuIEltYWdlci5nZXRDbG9zZXN0VmFsdWUoaW1hZ2UuZ2V0QXR0cmlidXRlKCdkYXRhLXdpZHRoJykgfHwgaW1hZ2UucGFyZW50Tm9kZS5jbGllbnRXaWR0aCwgdGhpcy5hdmFpbGFibGVXaWR0aHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGRldmljZSBwaXhlbCByYXRpbyB2YWx1ZSB1c2VkIGJ5IEltYWdlclxuICAgICAqXG4gICAgICogSXQgaXMgcGVyZm9ybWVkIGJlZm9yZSBlYWNoIHJlcGxhY2VtZW50IGxvb3AsIGluIGNhc2UgYSB1c2VyIHpvb21lZCBpbi9vdXRcbiAgICAgKiBhbmQgdGh1cyB1cGRhdGVkIHRoZSBgd2luZG93LmRldmljZVBpeGVsUmF0aW9gIHZhbHVlLlxuICAgICAqXG4gICAgICogQGFwaVxuICAgICAqIEBzaW5jZSAxLjAuMVxuICAgICAqL1xuICAgIHJlZnJlc2hQaXhlbFJhdGlvICgpIHtcbiAgICAgICAgdGhpcy5kZXZpY2VQaXhlbFJhdGlvID0gSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZShJbWFnZXIuZ2V0UGl4ZWxSYXRpbygpLCB0aGlzLmF2YWlsYWJsZVBpeGVsUmF0aW9zKTtcbiAgICB9XG5cbiAgICBjaGFuZ2VJbWFnZVNyY1RvVXNlTmV3SW1hZ2VEaW1lbnNpb25zIChzcmMsIHNlbGVjdGVkV2lkdGgpIHtcbiAgICAgICAgcmV0dXJuIHNyY1xuICAgICAgICAgICAgLnJlcGxhY2UoL3t3aWR0aH0vZywgdHJhbnNmb3Jtcy53aWR0aChzZWxlY3RlZFdpZHRoLCB0aGlzLndpZHRoc01hcCkpXG4gICAgICAgICAgICAucmVwbGFjZSgve3BpeGVsX3JhdGlvfS9nLCB0cmFuc2Zvcm1zLnBpeGVsUmF0aW8odGhpcy5kZXZpY2VQaXhlbFJhdGlvKSk7XG4gICAgfVxuXG5cblxuICAgIHJlZ2lzdGVyUmVzaXplRXZlbnQgKGZpbHRlckZuKSB7XG4gICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIGRlYm91bmNlKCgpID0+IHRoaXMuY2hlY2tJbWFnZXNOZWVkUmVwbGFjaW5nKHRoaXMuZGl2cywgZmlsdGVyRm4pLCAxMDApKTtcbiAgICB9XG5cbiAgICByZWdpc3RlclNjcm9sbEV2ZW50ICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxlZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5zY3JvbGxDaGVjaygpLCB0aGlzLnNjcm9sbERlbGF5KTtcblxuICAgICAgICBhZGRFdmVudCh3aW5kb3csICdzY3JvbGwnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVkID0gdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBhZGRFdmVudCh3aW5kb3csICdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXdwb3J0SGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGl4ZWxSYXRpbyAoY29udGV4dCkge1xuICAgICAgICByZXR1cm4gKGNvbnRleHQgfHwgd2luZG93KVsnZGV2aWNlUGl4ZWxSYXRpbyddIHx8IDE7XG4gICAgfTtcblxuICAgIHN0YXRpYyBjcmVhdGVXaWR0aHNNYXAgKHdpZHRocywgaW50ZXJwb2xhdG9yLCBwaXhlbFJhdGlvKSB7XG4gICAgICAgIHZhciBtYXAgPSB7fSxcbiAgICAgICAgICAgIGkgICA9IHdpZHRocy5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgbWFwW3dpZHRoc1tpXV0gPSBpbnRlcnBvbGF0b3Iod2lkdGhzW2ldLCBwaXhlbFJhdGlvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjbG9zZXN0IHVwcGVyIHZhbHVlLlxuICAgICAqXG4gICAgICogYGBganNcbiAgICAgKiB2YXIgY2FuZGlkYXRlcyA9IFsxLCAxLjUsIDJdO1xuICAgICAqXG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgwLjgsIGNhbmRpZGF0ZXMpOyAvLyAtPiAxXG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgxLCBjYW5kaWRhdGVzKTsgLy8gLT4gMVxuICAgICAqIEltYWdlci5nZXRDbG9zZXN0VmFsdWUoMS4zLCBjYW5kaWRhdGVzKTsgLy8gLT4gMS41XG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgzLCBjYW5kaWRhdGVzKTsgLy8gLT4gMlxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGFwaVxuICAgICAqIEBzaW5jZSAxLjAuMVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBiYXNlVmFsdWVcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSBjYW5kaWRhdGVzXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0Q2xvc2VzdFZhbHVlIChiYXNlVmFsdWUsIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgdmFyIGkgPSBjYW5kaWRhdGVzLmxlbmd0aCxcbiAgICAgICAgICAgIHNlbGVjdGVkV2lkdGggPSBjYW5kaWRhdGVzW2kgLSAxXTtcblxuICAgICAgICBiYXNlVmFsdWUgPSBwYXJzZUZsb2F0KGJhc2VWYWx1ZSk7XG5cbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgaWYgKGJhc2VWYWx1ZSA8PSBjYW5kaWRhdGVzW2ldKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRXaWR0aCA9IGNhbmRpZGF0ZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZWN0ZWRXaWR0aDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGFnZU9mZnNldEdlbmVyYXRvciAodGVzdENhc2UpIHtcbiAgICAgICAgaWYgKHRlc3RDYXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbmF0dXJhbFdpZHRoIG9mIGFuIGltYWdlIGVsZW1lbnQuXG4gKlxuICogQHNpbmNlIDEuMy4xXG4gKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEltYWdlIHdpZHRoIGluIHBpeGVsc1xuICovXG5JbWFnZXIuZ2V0TmF0dXJhbFdpZHRoID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ25hdHVyYWxXaWR0aCcgaW4gKG5ldyBJbWFnZSgpKSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGltYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyBub24tSFRNTDUgYnJvd3NlcnMgd29ya2Fyb3VuZFxuICAgIHJldHVybiBmdW5jdGlvbiAoaW1hZ2UpIHtcbiAgICAgICAgdmFyIGltYWdlQ29weSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgICBpbWFnZUNvcHkuc3JjID0gaW1hZ2Uuc3JjO1xuICAgICAgICByZXR1cm4gaW1hZ2VDb3B5LndpZHRoO1xuICAgIH07XG59KSgpO1xuXG4vLyBUaGlzIGZvcm0gaXMgdXNlZCBiZWNhdXNlIGl0IHNlZW1zIGltcG9zc2libGUgdG8gc3R1YiBgd2luZG93LnBhZ2VZT2Zmc2V0YFxuSW1hZ2VyLmdldFBhZ2VPZmZzZXQgPSBJbWFnZXIuZ2V0UGFnZU9mZnNldEdlbmVyYXRvcihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwod2luZG93LCAncGFnZVlPZmZzZXQnKSk7XG5cbi8vIEV4cG9ydGluZyBmb3IgdGVzdGluZyBhbmQgY29udmVuaWVuY2UgcHVycG9zZVxuSW1hZ2VyLmFwcGx5RWFjaCA9IGFwcGx5RWFjaDtcbkltYWdlci5hZGRFdmVudCA9IGFkZEV2ZW50O1xuSW1hZ2VyLmRlYm91bmNlID0gZGVib3VuY2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCB2YXIgYWRkRXZlbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBhZGRTdGFuZGFyZEV2ZW50TGlzdGVuZXIoZWwsIGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZm4sIGZhbHNlKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBhZGRJRUV2ZW50TGlzdGVuZXIoZWwsIGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBmbik7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5RWFjaChjb2xsZWN0aW9uLCBjYWxsYmFja0VhY2gpIHtcbiAgICB2YXIgaSA9IDAsXG4gICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoLFxuICAgICAgICBuZXdfY29sbGVjdGlvbiA9IFtdO1xuXG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBuZXdfY29sbGVjdGlvbltpXSA9IGNhbGxiYWNrRWFjaChjb2xsZWN0aW9uW2ldLCBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3X2NvbGxlY3Rpb247XG59O1xuXG5leHBvcnQgdmFyIGdldEtleXMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgPyBPYmplY3Qua2V5cyA6IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdLFxuICAgICAgICBrZXk7XG5cbiAgICBmb3IgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGl4ZWxSYXRpbyAodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDEgPyAnJyA6ICctJyArIHZhbHVlICsgJ3gnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2lkdGggKHdpZHRoLCBtYXApIHtcbiAgICByZXR1cm4gbWFwW3dpZHRoXSB8fCB3aWR0aDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGZ1bmN0aW9uIHJldHVybkZuICh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vb3AgKCkge1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJ1ZUZuICgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlIChmbiwgd2FpdCkge1xuICAgIHZhciB0aW1lb3V0O1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICBmbi5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgfTtcbn1cbiJdfQ==
