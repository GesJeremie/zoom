(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("magnify.js", function(exports, require, module) {
/**
 * @author Jeremie Ges <jges@weblinc.com>
 */
(function($) {

  function Magnify() {

      /**
       * DOM accessors
       * @type {Object}
       */
      this.$dom = {
          container: null,
          image: null
      },

      /**
       * Keep track of things
       * @type {Object}
       */
      this.flags = {
          imageLoaded: false,
      },

      /**
       * Contains every options of $.fn.magnify.defaults
       * merged with the options provided by the user
       * @type {Object}
       */
      this.options = {},

      /**
       * Initialize the widget with the right options,
       * scope (container) and boot
       * @param {HTMLElement} container - The container of the zoom element
       * @param {Object} options - The options provided by the user
       */
      this.init = function(container, options) {
          this.$dom.container = $(container);
          this.options = _.extend($.fn.magnify.defaults, options);
          this.setup();
          this.events();
      },

      /**
       * Setup minimal dependencies
       */
      this.setup = function() {
          this.setupImage();
      },

      /**
       * Create a blank <img> tag which
       * will be used as the zoom image.
       */
      this.setupImage = function() {
          this.$dom.image = $('<img/>');
      },

      /**
       * Attach events and start listen
       */
      this.events = function() {
          this.$dom.image.on('load', this.onLoadImage.bind(this));

          this.$dom.container
            .on('mouseenter', this.onEnterContainer.bind(this))
            .on('mouseleave', this.onLeaveContainer.bind(this))
            .on('mousemove', this.onMoveContainer.bind(this));

          if (this.options.touchSupport) {
            this.$dom.container
              .on('touchstart', this.onEnterContainer.bind(this))
              .on('touchend', this.onLeaveContainer.bind(this))
              .on('touchmove', this.onMoveContainer.bind(this));
          }

          this.$dom.container.on('magnify.destroy', this.destroy.bind(this));
      },

      /**
       * Callback when the zoom image is loaded
       */
      this.onLoadImage = function() {
          // Insert zoom image in page
          this.$dom.image
              .css({
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: this.$dom.image.get(0).width,
                  height: this.$dom.image.get(0).height,
                  border: 'none',
                  maxWidth: 'none',
                  maxHeight: 'none',
              })
              .attr('role', 'presentation')
              .appendTo(this.$dom.container);

          this.$dom.container.css('overflow', 'hidden');
          this.flags.imageLoaded = true;
      },

      /**
       * Callback when the mouse / finger enters inside
       * the container
       */
      this.onEnterContainer = function(e) {
          e.preventDefault();

          if (!this.flags.imageLoaded) {
            this.loadImage();
          }

          this.showImage();
      },

      /**
       * Callback when the mouse / finger leaves
       * the container
       */
      this.onLeaveContainer = function(e) {
        e.preventDefault();
        this.hideImage();
      },

      /**
       * Callback when the mouse / finger is moving
       * in the container
       */
      this.onMoveContainer = function(e) {
        e.preventDefault();
        this.refreshPositionImage(e);
      },

      /**
       * Depending the current position of the mouse / finger,
       * moves the properties top/left of the zoom image. 
       */
      this.refreshPositionImage = function(e) {
          var pageX = e.pageX || e.originalEvent.pageX,
              pageY = e.pageY || e.originalEvent.pageY,
              containerOffset = this.$dom.container.offset(),
              containerWidth = this.$dom.container.outerWidth(),
              containerHeight = this.$dom.container.outerHeight(),
              xRatio = (this.$dom.image.prop('width') - containerWidth) / containerWidth,
              yRatio = (this.$dom.image.prop('height') - containerHeight) / containerHeight,
              top = (pageY - containerOffset.top),
              left = (pageX - containerOffset.left);

        top = Math.max(Math.min(top, containerHeight), 0);
        left = Math.max(Math.min(left, containerWidth), 0);

        this.$dom.image.css({
          top: (top * -yRatio) + 'px',
          left: (left * -xRatio) + 'px'
        });
      },

      /**
       * Add the attribute src of the zoom image,
       * therefore it triggers the load of the zoom
       * image.
       */
      this.loadImage = function() {
        this.$dom.image.attr('src', this.getUrlImage());
      },

      /**
       * Hide the zoom image
       */
      this.hideImage = function() {
        this.$dom.image.css('opacity', 0);
      },

      /**
       * Show the zoom image
       */
      this.showImage = function() {
        this.$dom.image.css('opacity', 1);
      },

      /**
       * Get the src url of the zoom image
       */
      this.getUrlImage = function() {
        if (!_.isEmpty(this.options.source)) {
          return this.options.source;
        }

        return this.$dom.container.find('img').first().data('magnify-source');
      },

      /**
       * Teardown the changes
       */
      this.destroy = function() {
        this.$dom.container.off('mouseenter mouseleave mousemove magnify.destroy');
        this.$dom.image.off('load');
        this.$dom.image.remove();
        this.$dom.container.css('overflow', '');
      }
  }

  /**
   * Public jQuery API
   */
  
  $.fn.magnify = function(options) {

      var options = options || {};

      return this.each(function() {
          new Magnify().init(this, options);
      });
  };

  $.fn.magnify.defaults = {

    /**
     * The url of the zoom image. 
     * If not specified, the plugin will look for the data attribute
     * data-magnify-source on the thumbnail <img>.
     * @type {String}
     */
    source: null,

    /**
     * Do you want to enable finger gestures on
     * touch-enabled devices?
     * @type {Boolean}
     */
    touchSupport: true
  };

})(window.jQuery);
});

require.register("zoom.js", function(exports, require, module) {
/**
 * @author Jeremie Ges <jges@weblinc.com>
 */
(function($) {
    function Zoom() {

        /**
         * Cache DOM properties
         * @type {Object}
         */
        this.$dom = {
            container: null,
            image: null,
            thumbnail: null
        },

        /**
         * Keep track of things
         * @type {Object}
         */
        this.flags = {

            /**
             * The current scale
             * @type {Number}
             */
            currentScale: 1,

            /**
             * Check if the zoom image is loaded
             * @type {Boolean}
             */
            imageLoaded: false,

            /**
             * We use "transform: translate()" to "move" the
             * zoom image (for smooth animations). When X or Y
             * change, we update this property.
             * @type {Object}
             */
            imageTranslate: {
                x: 0,
                y: 0
            },

            /**
             * When the user starts to pinch, we keep track of the 
             * coordinates and "freeze" theù until the pinch stops.
             * Therefore the scale up / down is smoother.
             * @type {Object}
             */
            pinchCoordinates: {
                x: 0,
                y: 0
            },

            /**
             * Flag to know if we have to scale down or scale up 
             * @type {Number}
             */
            pinchScale: 0,

            /**
             * The Hammer js created instance (to be able to destroy it)
             * @type {Object}
             */
            hammer: null
        },

        this.options = {},

        /**
         * Main entry of the widget
         * @param  {jQueryElement} container The scope
         * @param  {Object}        options   The options given by the user
         */
        this.init = function(container, options) {
            this.$dom.container = $(container);
            this.options = _.extend($.fn.zoom.defaults, options);
            this.setup();
            this.events();
        },

        /**
         * Setup prerequisites before to listen
         * the events
         */
        this.setup = function() {
            this.setupImage();
            this.setupThumbnail();
            this.setupLoadImage();
        },

        /**
         * Create a blank image where the zoom image
         * will be stored
         */
        this.setupImage = function() {
            this.$dom.image = $('<img/>');
        },

        /**
         * Alias the $dom property thumbnail
         * to the right image
         */
        this.setupThumbnail = function() {
            this.$dom.thumbnail = this.$dom.container.find('img').first();
        },

        /**
         * Will load the image directly if 
         * needed.
         */
        this.setupLoadImage = function() {
            if (this.options.lazyLoad) {
                return;
            }

            this.loadImage();
        },

        /**
         * Start to listen the events.
         */
        this.events = function() {
            this.$dom.image.on('load', this.onLoadImage.bind(this));

            this.getInstanceHammer(this.$dom.container.get(0))
                .on('doubletap', this.onDoubleTapContainer.bind(this))
                .on('pan',  this.onPanContainer.bind(this))
                .on('pinchstart', this.onPinchStartContainer.bind(this))
                .on('pinch', this.onPinchContainer.bind(this));

            this.$dom.container.on('zoom.destroy', this.onDestroy.bind(this));

            if (this.options.lazyLoad) {
                this.$dom.container.on('click', this.onClickContainer.bind(this));
            }
        },

        /**
         * When the zoom image is loaded
         */
        this.onLoadImage = function() {
            this.$dom.image
                .css({
                    opacity: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: this.$dom.container.width(),
                    height: this.$dom.container.outerHeight(),
                    border: 'none',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transformOrigin: '0 0',
                    transform: 'translate(0, 0) scale(1)',
                    transition: 'all 1s'
                })
                .attr('role', 'presentation')
                .appendTo(this.$dom.container);

            this.$dom.container.css('overflow', 'hidden');

            this.flags.imageLoaded = true;
        },

        /**
         * This callback is only called if the  lazyLoad option is set to true.
         * Click on the container will trigger the load.
         */
        this.onClickContainer = function() {
            this.loadImage();
            this.$dom.container.off('click');
        },

        /**
         * When the user start to pan on the container
         */
        this.onPanContainer = function(e) {

            var x = this.flags.imageTranslate.x,
                y = this.flags.imageTranslate.y,
                newX = x - (e.deltaX / 3),
                newY = y - (e.deltaY / 3);

            e.preventDefault();

            if (!this.flags.imageLoaded) {
                return;
            }

            if (newX > 0) {
                newX = 0;
            }

            if (newY > 0) {
                newY = 0;
            }

            if (newX < this.getPanLimits().x) {
                newX = this.getPanLimits().x;
            }

            if (newY < this.getPanLimits().y) {
                newY = this.getPanLimits().y;
            }

            this.$dom.image.css({
                transition: 'all 0s'
            });

            this.updateImage(newX, newY);
        },

        /**
         * When the user starts to pinch the container
         * we want to keep track of the point clicked
         * (coordinates) to scale up / down gracefully.
         * @param  {Event} e The pinch event
         */
        this.onPinchStartContainer = function(e) {
            e.preventDefault();

            if (!this.flags.imageLoaded) {
                return;
            }

            this.$dom.image.css({
                transition: 'all 1s'
            });

            this.flags.pinchCoordinates = e.center;
        },

        /**
         * Guess if we have to scale up / down
         * the zoom image on pinch
         * @param  {Event} e The pinch event
         */
        this.onPinchContainer = function(e) {
            var scale = e.scale;

            e.preventDefault();

            if (!this.flags.imageLoaded) {
                return;
            }

            if (scale < this.flags.pinchScale) {
                this.onScaleDown();
            } else {
                this.onScaleUp();
            }

            this.flags.pinchScale = scale;
        },

        /**
         * Scale down the zoom image around the point
         * clicked by the user at the start of the pinch
         */
        this.onScaleDown = function() {

            var scale = this.flags.currentScale,
                containerOffset = this.$dom.container.offset(),
                mousePositionOnImageX,
                mousePositionOnImageY,
                offsetX,
                offsetY,
                x,
                y;

            if (!this.flags.imageLoaded) {
                return;
            }

            if (scale <= 1) {
                return;
            }

            scale = scale - this.options.deltaScale;

            mousePositionOnImageX = this.flags.pinchCoordinates.x - containerOffset.left;
            mousePositionOnImageY = this.flags.pinchCoordinates.y - containerOffset.top;

            offsetX = mousePositionOnImageX * this.options.deltaScale;
            offsetY = mousePositionOnImageY * this.options.deltaScale;

            x = this.flags.imageTranslate.x < 0 ? this.flags.imageTranslate.x : 0;
            y = this.flags.imageTranslate.y < 0 ? this.flags.imageTranslate.y : 0;

            offsetX = offsetX + x;
            offsetY = offsetY + y;

            if (scale <= 1) {
                scale = 1;
                offsetX = 0;
                offsetY = 0;
            }

            this.updateImage(offsetX, offsetY, scale);
        },

        /**
         * Scale up the zoom image around the point
         * clicked by the user at the start of the pinch
         */
        this.onScaleUp = function() {

            var scale = this.flags.currentScale + this.options.deltaScale,
                containerOffset = this.$dom.container.offset(),
                offsetX,
                offsetY,
                mousePositionOnImageX,
                mousePositionOnImageY;

            if (!this.flags.imageLoaded) {
                return;
            }

            if (scale > this.getScaleLimitImage()) {
                return;
            }

            mousePositionOnImageX = (this.flags.pinchCoordinates.x - containerOffset.left);
            mousePositionOnImageY = (this.flags.pinchCoordinates.y - containerOffset.top);

            offsetX = -(mousePositionOnImageX * this.options.deltaScale);
            offsetY = -(mousePositionOnImageY * this.options.deltaScale);

            offsetX = offsetX < 0 ? offsetX + this.flags.imageTranslate.x : 0;
            offsetY = offsetY < 0 ? offsetY + this.flags.imageTranslate.y : 0;

            this.updateImage(offsetX, offsetY, scale);
        },

        /**
         * When the user double tap on the container,
         * depending the current scale we zoom the image
         * to its maximum or minimum
         */
        this.onDoubleTapContainer = function(e) {

            var coordinates = e.center;

            e.preventDefault();

            if (!this.flags.imageLoaded) {
                return;
            }

            this.$dom.image.css({
                transition: 'all 1s'
            });

            if (this.flags.currentScale === 1) {
                this.zoomMaximum(coordinates);
            } else {
                this.zoomMinimum();
            }
        },

        /**
         * Will scale up to the maximum scale allowed taking in account
         * the focal point clicked by the user.
         * @param  {Object} coordinates - X / Y of the point clicked
         */
        this.zoomMaximum = function(coordinates) {
            var maximumScale = this.getScaleLimitImage(),
                containerOffset = this.$dom.container.offset(),
                mousePositionOnImageX = (coordinates.x - containerOffset.left),
                mousePositionOnImageY = (coordinates.y - containerOffset.top),
                offsetX = -(mousePositionOnImageX * (maximumScale - this.flags.currentScale)),
                offsetY = -(mousePositionOnImageY * (maximumScale - this.flags.currentScale));

            if (offsetY > 0) {
                offsetY = 0;
            }

            this.updateImage(offsetX, offsetY, maximumScale);
        },

        /**
         * Will scale down to scale 1
         */
        this.zoomMinimum = function() {
            var x = 0,
                y = 0,
                minimumScale = 1;

            this.updateImage(x, y, minimumScale);
        },

        /**
         * Show the zoom image
         */
        this.showImage = function() {
            this.$dom.image.css('opacity', 1);
        },

        /**
         * Hide the zoom image
         */
        this.hideImage = function() {
            this.$dom.image.css('opacity', 0);
        },

        /**
         * Lazy load the image on demand.
         */
        this.loadImage = function() {
            if (this.flags.imageLoaded) {
                return;
            }

            this.$dom.image.attr('src', this.getUrlImage());
        },

        /**
         * Apply x, y, scale to the zoom image
         * @param  {Number} x     Translate to x
         * @param  {Number} y     Translate to y
         * @param  {scale}  scale The scale to apply
         */
        this.updateImage = function(x, y, scale) {
            scale = scale || this.flags.currentScale;

            // Let's be nice with the browser and give him
            // rounded values.
            x = Math.round(x);
            y = Math.round(y);

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(x, y) + ' ' + this.getCssRuleScale(scale)
            });

            // Keep track of transformations
            this.flags.imageTranslate.y = y;
            this.flags.imageTranslate.x = x;
            this.flags.currentScale = scale;
        }

        /**
         * Get the url of the zoom image to use.
         * @return {String} Url (relative or absolute)
         */
        this.getUrlImage = function() {
            var url = this.options.url;

            if (!_.isEmpty(url)) {
                return url;
            }

            // Let's find by the attribute
            return this.$dom.container.data('zoom-src');
        },

        /**
         * When the zoom image is scaling up, we need to know
         * the limit of scaling to keep the perfect quality ratio.
         * @return {Float} The scale up limit
         */
        this.getScaleLimitImage = function() {
            var image = this.getNaturalDimensionsImage(),
                scaleWidth,
                scaleHeight,
                limit;

            scaleWidth = image.width / this.$dom.container.width();
            scaleHeight = image.height / this.$dom.container.outerHeight();

            limit = _.min([scaleWidth, scaleHeight]);

            return _.round(limit, 2);
        },

        /**
         * When the zoom image is panning (up / down / left / right),
         * we need to know what are the limits for X and Y to avoid
         * to pan outside of the container.
         * @return {Object} The X / Y coordinates limits
         */
        this.getPanLimits = function() {
            var xLimit = (this.$dom.image.width() * this.flags.currentScale) - this.$dom.container.width(),
                yLimit = (this.$dom.image.height() * this.flags.currentScale) - this.$dom.container.outerHeight();

            return {
                x: -xLimit,
                y: -yLimit
            }
        },

        /**
         * Get the real width / height of the thumbnail
         * @return {Object} The width / height
         */
        this.getNaturalDimensionsThumbnail = function() {
            return {
                width: this.$dom.thumbnail.prop('naturalWidth'),
                height: this.$dom.thumbnail.prop('naturalHeight')
            }
        },

        /**
         * Get the real width / height of the zoom image
         * @return {Object} The width / height
         */
        this.getNaturalDimensionsImage = function() {
            return {
                width: this.$dom.image.prop('naturalWidth'),
                height: this.$dom.image.prop('naturalHeight')
            }
        },

        /**
         * Abstraction to clean up the code.
         * @param  {Mixed} x The X coordinates
         * @param  {Mixed} y The Y coordinates
         * @return {String} The css translate rule for the transform property
         */
        this.getCssRuleTranslate = function(x, y) {
            return 'translate(' + x + 'px,' + y + 'px)';
        },

        /**
         * Abstraction to clean up the code.
         * @param  {Mixed} scale The scale
         * @return {String} The css scale rule for the transform property
         */
        this.getCssRuleScale = function(scale) {
            return 'scale(' + scale + ')';
        },

        /**
         * Create an hammer instance for the
         * element given with the right recognizers:
         * Double Tap / Pinch / Pan
         * @param {HTMLelement} element - Initialize the events to this element
         *
         * @example
         * var element = document.getElementById('element');
         * this.getInstanceHammer(element);
         */
        this.getInstanceHammer = function(element) {
            var manager = new Hammer.Manager(element),
                doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2}),
                pinch = new Hammer.Pinch(),
                pan = new Hammer.Pan({threshold: 0});

            manager.add([doubleTap, pinch, pan]);

            this.flags.hammer = manager;

            return manager;
        },

        /**
         * Destroy the widget
         */
        this.onDestroy = function() {

            // Shutdown events
            this.$dom.image.off('load');
            this.flags.hammer.off('doubletap pan pinchstart pinch');
            this.$dom.container.off('zoom.destroy');
            this.$dom.container.off('click');

            // Remove added DOM
            this.$dom.image.remove();
        }
    }

    /**
     * Public jQuery API
     */

    $.fn.zoom = function(options) {

        var options = options || {};

        return this.each(function() {
            new Zoom().init(this, options);
        });
    };

    $.fn.zoom.defaults = {

        /**
         * Do you want to lazy load the zoom image?
         * We will load the zoom image when the user clicks
         * one time on the container.
         * @type {Boolean}
         */
        lazyLoad: true,

        /**
         * What is the increment scale you want to use
         * when scale up / down.
         * 
         * @example
         * 1 -> 1.05 -> 1.10 -> ..
         * 
         * @type {Number}
         */
        deltaScale: 0.05,

        /**
         * The url to use 
         * @type {[type]}
         */
        url: null
    };

}(window.jQuery));
});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map