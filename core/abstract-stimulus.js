/**
 * @module ui/stimulus.reel
 * @requires montage/ui/component
 */
var ContextualizableComponent = require("core/contextualizable-component").ContextualizableComponent,
	Confirm = require("ui/confirm.reel").Confirm,
	Response = require("ui/response.reel").Response,
	PressComposer = require("montage/composer/press-composer").PressComposer,
	RangeController = require("montage/core/range-controller").RangeController,
	Promise = require("montage/core/promise").Promise;

/**
 * @class Stimulus
 * @extends ContextualizableComponent
 */
exports.AbstractStimulus = ContextualizableComponent.specialize( /** @lends Stimulus# */ {
	constructor: {
		value: function Stimulus() {
			this.super();
		}
	},

	currentReinforcementImageSrc: {
		value: "../../assets/img/blank.png"
	},

	/**
	 *  dont draw automatically refs: http://montagejs.github.io/mfiddle/#!/7932746
	 * @type {Object}
	 */
	// willDraw: {
	//        value: function() {
	//			console.log("Stimulus does not draw automatically, instead it is drawn in steps by its child classes.");
	//        }
	//    },

	responsesController: {
		value: null
	},

	responses: {
		value: null
	},
	pauseAudioWhenConfirmingResponse: {
		value: null
	},
	addResponse: {
		value: function(responseEvent, chosenImage) {
			if (!responseEvent) {
				throw "Cannot add response without the x y information found in the touch/click responseEvent";
			}
			this.audioPlayStartTime = 0;
			if (this.application.audioPlayer.src && this.application.audioPlayer.src === this.model.audioFile) {
				this.audioPlayStartTime = this.application.audioPlayer.audioPlayStartTime;
			} else {
				this.audioPlayStartTime = 0;
			}
			var reactionTimeEnd = Date.now();
			var audioDuration = this.application.audioPlayer.getDuration(this.model.audioFile) || 0;
			if (audioDuration) {
				audioDuration = audioDuration * 1000;
			} else {
				console.log("The audio has no duration.. This is strange.");
			}
			if (this.pauseAudioWhenConfirmingResponse) {
				this.pauseAudio();
			}

			var self = this;
			var continueToNextStimulus = Promise.defer();
			if (this.confirmResponseChoiceMessage) {
				this.contextualizer.currentLocale = this.application.interfaceLocale;
				var confirmChoicePrompt = this.contextualizer.localize(this.confirmResponseChoiceMessage, this.application.experiment.experimentalDesign.stimuliDialect);
				var options = {
					iconSrc: self.ownerComponent.iconSrc,
					message: confirmChoicePrompt
				};
				Confirm.show(options, function() {
					continueToNextStimulus.resolve();
				}, function() {
					continueToNextStimulus.reject(new Error("The x prevented the cancel?"));
				});
			} else {
				continueToNextStimulus.resolve();
			}
			continueToNextStimulus.promise.then(function() {
				// self.ownerComponent.templateObjects.reinforcement.next();
				self.stopAudio();
				self.ownerComponent.nextStimulus();
			}, function(reason) {
				console.log("Not continuing to next stimulus");
				if (this.pauseAudioWhenConfirmingResponse) {
					self.playAudio();
				}
			});
			var choice = {};
			if (chosenImage) {
				console.info("===== = For " + this.model.target.utterance + " the user clicked on " + chosenImage + " the target image was " + this.model.target.visualChoice);
				if (this.model.target.visualChoice === chosenImage) {
					choice = this.model.target;
				} else {
					this.model.distractors.map(function(distractor) {
						if (distractor.visualChoice === chosenImage) {
							choice = distractor;
						}
					});
				}
			}
			var response = {
				"reactionTimeAudioOffset": reactionTimeEnd - this.audioPlayStartTime - audioDuration,
				"reactionTimeAudioOnset": reactionTimeEnd - this.audioPlayStartTime,
				"reactionTimeVisualOffset": reactionTimeEnd - this.reactionTimeStart,
				"reactionTimeVisualOnset": reactionTimeEnd - this.reactionTimeStart,
				"x": responseEvent.x,
				"y": responseEvent.y,
				"pageX": responseEvent.pageX,
				"pageY": responseEvent.pageY,
				// "prime": {
				// 	utterance: this.model.prime.utterance,
				// 	orthography: this.model.prime.orthography,
				// 	imageFile: this.model.prime.imageFile
				// },
				"choice": choice,
				// "target": this.model.target,
				"score": this.scoreResponse(this.model.target, choice)
			};
			this.model.responses.push(response);
			console.log("Recorded response", JSON.stringify(response));
		}
	},

	addOralResponse: {
		value: function(choice, dontAutoAdvance) {
			var reactionTimeEnd = Date.now();
			var audioDuration = this.application.audioPlayer.getDuration(this.model.audioFile) || 0;
			if (audioDuration) {
				audioDuration = audioDuration * 1000;
			} else {
				console.log("The audio has no duration.. This is strange.");
			}
			if (this.pauseAudioWhenConfirmingResponse) {
				this.pauseAudio();
			}

			var self = this;
			var continueToNextStimulus = Promise.defer();
			if (this.confirmResponseChoiceMessage) {
				this.contextualizer.currentLocale = this.application.interfaceLocale;
				var confirmChoicePrompt = this.contextualizer.localize(this.confirmResponseChoiceMessage);
				var options = {
					iconSrc: self.ownerComponent.iconSrc,
					message: confirmChoicePrompt
				};
				Confirm.show(options, function() {
					continueToNextStimulus.resolve();
				}, function() {
					continueToNextStimulus.reject(new Error("The x prevented the cancel?"));
				});
			} else {
				if (!dontAutoAdvance) {
					continueToNextStimulus.resolve();
				}
			}
			continueToNextStimulus.promise.then(function() {
				// self.ownerComponent.templateObjects.reinforcement.next();
				self.stopAudio();
				self.ownerComponent.nextStimulus();
			}, function(reason) {
				console.log("Not continuing to next stimulus");
				if (this.pauseAudioWhenConfirmingResponse) {
					self.playAudio();
				}
			});

			var response = {
				"reactionTimeAudioOffset": reactionTimeEnd - this.reactionTimeStart - audioDuration,
				"reactionTimeAudioOnset": reactionTimeEnd - this.reactionTimeStart,
				"x": 0,
				"y": 0,
				"pageX": 0,
				"pageY": 0,
				"choice": choice,
				"score": choice.score
			};
			this.model.responses = this.model.responses || [];
			this.model.responses.push(response);
			console.log("Recorded response", JSON.stringify(response));
		}
	},

	scoreResponse: {
		value: function(expectedResponse, actualResponse) {
			if (!actualResponse.utterance) {
				return "error";
			}
			if (actualResponse.utterance === expectedResponse.utterance) {
				return 1;
			} else {
				return 0;
			}
		}
	},

	addNonResponse: {
		value: function(responseEvent) {
			if (!responseEvent) {
				throw "Cannot add response without the x y information found in the touch/click responseEvent";
			}
			var reactionTimeEnd = Date.now();
			var response = {
				"reactionTimeAudioOffset": reactionTimeEnd - this.reactionTimeStart,
				"reactionTimeAudioOnset": reactionTimeEnd - this.reactionTimeStart,
				"x": responseEvent.x,
				"y": responseEvent.y,
				"pageX": responseEvent.pageX,
				"pageY": responseEvent.pageY,
				"chosenVisualStimulus": "none",
				"responseScore": -1
			};
			this.model.responses = this.model.responses || [];
			this.model.nonResponses.push(response);
			console.log("Recorded non-response, the user is confused or not playing the game.", JSON.stringify(response));
		}
	},

	/*
	 * Machinery for Recording stimuli responses.
	 *
	 * Inspired by the digit video reel:
	 * https://github.com/montagejs/digit/tree/master/ui/video.reel
	 */
	enterDocument: {
		value: function(firstTime) {
			this.super();

			if (firstTime) {
				this.setupFirstPlay();
				this.addOwnPropertyChangeListener("src", this);
			}
		}
	},

	handlePress: {
		value: function(touchEvent) {
			// console.log("event " + JSON.stringify(touchEvent.event));
			// console.log("targetElement " + JSON.stringify(touchEvent.targetElement));
			console.log("The stimulus has been pressed: ");
			if (touchEvent && touchEvent.targetElement && touchEvent.targetElement.dataset && touchEvent.targetElement.dataset.montageId && touchEvent.targetElement.classList.contains("Stimulus-record-touch-response")) {
				this.addResponse(touchEvent.event, touchEvent.targetElement.dataset.montageId);
			} else {
				this.addNonResponse(touchEvent.event);
			}
		}
	},

	handleAction: {
		value: function(touchEvent) {
			console.log("The stimulus has been actioned: ");
			this.handlePress(touchEvent);
		}
	},

	handleTouchup: {
		value: function(touchEvent) {
			console.log("The stimulus has been touchuped: ");
			this.handlePress(touchEvent);
		}
	},

	handlePressStart: {
		value: function(touchEvent) {
			console.log("The stimulus has been pressStarted: ");
		}
	},

	handleLongAction: {
		value: function(touchEvent) {
			console.log("The stimulus has been longActioned: ");
		}
	},

	handleLongPress: {
		value: function(touchEvent) {
			console.log("The stimulus has been handleLongPress: ");
			this.handlePress(touchEvent);
		}
	},

	prepareForActivationEvents: {
		value: function() {
			// this._pressComposer.addEventListener("pressStart", this, false);
			this._pressComposer.addEventListener("press", this, false);
			this._pressComposer.addEventListener("touchup", this, false);
			this._pressComposer.addEventListener("action", this, false);
			this._pressComposer.addEventListener("longAction", this, false);
			this._pressComposer.addEventListener("longPress", this, false);
			// this._pressComposer.addEventListener("pressCancel", this, false);
		}
	},

	setupFirstPlay: {
		value: function() {
			// this.element.removeEventListener("touchstart", this, false);
			// this.element.removeEventListener("mousedown", this, false);

			this._pressComposer = PressComposer.create();
			this._pressComposer.identifier = "stimulus";
			this.addComposerForElement(this._pressComposer, this.element);
		}
	},

	/**
	 *  TODO try using a media controller later montage/ui/controller/media-controller
	 * @type {Object}
	 */
	playAudio: {
		value: function(delay) {
			this.application.audioPlayer.play(this.model.audioFile, delay);
		}
	},

	pauseAudio: {
		value: function() {
			this.application.audioPlayer.pause(this.model.audioFile);
		}
	},

	stopAudio: {
		value: function() {
			this.application.audioPlayer.stop(this.model.audioFile);
		}
	},

	load: {
		value: function(model) {
			this.model = model || {};

			if (!this.model.responses) {
				this.model.responses = [];
			}
			if (!this.model.nonResponses) {
				this.model.nonResponses = [];
			}

			this.itemNumberInExperiment = model.itemNumberInExperiment;
			this.subexperimentLabel = model.subexperimentLabel;

			this.responsesController = new RangeController().initWithContent(this.model.responses);
			this.experimenterId = this.application.experiment.experimenter.id;
			this.participantId = this.application.experiment.participant.id;
			// Not playing audio by default, child must call it.
			// this.playAudio(2000);
			this.reactionTimeStart = Date.now();

		}
	}
});
