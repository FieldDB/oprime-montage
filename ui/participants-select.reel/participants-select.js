/**
 * @module ui/participants-select.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;
var Confidential = require("fielddb/api/confidentiality_encryption/Confidential").Confidential;
var Participant = require("fielddb/api/user/Participant").Participant;
var FieldDBObject = require("fielddb/api/FieldDBObject").FieldDBObject;

/**
 * @class ParticipantsSelect
 * @extends Component
 */
exports.ParticipantsSelect = Component.specialize( /** @lends ParticipantsSelect# */ {
	constructor: {
		value: function ParticipantsSelect() {}
	},

	addAnonymousParticipantAtTopOfList: {
		value: true
	},

	enterDocument: {
		value: function(firstTime) {
			this.super(firstTime);

			if (firstTime) {
				var self = this;
				var prepareParticipants = function(rawParticipants) {
					console.log("fetched participants", rawParticipants);

					if (rawParticipants && rawParticipants.unshift && self.addAnonymousParticipantAtTopOfList) {
						console.log("Adding an anonymous participant for if the user doesnt choose any children");
						var anonymousParticipant = {
							// debugMode: true,
							firstname: self.application.contextualizer.localize("locale_new"),
							lastname: FieldDBObject.getHumanReadableTimestamp()
						};
						anonymousParticipant.anonymousCode = anonymousParticipant.lastname + "_" + Date.now();

						if (!self.application.corpus.confidential || !self.application.corpus.confidential.secretkey) {
							console.log("self.application.corpus.confidential is not ready");
						} else {
							anonymousParticipant.confidential = self.application.corpus.confidential;
							anonymousParticipant.decryptedMode = true;
						}
						rawParticipants.unshift(anonymousParticipant);
					}

					self.content = rawParticipants.map(function(participant) {
						participant = new Participant(participant);
						if (!self.application.corpus.confidential || !self.application.corpus.confidential.secretkey) {
							console.log("self.application.corpus.confidential is not ready");
						} else {
							participant.confidential = self.application.corpus.confidential;
							participant.decryptedMode = true;
						}
						try {
							self.application.corpus.updateParticipantToCorpusFields(participant);
						} catch (e) {
							console.log(e);
						}
						return participant;
					});

					console.log("Participants ", self.content);
					self.application.experiment.participant = self.content[0];
				};
				if (this.application && this.application.corpus && this.application.corpus.dbname === "phophlo-demo_data") {
					console.warn("This is the demo database, not showing previous participants.");
					prepareParticipants([]);
				} else {
					if (this.application.corpus && this.application.corpus.fetchCollection) {
						this.application.corpus.fetchCollection("participants").then(prepareParticipants);
					} else {
						setTimeout(function() {
							window.location.reload()
						}, 1000);
						return;
					}
				}
				var rangeController = this.templateObjects.rangeController;
				//Observe the selection for changes

				// rangeController.content = this.content;
				if (this.content) {
					this.content.map(function(participant) {
						if (participant.selected) {
							self.templateObjects.select.value = participant;
							self.handleChange();
						}
					});
				}
			}
			this.element.addEventListener("change", this, false);
		}
	},

	handleChange: {
		value: function() {
			// console.log("handleChange", this.templateObjects.select.value);
			if (this._currentParticipant !== this.templateObjects.select.value) {
				this._currentParticipant = this.templateObjects.select.value;
				this.application.experiment.participant = this._currentParticipant;
				var changeParticipantEvent = document.createEvent("CustomEvent");
				changeParticipantEvent.initCustomEvent("changeCurrentParticipant", true, true, null);
				this.dispatchEvent(changeParticipantEvent);
			}
			console.log("ParticipantsSelect handleChange", this._currentParticipant);
		}
	},

	_currentParticipant: {
		value: null
	}
});
