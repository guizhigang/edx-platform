(function (requirejs, require, define) {

// VideoSpeedControl module.
define(
'video/08_video_speed_control.js',
[],
function () {
    "use strict";
    var VideoSpeedControl = function (state) {
        if (!(this instanceof VideoSpeedControl)) {
            return new VideoSpeedControl(state);
        }

        this.state = state;
        this.state.VideoSpeedControl = this;
        this.initialize();

        return $.Deferred().resolve().promise();
    };

    VideoSpeedControl.prototype = {
        initialize: function () {
            var state = this.state;

            this.el = state.el.find('div.speeds');
            /** @todo Fix class name */
            this.videoSpeedsEl = this.el.find('.video_speeds');

            if (!isPlaybackRatesSupported(state)) {
                console.log(
                    '[Video info]: playbackRate is not supported.'
                );
                this.el.remove();

                return false;
            }


            this.render();
            this.bindHandlers();

            return true;
        },
        // function _renderElements(state)
        //
        //     Create any necessary DOM elements, attach them, and set their
        //     initial configuration. Also make the created DOM elements available
        //     via the 'state' object. Much easier to work this way - you don't
        //     have to do repeated jQuery element selects.
        render: function () {
            var self = this,
                state = this.state;

            /** @todo Remove this dependency */
            state.videoControl.secondaryControlsEl.prepend(this.el);

            var speeds = $.map(state.speeds.reverse(), function (speed, index) {
                return [
                    '<li data-speed="', speed, '" role="presentation">',
                        /** @todo Fix class name */
                        '<a class="speed_link" href="#" role="menuitem">',
                            speed, 'x',
                        '</a>',
                    '</li>'
                ].join('');
            });

            this.videoSpeedsEl.append($(speeds));
            this.setSpeed(state.speed);
        },

        /**
         * @desc Check if playbackRate supports by browser.
         *     If browser supports, 1.0 should be returned by playbackRate
         *     property. In this case, function return True. Otherwise, False will
         *     be returned.
         *     iOS doesn't support speed change.
         *
         * @param {string} videoType Type of the video player
         *
         * @this {object} The global window object.
         *
         * @returns {Boolean}
         *       true: Browser support playbackRate functionality.
         *       false: Browser doesn't support playbackRate functionality.
         */
        isPlaybackRatesSupported: function (state) {
            var isHtml5 = state.videoType === 'html5',
                isTouch = state.isTouch,
                video = document.createElement('video');

            return !isTouch || (isHtml5 && !Boolean(video.playbackRate));
        },

        // Hide speed control.
        hideSpeedControl: function () {
            this.el.remove();
        },

        // Get previous element in array or cyles back to the last if it is the
        // first.
        getPreviousSpeedLink: function (speedLinks, index) {
            return $(speedLinks.eq(index < 1 ? speedLinks.length - 1 : index - 1));
        },

        // Get next element in array or cyles back to the first if it is the last.
        getNextSpeedLink: function (speedLinks, index) {
            return $(speedLinks.eq(index >= speedLinks.length - 1 ? 0 : index + 1));
        },

        isSpeedLinksFocused: function () {
            /** @todo Fix class name */
            var speedLinks = this.videoSpeedsEl.find('a.speed_link');

            return speedLinks.is(':focus');
        },

        openMenu: function () {
            // When speed entries have focus, the menu stays open on
            // mouseleave. A clickHandler is added to the window
            // element to have clicks close the menu when they happen
            // outside of it.
            $(window).on('click.speedMenu', this.clickHandler.bind(this));
            this.el.addClass('open');
        },

        closeMenu: function () {
            // Remove the previously added clickHandler from window element.
            $(window).off('click.speedMenu');
            this.el.removeClass('open');
        },

        // Various event handlers. They all return false to stop propagation and
        // prevent default behavior.
        clickHandler: function (event) {
            var target = $(event.currentTarget);

            this.el.removeClass('open');
            /** @todo Fix class name */
            if (target.is('a.speed_link')) {
                this.changeVideoSpeed.call(this, event);
            }

            return false;
        },

        // We do not use this.openMenu and this.closeMenu in the following two handlers
        // because we do not want to add an unnecessary clickHandler to the window
        // element.
        mouseEnterHandler: function (event) {
            /** @todo Use event.target */
            this.el.addClass('open');

            return false;
        },

        mouseLeaveHandler: function (event) {
            // Only close the menu is no speed entry has focus.
            if (!this.isSpeedLinksFocused()) {
                /** @todo Use event.target */
                this.el.removeClass('open');
            }
                    
            return false;
        },

        keyDownHandler: function (event) {
            var KEY = $.ui.keyCode,
                keyCode = event.keyCode,
                target = $(event.currentTarget),
                speedButtonLink = this.el.children('a'),
                /** @todo Fix class name */
                speedLinks = this.videoSpeedsEl.find('a.speed_link'),
                index;

            /** @todo Fix class name */
            if (target.is('a.speed_link')) {
                index = target.parent().index();

                switch (keyCode) {
                    // Scroll up menu, wrapping at the top. Keep menu open.
                    case KEY.UP:
                        this.getPreviousSpeedLink(speedLinks, index).focus();
                        break;
                    // Scroll down  menu, wrapping at the bottom. Keep menu
                    // open.
                    case KEY.DOWN:
                        this.getNextSpeedLink(speedLinks, index).focus();
                        break;
                    // Close menu.
                    case KEY.TAB:
                        this.closeMenu();
                        // Set focus to previous menu button in menu bar
                        // (Play/Pause button)
                        if (event.shiftKey) {
                            /** @todo Remove dependency */
                            this.videoControl.playPauseEl.focus();
                        }
                        // Set focus to next menu button in menu bar
                        // (Volume button)
                        else {
                            /** @todo Remove dependency */
                            this.videoVolumeControl.buttonEl.focus();
                        }
                        break;
                    // Close menu, give focus to speed control and change
                    // speed.
                    case KEY.ENTER:
                    case KEY.SPACE:
                        this.closeMenu();
                        speedButtonLink.focus();
                        this.changeVideoSpeed.call(this, event);
                        break;
                    // Close menu and give focus to speed control.
                    case KEY.ESCAPE:
                        this.closeMenu();
                        speedButtonLink.focus();
                        break;
                }
                return false;
            } else {
                switch(keyCode) {
                    // Open menu and focus on last element of list above it.
                    case KEY.ENTER:
                    case KEY.SPACE:
                    case KEY.UP:
                        this.openMenu();
                        speedLinks.last().focus();
                        break;
                    // Close menu.
                    case KEY.ESCAPE:
                        this.closeMenu();
                        break;
                }
                // We do not stop propagation and default behavior on a TAB
                // keypress.
                return event.keyCode === KEY.TAB;
            }
        },

        /**
         * @desc Bind any necessary function callbacks to DOM events (click,
         *     mousemove, etc.).
         *
         */
        bindHandlers: function () {
            // Attach various events handlers to the speed menu button.
            this.el.on({
                'mouseenter': this.mouseEnterHandler.bind(this),
                'mouseleave': this.mouseLeaveHandler.bind(this),
                'click': this.clickHandler.bind(this),
                'keydown': this.keyDownHandler.bind(this)
            });

            // Attach click and keydown event handlers to the individual speed
            // entries.
            this.videoSpeedsEl.on({
                click: this.clickHandler.bind(this),
                keydown: this.keyDownHandler.bind(this)
            /** @todo Fix class name */
            }, 'a.speed_link');
        },

        setSpeed: function (speed) {
            this.videoSpeedsEl
                .find('li')
                    /** @todo Fix class name */
                    .removeClass('active')
                .filter("li[data-speed='" + speed + "']")
                    /** @todo Fix class name */
                    .addClass('active');

            /** @todo Fix class name */
            this.el.find('p.active').html('' + speed + 'x');
        },

        changeVideoSpeed: function (event) {
            var parentEl = $(event.target).parent();

            /** @todo Fix class name */
            if (!parentEl.hasClass('active')) {
                this.currentSpeed = parentEl.data('speed');

                /** @todo Move conversion to setSpeed */
                this.setSpeed(
                    // To meet the API expected format.
                    parseFloat(this.currentSpeed)
                        .toFixed(2)
                        .replace(/\.00$/, '.0')
                );

                /** @todo Remove dependency */
                this.state.trigger(
                    'videoPlayer.onSpeedChange',
                    this.currentSpeed
                );
            }

            event.preventDefault();
        },

        reRender: function (params) {
            var self = this;

            this.videoSpeedsEl
                .empty()
                /** @todo Do we really need this REMOVE? */
                .find('li').removeClass('active');

            /** @todo Check it */
            this.state.speeds = params.newSpeeds;

            var speeds = $.map(state.speeds.reverse(), function (speed, index) {
                return [
                    '<li data-speed="', speed, '" role="presentation">',
                        /** @todo Fix class name */
                        '<a class="speed_link" href="#" role="menuitem">',
                            speed, 'x',
                        '</a>',
                    '</li>'
                ].join('');
            });

            this.videoSpeedsEl.append($(speeds));
            this.setSpeed(params.currentSpeed);

            // Re-attach all events with their appropriate callbacks to the
            // newly generated elements.

            /** @todo USe event delegation */
            this.bindHandlers();
        }
    };
});

}(RequireJS.requirejs, RequireJS.require, RequireJS.define));
