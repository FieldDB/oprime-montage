/* globals FieldDB */
/**
 * @module ui/sound-check.reel
 * @requires ui/Confirm
 */
var Confirm = require("ui/confirm.reel").Confirm,
    AudioVideoRecorder = require("fielddb/api/audio_video/AudioVideoRecorder").AudioVideoRecorder,
    Popup = require("matte/ui/popup/popup.reel").Popup;

var audioVideoRecorder = new AudioVideoRecorder();
/**
 * @class SoundCheck
 * @extends Confirm
 */
var SoundCheck = Confirm.specialize( /** @lends SoundCheck# */ {
    constructor: {
        value: function SoundCheck() {
            this.super();
        }
    },

    hasTemplate: {
        value: true
    }

}, {
    microphoneCheck: {
        value: function() {
            audioVideoRecorder.periphialsCheck(false);
        }
    },
    videoCheck: {
        value: function() {
            audioVideoRecorder.periphialsCheck(true);
        }
    },
    
    /**
        Description TODO
        @type {Function}
        @default null
    */
    popup: {
        set: function(value) {
            this._popup = value;
        },
        get: function() {
            return this._popup;
        }
    },

    show: {
        value: function(options, okCallback, cancelCallback) {
            var popup = this.application._soundCheckPopup,
                confirmDialog;

            if (!popup) {
                popup = new Popup();
                this.popup = popup;

                popup.type = "confirmDialog";
                popup.title = "Confirmation 2";
                popup.modal = true;
                this.application._soundCheckPopup = popup;

                confirmDialog = new SoundCheck();
                popup.content = confirmDialog;
            }

            confirmDialog = popup.content;
            var self = this.application._soundCheckPopup;

            if (this.application.contextualizer) {
                this.application.contextualizer.currentLocale = this.application.interfaceLocale.iso;
                this.okLabel = this.application.contextualizer.localize("locale_okay");
                this.cancelLabel = this.application.contextualizer.localize("locale_cancel");
            } else {
                console.log("Not localizing the confirmDialog buttons");
            }
            if (typeof(options) === "string") {
                confirmDialog.msg = options;
                confirmDialog.okLabel = this.okLabel;
                confirmDialog.cancelLabel = this.cancelLabel;
            } else {
                confirmDialog.iconSrc = options.iconSrc;
                confirmDialog.msg = options.message;
                confirmDialog.okLabel = options.okLabel || this.okLabel;
                confirmDialog.cancelLabel = options.cancelLabel || this.cancelLabel;
            }

            confirmDialog.okCallback = okCallback || null;
            confirmDialog.cancelCallback = cancelCallback || null;

            popup.show();
            if (options.microphoneOnly) {
                this.microphoneCheck();
            } else {
                this.videoCheck();
            }
        }
    }
});
exports.SoundCheck = SoundCheck;
