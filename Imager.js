(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Imager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (typeof obj === 'object' && obj !== null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvb25jbGV0b20vd29ya3NwYWNlL0ltYWdlci5qcy9pbmRleC5qcyIsIi9Vc2Vycy9vbmNsZXRvbS93b3Jrc3BhY2UvSW1hZ2VyLmpzL3NyYy9zaGltcy5qcyIsIi9Vc2Vycy9vbmNsZXRvbS93b3Jrc3BhY2UvSW1hZ2VyLmpzL3NyYy90cmFuc2Zvcm1zLmpzIiwiL1VzZXJzL29uY2xldG9tL3dvcmtzcGFjZS9JbWFnZXIuanMvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OzswQ0NFNkMsZ0JBQWdCOzs2Q0FDWixnQkFBZ0I7O3NCQUNyQyxxQkFBcUI7O0lBQXJDLFVBQVU7O0FBSnRCLFlBQVksQ0FBQzs7QUFNYixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUM7QUFDckIsSUFBTSxhQUFhLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWdDaEcsTUFBTTtBQUNYLGFBREssTUFBTSxDQUNWLFFBQVEsRUFBYTs7O1lBQVgsSUFBSSxnQ0FBRyxFQUFFOzs4QkFEZixNQUFNOztBQUduQixZQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7QUFDeEIsa0JBQU0sSUFBSSxLQUFLLENBQUMsNkdBQTZHLENBQUMsQ0FBQTtTQUNqSTs7O0FBR0QsWUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7QUFDOUIsZ0JBQUksQ0FBQyxR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RUFBRSxHQUFHLEVBQUU7QUFDL0IsV0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDO0NBQzlCOzs7Ozs7UUNOZSxRQUFRLEdBQVIsUUFBUTtRQUlSLElBQUksR0FBSixJQUFJO1FBR0osTUFBTSxHQUFOLE1BQU07UUFJTixRQUFRLEdBQVIsUUFBUTtBQWJ4QixZQUFZLENBQUM7O0FBRU4sU0FBUyxRQUFRLENBQUUsS0FBSyxFQUFFO0FBQzdCLFdBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVNLFNBQVMsSUFBSSxHQUFJLEVBQ3ZCOztBQUVNLFNBQVMsTUFBTSxHQUFJO0FBQ3RCLFdBQU8sSUFBSSxDQUFDO0NBQ2Y7O0FBRU0sU0FBUyxRQUFRLENBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtBQUNoQyxRQUFJLE9BQU8sQ0FBQztBQUNaLFdBQU8sWUFBWTtBQUNmLFlBQUksT0FBTyxHQUFHLElBQUk7WUFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDO0FBQ3JDLFlBQUksS0FBSyxHQUFHLGlCQUFZO0FBQ3BCLG1CQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ2YsY0FBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDM0IsQ0FBQztBQUNGLG9CQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEIsZUFBTyxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckMsQ0FBQztDQUNMIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgYWRkRXZlbnQsIGFwcGx5RWFjaCwgZ2V0S2V5cyB9IGZyb20gJy4vc3JjL3NoaW1zLmpzJztcbmltcG9ydCB7IHJldHVybkZuLCBub29wLCB0cnVlRm4sIGRlYm91bmNlIH0gZnJvbSAnLi9zcmMvdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgdHJhbnNmb3JtcyBmcm9tICcuL3NyYy90cmFuc2Zvcm1zLmpzJztcblxuY29uc3QgZG9jID0gZG9jdW1lbnQ7XG5jb25zdCBkZWZhdWx0V2lkdGhzID0gWzk2LCAxMzAsIDE2NSwgMjAwLCAyMzUsIDI3MCwgMzA0LCAzNDAsIDM3NSwgNDEwLCA0NDUsIDQ4NSwgNTIwLCA1NTUsIDU5MCwgNjI1LCA2NjAsIDY5NSwgNzM2XTtcblxuXG4vKlxuICAgIENvbnN0cnVjdCBhIG5ldyBJbWFnZXIgaW5zdGFuY2UsIHBhc3NpbmcgYW4gb3B0aW9uYWwgY29uZmlndXJhdGlvbiBvYmplY3QuXG5cbiAgICBFeGFtcGxlIHVzYWdlOlxuXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIEF2YWlsYWJsZSB3aWR0aHMgZm9yIHlvdXIgaW1hZ2VzXG4gICAgICAgICAgICBhdmFpbGFibGVXaWR0aHM6IFtOdW1iZXJdLFxuXG4gICAgICAgICAgICAvLyBTZWxlY3RvciB0byBiZSB1c2VkIHRvIGxvY2F0ZSB5b3VyIGRpdiBwbGFjZWhvbGRlcnNcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnJyxcblxuICAgICAgICAgICAgLy8gQ2xhc3MgbmFtZSB0byBnaXZlIHlvdXIgcmVzaXphYmxlIGltYWdlc1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJyxcblxuICAgICAgICAgICAgLy8gSWYgc2V0IHRvIHRydWUsIEltYWdlciB3aWxsIHVwZGF0ZSB0aGUgc3JjIGF0dHJpYnV0ZSBvZiB0aGUgcmVsZXZhbnQgaW1hZ2VzXG4gICAgICAgICAgICBvblJlc2l6ZTogQm9vbGVhbixcblxuICAgICAgICAgICAgLy8gVG9nZ2xlIHRoZSBsYXp5IGxvYWQgZnVuY3Rpb25hbGl0eSBvbiBvciBvZmZcbiAgICAgICAgICAgIGxhenlsb2FkOiBCb29sZWFuLFxuXG4gICAgICAgICAgICAvLyBVc2VkIGFsb25nc2lkZSB0aGUgbGF6eWxvYWQgZmVhdHVyZSAoaGVscHMgcGVyZm9ybWFuY2UgYnkgc2V0dGluZyBhIGhpZ2hlciBkZWxheSlcbiAgICAgICAgICAgIHNjcm9sbERlbGF5OiBOdW1iZXJcbiAgICAgICAgfVxuXG4gICAgQHBhcmFtIHtvYmplY3R9IGNvbmZpZ3VyYXRpb24gc2V0dGluZ3NcbiAgICBAcmV0dXJuIHtvYmplY3R9IGluc3RhbmNlIG9mIEltYWdlclxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEltYWdlciB7XG4gICAgY29uc3RydWN0b3IgKGVsZW1lbnRzLCBvcHRzID0ge30pIHtcblxuICAgICAgICBpZiAoZWxlbWVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbWFnZXIuanMgbm93IGV4cGVjdHMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIGJlIGVpdGhlciBhIENTUyBzdHJpbmcgc2VsZWN0b3Igb3IgYSBjb2xsZWN0aW9uIG9mIEhUTUxFbGVtZW50LicpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZWxlY3RvciBzdHJpbmcgKG5vdCBlbGVtZW50cylcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9wdHMuc2VsZWN0b3IgPSBlbGVtZW50cztcbiAgICAgICAgICAgIGVsZW1lbnRzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ29wdHMnIG9iamVjdCAobm90IGVsZW1lbnRzKVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgZWxlbWVudHMubGVuZ3RoID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgb3B0cyA9IGVsZW1lbnRzO1xuICAgICAgICAgICAgZWxlbWVudHMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZpZXdwb3J0SGVpZ2h0ID0gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIHRoaXMuc2VsZWN0b3IgPSAhZWxlbWVudHMgPyAob3B0cy5zZWxlY3RvciB8fCAnLmRlbGF5ZWQtaW1hZ2UtbG9hZCcpIDogbnVsbDtcbiAgICAgICAgdGhpcy5jbGFzc05hbWUgPSBvcHRzLmNsYXNzTmFtZSB8fCAnaW1hZ2UtcmVwbGFjZSc7XG4gICAgICAgIHRoaXMuZ2lmID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgICB0aGlzLmdpZi5zcmMgPSAnZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoRUFBSkFJQUFBUC8vL3dBQUFDSDVCQUVBQUFBQUxBQUFBQUFRQUFrQUFBSUtoSStweSswUG81eVVGUUE3JztcbiAgICAgICAgdGhpcy5naWYuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG4gICAgICAgIHRoaXMuZ2lmLmFsdCA9ICcnO1xuICAgICAgICB0aGlzLmxhenlsb2FkT2Zmc2V0ID0gb3B0cy5sYXp5bG9hZE9mZnNldCB8fCAwO1xuICAgICAgICB0aGlzLnNjcm9sbERlbGF5ID0gb3B0cy5zY3JvbGxEZWxheSB8fCAyNTA7XG4gICAgICAgIHRoaXMub25SZXNpemUgPSBvcHRzLmhhc093blByb3BlcnR5KCdvblJlc2l6ZScpID8gb3B0cy5vblJlc2l6ZSA6IHRydWU7XG4gICAgICAgIHRoaXMubGF6eWxvYWQgPSBvcHRzLmhhc093blByb3BlcnR5KCdsYXp5bG9hZCcpID8gb3B0cy5sYXp5bG9hZCA6IGZhbHNlO1xuICAgICAgICB0aGlzLnNjcm9sbGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXZhaWxhYmxlUGl4ZWxSYXRpb3MgPSBvcHRzLmF2YWlsYWJsZVBpeGVsUmF0aW9zIHx8IFsxLCAyXTtcbiAgICAgICAgdGhpcy5hdmFpbGFibGVXaWR0aHMgPSBvcHRzLmF2YWlsYWJsZVdpZHRocyB8fCBkZWZhdWx0V2lkdGhzO1xuICAgICAgICB0aGlzLm9uSW1hZ2VzUmVwbGFjZWQgPSBvcHRzLm9uSW1hZ2VzUmVwbGFjZWQgfHwgbm9vcDtcbiAgICAgICAgdGhpcy53aWR0aHNNYXAgPSB7fTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUGl4ZWxSYXRpbygpO1xuICAgICAgICB0aGlzLndpZHRoSW50ZXJwb2xhdG9yID0gb3B0cy53aWR0aEludGVycG9sYXRvciB8fCByZXR1cm5GbjtcblxuICAgICAgICAvLyBOZWVkZWQgYXMgSUU4IGFkZHMgYSBkZWZhdWx0IGB3aWR0aGAvYGhlaWdodGAgYXR0cmlidXRl4oCmXG4gICAgICAgIHRoaXMuZ2lmLnJlbW92ZUF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XG4gICAgICAgIHRoaXMuZ2lmLnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuYXZhaWxhYmxlV2lkdGhzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuYXZhaWxhYmxlV2lkdGhzLmxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoc01hcCA9IEltYWdlci5jcmVhdGVXaWR0aHNNYXAodGhpcy5hdmFpbGFibGVXaWR0aHMsIHRoaXMud2lkdGhJbnRlcnBvbGF0b3IsIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoc01hcCA9IHRoaXMuYXZhaWxhYmxlV2lkdGhzO1xuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlV2lkdGhzID0gZ2V0S2V5cyh0aGlzLmF2YWlsYWJsZVdpZHRocyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlV2lkdGhzID0gdGhpcy5hdmFpbGFibGVXaWR0aHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kaXZzID0gW107XG4gICAgICAgIHRoaXMuYWRkKGVsZW1lbnRzIHx8IHRoaXMuc2VsZWN0b3IpO1xuICAgICAgICB0aGlzLnJlYWR5KG9wdHMub25SZWFkeSk7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmluaXQoKSwgMCk7XG4gICAgfVxuXG4gICAgaW5pdCAoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZmlsdGVyRm4gPSB0cnVlRm47XG5cbiAgICAgICAgaWYgKHRoaXMubGF6eWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTY3JvbGxFdmVudCgpO1xuXG4gICAgICAgICAgICB0aGlzLnNjcm9sbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsQ2hlY2soKTtcblxuICAgICAgICAgICAgZmlsdGVyRm4gPSAoZWxlbWVudCkgPT4gdGhpcy5pc1BsYWNlaG9sZGVyKGVsZW1lbnQpID09PSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJbWFnZXNOZWVkUmVwbGFjaW5nKHRoaXMuZGl2cyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vblJlc2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5yZWdpc3RlclJlc2l6ZUV2ZW50KGZpbHRlckZuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub25SZWFkeSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hlbiBJbWFnZXIgaXMgcmVhZHkgdG8gd29ya1xuICAgICAqIEl0IGFjdHMgYXMgYSBjb252ZW5pZW50L3Nob3J0Y3V0IGZvciBgbmV3IEltYWdlcih7IG9uUmVhZHk6IGZuIH0pYFxuICAgICAqXG4gICAgICogQHNpbmNlIDAuMy4xXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKi9cbiAgICByZWFkeSAoZm4pIHtcbiAgICAgICAgdGhpcy5vblJlYWR5ID0gZm4gfHwgbm9vcDtcbiAgICB9XG5cbiAgICBhZGQgKGVsZW1lbnRzT3JTZWxlY3Rvcikge1xuXG4gICAgICAgIGVsZW1lbnRzT3JTZWxlY3RvciA9IGVsZW1lbnRzT3JTZWxlY3RvciB8fCB0aGlzLnNlbGVjdG9yO1xuICAgICAgICB2YXIgZWxlbWVudHMgPSB0eXBlb2YgZWxlbWVudHNPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGVsZW1lbnRzT3JTZWxlY3RvcikgOiAvLyBTZWxlY3RvclxuICAgICAgICAgICAgZWxlbWVudHNPclNlbGVjdG9yOyAvLyBFbGVtZW50cyAoTm9kZUxpc3Qgb3IgYXJyYXkgb2YgTm9kZXMpXG5cbiAgICAgICAgaWYgKGVsZW1lbnRzICYmIGVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWwgPSBhcHBseUVhY2goZWxlbWVudHMsIHJldHVybkZuKTtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlRGl2c1RvRW1wdHlJbWFnZXMoYWRkaXRpb25hbCk7XG4gICAgICAgICAgICB0aGlzLmRpdnMgPSB0aGlzLmRpdnMuY29uY2F0KGFkZGl0aW9uYWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2Nyb2xsQ2hlY2sgKCkge1xuICAgICAgICB2YXIgb2Zmc2NyZWVuSW1hZ2VDb3VudCA9IDA7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IFtdO1xuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGVkKSB7XG4gICAgICAgICAgICAvLyBjb2xsZWN0cyBhIHN1YnNldCBvZiBub3QteWV0LXJlc3BvbnNpdmUgaW1hZ2VzIGFuZCBub3Qgb2Zmc2NyZWVuIGFueW1vcmVcbiAgICAgICAgICAgIGFwcGx5RWFjaCh0aGlzLmRpdnMsIChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQbGFjZWhvbGRlcihlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICArK29mZnNjcmVlbkltYWdlQ291bnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNUaGlzRWxlbWVudE9uU2NyZWVuKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChvZmZzY3JlZW5JbWFnZUNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2hhbmdlRGl2c1RvRW1wdHlJbWFnZXMoZWxlbWVudHMpO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlR2lmIChlbGVtZW50KSB7XG4gICAgICAgIC8vIGlmIHRoZSBlbGVtZW50IGlzIGFscmVhZHkgYSByZXNwb25zaXZlIGltYWdlIHRoZW4gd2UgZG9uJ3QgcmVwbGFjZSBpdCBhZ2FpblxuICAgICAgICBpZiAoZWxlbWVudC5jbGFzc05hbWUubWF0Y2gobmV3IFJlZ0V4cCgnKF58ICknICsgdGhpcy5jbGFzc05hbWUgKyAnKCB8JCknKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnRDbGFzc05hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jbGFzcycpO1xuICAgICAgICB2YXIgZWxlbWVudFdpZHRoID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtd2lkdGgnKTtcbiAgICAgICAgdmFyIGdpZiA9IHRoaXMuZ2lmLmNsb25lTm9kZShmYWxzZSk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnRXaWR0aCkge1xuICAgICAgICAgICAgZ2lmLndpZHRoID0gZWxlbWVudFdpZHRoO1xuICAgICAgICAgICAgZ2lmLnNldEF0dHJpYnV0ZSgnZGF0YS13aWR0aCcsIGVsZW1lbnRXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBnaWYuY2xhc3NOYW1lID0gKGVsZW1lbnRDbGFzc05hbWUgPyBlbGVtZW50Q2xhc3NOYW1lICsgJyAnIDogJycpICsgdGhpcy5jbGFzc05hbWU7XG4gICAgICAgIGdpZi5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJywgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykpO1xuICAgICAgICBnaWYuc2V0QXR0cmlidXRlKCdhbHQnLCBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1hbHQnKSB8fCB0aGlzLmdpZi5hbHQpO1xuXG4gICAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoZ2lmLCBlbGVtZW50KTtcblxuICAgICAgICByZXR1cm4gZ2lmO1xuICAgIH1cblxuICAgIGNoYW5nZURpdnNUb0VtcHR5SW1hZ2VzIChlbGVtZW50cykge1xuICAgICAgICBhcHBseUVhY2goZWxlbWVudHMsIChlbGVtZW50LCBpKSA9PiB7XG4gICAgICAgICAgICBlbGVtZW50c1tpXSA9IHRoaXMuY3JlYXRlR2lmKGVsZW1lbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgdGhpcy5jaGVja0ltYWdlc05lZWRSZXBsYWNpbmcoZWxlbWVudHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5kaWNhdGVzIGlmIGFuIGVsZW1lbnQgaXMgYW4gSW1hZ2VyIHBsYWNlaG9sZGVyXG4gICAgICpcbiAgICAgKiBAc2luY2UgMS4zLjFcbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1BsYWNlaG9sZGVyIChlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50LnNyYyA9PT0gdGhpcy5naWYuc3JjO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbiBlbGVtZW50IGlzIGxvY2F0ZWQgd2l0aGluIGEgc2NyZWVuIG9mZnNldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1RoaXNFbGVtZW50T25TY3JlZW4gKGVsZW1lbnQpIHtcbiAgICAgICAgLy8gZG9jdW1lbnQuYm9keS5zY3JvbGxUb3Agd2FzIHdvcmtpbmcgaW4gQ2hyb21lIGJ1dCBkaWRuJ3Qgd29yayBvbiBGaXJlZm94LCBzbyBoYWQgdG8gcmVzb3J0IHRvIHdpbmRvdy5wYWdlWU9mZnNldFxuICAgICAgICAvLyBidXQgY2FuJ3QgZmFsbGJhY2sgdG8gZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgYXMgdGhhdCBkb2Vzbid0IHdvcmsgaW4gSUUgd2l0aCBhIGRvY3R5cGUgKD8pIHNvIGhhdmUgdG8gdXNlIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXRUb3AgPSAwO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gSW1hZ2VyLmdldFBhZ2VPZmZzZXQoKSArIHRoaXMubGF6eWxvYWRPZmZzZXQ7XG5cbiAgICAgICAgaWYgKGVsZW1lbnQub2Zmc2V0UGFyZW50KSB7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgZWxlbWVudE9mZnNldFRvcCArPSBlbGVtZW50Lm9mZnNldFRvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5vZmZzZXRQYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnRPZmZzZXRUb3AgPCAodGhpcy52aWV3cG9ydEhlaWdodCArIG9mZnNldCk7XG4gICAgfVxuXG4gICAgY2hlY2tJbWFnZXNOZWVkUmVwbGFjaW5nIChpbWFnZXMsIGZpbHRlckZuKSB7XG4gICAgICAgIGZpbHRlckZuID0gZmlsdGVyRm4gfHwgdHJ1ZUZuO1xuXG4gICAgICAgIGlmICghdGhpcy5pc1Jlc2l6aW5nKSB7XG4gICAgICAgICAgICB0aGlzLmlzUmVzaXppbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoUGl4ZWxSYXRpbygpO1xuXG4gICAgICAgICAgICBhcHBseUVhY2goaW1hZ2VzLCAoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmlsdGVyRm4oaW1hZ2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVwbGFjZUltYWdlc0Jhc2VkT25TY3JlZW5EaW1lbnNpb25zKGltYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5pc1Jlc2l6aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLm9uSW1hZ2VzUmVwbGFjZWQoaW1hZ2VzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZ3JhZGVzIGFuIGltYWdlIGZyb20gYW4gZW1wdHkgcGxhY2Vob2xkZXIgdG8gYSBmdWxseSBzb3VyY2VkIGltYWdlIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2VcbiAgICAgKi9cbiAgICByZXBsYWNlSW1hZ2VzQmFzZWRPblNjcmVlbkRpbWVuc2lvbnMgKGltYWdlKSB7XG4gICAgICAgIHZhciBjb21wdXRlZFdpZHRoLCBuYXR1cmFsV2lkdGg7XG5cbiAgICAgICAgbmF0dXJhbFdpZHRoID0gSW1hZ2VyLmdldE5hdHVyYWxXaWR0aChpbWFnZSk7XG4gICAgICAgIGNvbXB1dGVkV2lkdGggPSB0eXBlb2YgdGhpcy5hdmFpbGFibGVXaWR0aHMgPT09ICdmdW5jdGlvbicgPyB0aGlzLmF2YWlsYWJsZVdpZHRocyhpbWFnZSlcbiAgICAgICAgICAgIDogdGhpcy5kZXRlcm1pbmVBcHByb3ByaWF0ZVJlc29sdXRpb24oaW1hZ2UpO1xuXG4gICAgICAgIGltYWdlLndpZHRoID0gY29tcHV0ZWRXaWR0aDtcblxuICAgICAgICBpZiAoIXRoaXMuaXNQbGFjZWhvbGRlcihpbWFnZSkgJiYgY29tcHV0ZWRXaWR0aCA8PSBuYXR1cmFsV2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGltYWdlLnNyYyA9IHRoaXMuY2hhbmdlSW1hZ2VTcmNUb1VzZU5ld0ltYWdlRGltZW5zaW9ucyhpbWFnZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJyksIGNvbXB1dGVkV2lkdGgpO1xuICAgICAgICBpbWFnZS5yZW1vdmVBdHRyaWJ1dGUoJ3dpZHRoJyk7XG4gICAgICAgIGltYWdlLnJlbW92ZUF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lQXBwcm9wcmlhdGVSZXNvbHV0aW9uIChpbWFnZSkge1xuICAgICAgICByZXR1cm4gSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZShpbWFnZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtd2lkdGgnKSB8fCBpbWFnZS5wYXJlbnROb2RlLmNsaWVudFdpZHRoLCB0aGlzLmF2YWlsYWJsZVdpZHRocyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgZGV2aWNlIHBpeGVsIHJhdGlvIHZhbHVlIHVzZWQgYnkgSW1hZ2VyXG4gICAgICpcbiAgICAgKiBJdCBpcyBwZXJmb3JtZWQgYmVmb3JlIGVhY2ggcmVwbGFjZW1lbnQgbG9vcCwgaW4gY2FzZSBhIHVzZXIgem9vbWVkIGluL291dFxuICAgICAqIGFuZCB0aHVzIHVwZGF0ZWQgdGhlIGB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpb2AgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAYXBpXG4gICAgICogQHNpbmNlIDEuMC4xXG4gICAgICovXG4gICAgcmVmcmVzaFBpeGVsUmF0aW8gKCkge1xuICAgICAgICB0aGlzLmRldmljZVBpeGVsUmF0aW8gPSBJbWFnZXIuZ2V0Q2xvc2VzdFZhbHVlKEltYWdlci5nZXRQaXhlbFJhdGlvKCksIHRoaXMuYXZhaWxhYmxlUGl4ZWxSYXRpb3MpO1xuICAgIH1cblxuICAgIGNoYW5nZUltYWdlU3JjVG9Vc2VOZXdJbWFnZURpbWVuc2lvbnMgKHNyYywgc2VsZWN0ZWRXaWR0aCkge1xuICAgICAgICByZXR1cm4gc3JjXG4gICAgICAgICAgICAucmVwbGFjZSgve3dpZHRofS9nLCB0cmFuc2Zvcm1zLndpZHRoKHNlbGVjdGVkV2lkdGgsIHRoaXMud2lkdGhzTWFwKSlcbiAgICAgICAgICAgIC5yZXBsYWNlKC97cGl4ZWxfcmF0aW99L2csIHRyYW5zZm9ybXMucGl4ZWxSYXRpbyh0aGlzLmRldmljZVBpeGVsUmF0aW8pKTtcbiAgICB9XG5cblxuXG4gICAgcmVnaXN0ZXJSZXNpemVFdmVudCAoZmlsdGVyRm4pIHtcbiAgICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgZGVib3VuY2UoKCkgPT4gdGhpcy5jaGVja0ltYWdlc05lZWRSZXBsYWNpbmcodGhpcy5kaXZzLCBmaWx0ZXJGbiksIDEwMCkpO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyU2Nyb2xsRXZlbnQgKCkge1xuICAgICAgICB0aGlzLnNjcm9sbGVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnNjcm9sbENoZWNrKCksIHRoaXMuc2Nyb2xsRGVsYXkpO1xuXG4gICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Njcm9sbCcsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZWQgPSB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudmlld3BvcnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxlZCA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQaXhlbFJhdGlvIChjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiAoY29udGV4dCB8fCB3aW5kb3cpWydkZXZpY2VQaXhlbFJhdGlvJ10gfHwgMTtcbiAgICB9O1xuXG4gICAgc3RhdGljIGNyZWF0ZVdpZHRoc01hcCAod2lkdGhzLCBpbnRlcnBvbGF0b3IsIHBpeGVsUmF0aW8pIHtcbiAgICAgICAgdmFyIG1hcCA9IHt9LFxuICAgICAgICAgICAgaSAgID0gd2lkdGhzLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBtYXBbd2lkdGhzW2ldXSA9IGludGVycG9sYXRvcih3aWR0aHNbaV0sIHBpeGVsUmF0aW8pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICB9O1xuXG5cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGNsb3Nlc3QgdXBwZXIgdmFsdWUuXG4gICAgICpcbiAgICAgKiBgYGBqc1xuICAgICAqIHZhciBjYW5kaWRhdGVzID0gWzEsIDEuNSwgMl07XG4gICAgICpcbiAgICAgKiBJbWFnZXIuZ2V0Q2xvc2VzdFZhbHVlKDAuOCwgY2FuZGlkYXRlcyk7IC8vIC0+IDFcbiAgICAgKiBJbWFnZXIuZ2V0Q2xvc2VzdFZhbHVlKDEsIGNhbmRpZGF0ZXMpOyAvLyAtPiAxXG4gICAgICogSW1hZ2VyLmdldENsb3Nlc3RWYWx1ZSgxLjMsIGNhbmRpZGF0ZXMpOyAvLyAtPiAxLjVcbiAgICAgKiBJbWFnZXIuZ2V0Q2xvc2VzdFZhbHVlKDMsIGNhbmRpZGF0ZXMpOyAvLyAtPiAyXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAYXBpXG4gICAgICogQHNpbmNlIDEuMC4xXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGJhc2VWYWx1ZVxuICAgICAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IGNhbmRpZGF0ZXNcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRDbG9zZXN0VmFsdWUgKGJhc2VWYWx1ZSwgY2FuZGlkYXRlcykge1xuICAgICAgICB2YXIgaSA9IGNhbmRpZGF0ZXMubGVuZ3RoLFxuICAgICAgICAgICAgc2VsZWN0ZWRXaWR0aCA9IGNhbmRpZGF0ZXNbaSAtIDFdO1xuXG4gICAgICAgIGJhc2VWYWx1ZSA9IHBhcnNlRmxvYXQoYmFzZVZhbHVlKTtcblxuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBpZiAoYmFzZVZhbHVlIDw9IGNhbmRpZGF0ZXNbaV0pIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFdpZHRoID0gY2FuZGlkYXRlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZWxlY3RlZFdpZHRoO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQYWdlT2Zmc2V0R2VuZXJhdG9yICh0ZXN0Q2FzZSkge1xuICAgICAgICBpZiAodGVzdENhc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBuYXR1cmFsV2lkdGggb2YgYW4gaW1hZ2UgZWxlbWVudC5cbiAqXG4gKiBAc2luY2UgMS4zLjFcbiAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2VcbiAqIEByZXR1cm4ge051bWJlcn0gSW1hZ2Ugd2lkdGggaW4gcGl4ZWxzXG4gKi9cbkltYWdlci5nZXROYXR1cmFsV2lkdGggPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICgnbmF0dXJhbFdpZHRoJyBpbiAobmV3IEltYWdlKCkpKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW1hZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZS5uYXR1cmFsV2lkdGg7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIG5vbi1IVE1MNSBicm93c2VycyB3b3JrYXJvdW5kXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpbWFnZSkge1xuICAgICAgICB2YXIgaW1hZ2VDb3B5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgIGltYWdlQ29weS5zcmMgPSBpbWFnZS5zcmM7XG4gICAgICAgIHJldHVybiBpbWFnZUNvcHkud2lkdGg7XG4gICAgfTtcbn0pKCk7XG5cbi8vIFRoaXMgZm9ybSBpcyB1c2VkIGJlY2F1c2UgaXQgc2VlbXMgaW1wb3NzaWJsZSB0byBzdHViIGB3aW5kb3cucGFnZVlPZmZzZXRgXG5JbWFnZXIuZ2V0UGFnZU9mZnNldCA9IEltYWdlci5nZXRQYWdlT2Zmc2V0R2VuZXJhdG9yKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh3aW5kb3csICdwYWdlWU9mZnNldCcpKTtcblxuLy8gRXhwb3J0aW5nIGZvciB0ZXN0aW5nIGFuZCBjb252ZW5pZW5jZSBwdXJwb3NlXG5JbWFnZXIuYXBwbHlFYWNoID0gYXBwbHlFYWNoO1xuSW1hZ2VyLmFkZEV2ZW50ID0gYWRkRXZlbnQ7XG5JbWFnZXIuZGVib3VuY2UgPSBkZWJvdW5jZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IHZhciBhZGRFdmVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFkZFN0YW5kYXJkRXZlbnRMaXN0ZW5lcihlbCwgZXZlbnROYW1lLCBmbikge1xuICAgICAgICAgICAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbiwgZmFsc2UpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFkZElFRXZlbnRMaXN0ZW5lcihlbCwgZXZlbnROYW1lLCBmbikge1xuICAgICAgICAgICAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG59KSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlFYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrRWFjaCkge1xuICAgIHZhciBpID0gMCxcbiAgICAgICAgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGgsXG4gICAgICAgIG5ld19jb2xsZWN0aW9uID0gW107XG5cbiAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5ld19jb2xsZWN0aW9uW2ldID0gY2FsbGJhY2tFYWNoKGNvbGxlY3Rpb25baV0sIGkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdfY29sbGVjdGlvbjtcbn07XG5cbmV4cG9ydCB2YXIgZ2V0S2V5cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5rZXlzIDogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW10sXG4gICAgICAgIGtleTtcblxuICAgIGZvciAoa2V5IGluIG9iamVjdCkge1xuICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwaXhlbFJhdGlvICh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMSA/ICcnIDogJy0nICsgdmFsdWUgKyAneCc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3aWR0aCAod2lkdGgsIG1hcCkge1xuICAgIHJldHVybiBtYXBbd2lkdGhdIHx8IHdpZHRoO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmV0dXJuRm4gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9vcCAoKSB7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cnVlRm4gKCkge1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2UgKGZuLCB3YWl0KSB7XG4gICAgdmFyIHRpbWVvdXQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICB9O1xufVxuIl19
