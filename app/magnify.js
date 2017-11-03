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