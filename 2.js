/**
 * @author Jeremie Ges <jges@weblinc.com>
 */

/**
 * Todos:
 * - Pan diagonal
 * - Lazy load picture option
 * - Transition option (maybe possible to change PAN / scale)
 * - Destroy Method
 */
(function($) {
    function Zoom() {

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
             * Check if we already tried to load
             * the zoom image
             * @type {Boolean}
             */
            imageIntentLoading: false,

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
             * [pinchCoordinates description]
             * @type {Object}
             */
            pinchCoordinates: {
                x: 0,
                y: 0
            },
            pinchScale: 0
        },

        this.options = {},

        this.init = function(container, options) {
            this.$dom.container = $(container);
            this.options = _.extend($.fn.zoom.defaults, options);
            this.setup();
            this.events();
        },

        this.setup = function() {
            this.setupImage();
            this.setupThumbnail();
        },

        this.setupImage = function() {
            this.$dom.image = $('<img/>');
        },

        this.setupThumbnail = function() {
            this.$dom.thumbnail = this.$dom.container.find('img').first();
        },

        this.events = function() {
            this.$dom.image.on('load', this.onLoadImage.bind(this));

            this.getInstanceHammer(this.$dom.container.get(0))
                .on('doubletap', this.onDoubleTapContainer.bind(this))
                .on('pan',  this.onPanContainer.bind(this))
                //.on('panright', this.onPanRightContainer.bind(this))
                //.on('panleft', this.onPanLeftContainer.bind(this))
                //.on('pandown', this.onPanDownContainer.bind(this))
                //s.on('panup', this.onPanUpContainer.bind(this))
                .on('pinchstart', this.onPinchStartContainer.bind(this))
                .on('pinch', this.onPinchContainer.bind(this));
        },

        this.onLoadImage = function() {
            // Insert zoom image in page
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
                    transition: 'all ' + this.options.transition
                })
                .attr('role', 'presentation')
                .appendTo(this.$dom.container);

            this.$dom.container.css('overflow', 'hidden');
            this.flags.imageLoaded = true;

            this.getScaleLimitImage();
        },

        /**
         * When the user start to pan the container
         */
        this.onPanContainer = function(e) {
            this.$dom.image.css({
                transition: 'all 0s'
            });

            e.preventDefault();
            this.loadImage();
        },

        /**
         * When the user starts to pinch the container
         * we want to keep track of the point clicked
         * (coordinates) to scale up / down gracefully.
         * @param  {Event} e The pinch event
         */
        this.onPinchStartContainer = function(e) {
            this.$dom.image.css({
                transition: 'all 1s'
            });

            e.preventDefault();
            this.loadImage();
            this.flags.pinchCoordinates = e.center;
        },

        /**
         * Guess if we have to scale up / down
         * the zoom image on pinch
         * @param  {Event} e The pinch event
         */
        this.onPinchContainer = function(e) {
            var scale;

            e.preventDefault();

            scale = e.scale;

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

            if (scale <= 1) {
                return;
            }

            scale = scale - this.options.deltas.scale;

            mousePositionOnImageX = this.flags.pinchCoordinates.x - containerOffset.left;
            mousePositionOnImageY = this.flags.pinchCoordinates.y - containerOffset.top;

            offsetX = mousePositionOnImageX * this.options.deltas.scale;
            offsetY = mousePositionOnImageY * this.options.deltas.scale;

            x = this.flags.imageTranslate.x < 0 ? this.flags.imageTranslate.x : 0;
            y = this.flags.imageTranslate.y < 0 ? this.flags.imageTranslate.y : 0;

            offsetX = offsetX + x;
            offsetY = offsetY + y;

            if (scale <= 1) {
                scale = 1;
                offsetX = 0;
                offsetY = 0;
            }

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(offsetX, offsetY) + ' ' + this.getCssRuleScale(scale)
            });

            // Keep track of things
            this.flags.imageTranslate.x = offsetX;
            this.flags.imageTranslate.y = offsetY;
            this.flags.currentScale = scale;

        },

        /**
         * Scale up the zoom image around the point
         * clicked by the user at the start of the pinch
         */
        this.onScaleUp = function() {
            var scale = this.flags.currentScale + this.options.deltas.scale,
                containerOffset = this.$dom.container.offset(),
                offsetX,
                offsetY,
                mousePositionOnImageX,
                mousePositionOnImageY,
                transform;

            if (scale > this.getScaleLimitImage()) {
                return;
            }

            mousePositionOnImageX = (this.flags.pinchCoordinates.x - containerOffset.left);
            mousePositionOnImageY = (this.flags.pinchCoordinates.y - containerOffset.top);

            offsetX = -(mousePositionOnImageX * this.options.deltas.scale);
            offsetY = -(mousePositionOnImageY * this.options.deltas.scale);

            offsetX = offsetX < 0 ? offsetX + this.flags.imageTranslate.x : 0;
            offsetY = offsetY < 0 ? offsetY + this.flags.imageTranslate.y : 0;

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(offsetX, offsetY) + ' ' + this.getCssRuleScale(scale)
            });

            this.flags.imageTranslate.x = offsetX;
            this.flags.imageTranslate.y = offsetY;
            this.flags.currentScale = scale;
        },

        /**
         * When the user double tap on the container,
         * depending the current scale we zoom the image
         * to its maximum or minimum
         */
        this.onDoubleTapContainer = function(e) {
            var coordinates = e.center;

            e.preventDefault();

            this.loadImage();

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
         * When the user pan up, move
         * the picture on the bottom
         */
        this.onPanUpContainer = function(e) {

            var x = this.flags.imageTranslate.x,
                y = this.flags.imageTranslate.y,
                newY = y - this.options.deltas.pan;
                newX = x;

            /*
            delta = 100%
            e.angle 

            if (this.getDirection(e) === 'right') {
                newX = x - (this.options.deltas.pan / 4);
            }

            if (this.getDirection(e) === 'left') {
                newX = x + (this.options.deltas.pan / 4);
            }
            */
            if (newY < this.getPanLimits().y) {
                return;
            }

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(newX, newY) + ' ' + this.getCssRuleScale(this.flags.currentScale)
            });

            this.flags.imageTranslate.y = newY;
            this.flags.imageTranslate.x = newX;
        },

        /**
         * When the user pan down, move
         * the picture on the top
         */
        this.onPanDownContainer = function() {
            var x = this.flags.imageTranslate.x,
                y = this.flags.imageTranslate.y;
                newY = y + this.options.deltas.pan;

            if (newY > 0) {
                return;
            }

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(x, newY) + ' ' + this.getCssRuleScale(this.flags.currentScale)
            });

            this.flags.imageTranslate.y = newY;
        },

        /**
         * When the user pan right, move
         * the picture on the left
         */
        this.onPanRightContainer = function() {
            var y = this.flags.imageTranslate.y,
                x = this.flags.imageTranslate.x,
                newX = x + this.options.deltas.pan;

            if (newX > 0) {
                return;
            }

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(newX, y) + ' ' + this.getCssRuleScale(this.flags.currentScale)
            });

            this.flags.imageTranslate.x = newX;
        },

        /**
         * When the user pan left, move
         * the picture on the right
         */
        this.onPanLeftContainer =  function() {
            var y = this.flags.imageTranslate.y,
                x = this.flags.imageTranslate.x,
                newX = x - this.options.deltas.pan;

            if (newX < this.getPanLimits().x) {
                return;
            }

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(newX, y) + ' ' + this.getCssRuleScale(this.flags.currentScale)
            });

            this.flags.imageTranslate.x = newX;
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

            this.$dom.image.css({
                transform: this.getCssRuleTranslate(offsetX, offsetY) + ' ' + this.getCssRuleScale(maximumScale)
            });

            this.flags.imageTranslate.x = offsetX;
            this.flags.imageTranslate.y = offsetY;
            this.flags.currentScale = maximumScale;
        },

        /**
         * Will scale down to scale 1
         */
        this.zoomMinimum = function() {
            var minimumScale = 1;

            this.$dom.image.css({
                top: 0,
                left: 0,
                transform: this.getCssRuleTranslate(0, 0) + ' ' + this.getCssRuleScale(minimumScale)
            });

            this.flags.imageTranslate.x = 0;
            this.flags.imageTranslate.y = 0;
            this.flags.currentScale = minimumScale;
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

            if (this.flags.imageIntentLoading) {
                return;
            }

            this.$dom.image.attr('src', this.getUrlImage());
            this.flags.imageIntentLoading = true;
        },

        this.getDirection = function(e) {

            if (e.angle === -90) { 
                return 'straight';
            }

            if (e.angle < -90) {
                return 'right';
            } 
            
            return 'left';
        },

        /**
         * Get the url of the zoom image to use.
         * @return {String} Url (relative or absolute)
         */
        this.getUrlImage = function() {
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
         * @return {Object} The X / Y limits
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
                height: this.$dom.thumbnail.prop('natureHeight')
            }
        },

        /**
         * Get the real width / height of the zoom image
         * @return {Object} The widht / height
         */
        this.getNaturalDimensionsImage = function() {
            return {
                width: this.$dom.image.prop('naturalWidth'),
                height: this.$dom.image.prop('naturalHeight')
            }
        },

        this.getCssRuleTranslate = function(x, y) {
            return 'translate(' + x + 'px,' + y + 'px)';
        },

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
                pan = new Hammer.Pan({threshold: 0, direction: Hammer.DIRECTION_ALL});

            manager.add([doubleTap, pinch, pan]);

            return manager;
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
        transition: '1s',
        lazyLoad: true,
        deltas: {
            pan: 20,
            scale: 0.05
        }
    };

}(window.jQuery));