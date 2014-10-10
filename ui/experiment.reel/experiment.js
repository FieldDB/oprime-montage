/* globals setTimeout */

/**
 * @module ui/experiment.reel
 * @requires core/contextualizable-component
 */
var ContextualizableComponent = require("core/contextualizable-component").ContextualizableComponent,
    Confirm = require("ui/confirm.reel").Confirm,
    SoundCheck = require("ui/sound-check.reel").SoundCheck,
    RangeController = require("montage/core/range-controller").RangeController,
    PromiseController = require("montage/core/promise-controller").PromiseController,
    Promise = require("montage/core/promise").Promise,
    AudioPlayer = require("fielddb/api/audio_video/AudioPlayer").AudioPlayer,

    Corpus = require("fielddb/api/corpus/Corpus").Corpus,
    SubExperiment = require("fielddb/api/data_list/SubExperimentDataList").SubExperimentDataList,
    Participant = require("fielddb/api/user/Participant").Participant,
    UserMask = require("fielddb/api/user/UserMask").UserMask,
    FieldDB = require("fielddb/api/fielddb").FieldDB;

/**
 * @class Experiment
 * @extends ContextualizableComponent
 */
exports.Experiment = ContextualizableComponent.specialize( /** @lends Experiment# */ {

    _currentStimulus: {
        value: null
    },

    _currentTestBlock: {
        value: null
    },

    _currentStimulusIndex: {
        value: null
    },

    _currentTestBlockIndex: {
        value: null
    },

    constructor: {
        value: function Experiment() {
            this.super();
            this.application.experiment = this;

            // if (!this.application.participants) {
            //     this.application.participants = [new Participant({
            //         anonymousCode: Date.now()
            //     })];
            // }
            this.application.audioPlayer = new AudioPlayer();

            // this.application.videoRecordingVerified = true;
            // console.warn("============== turning off sound check =================="); // For debugging, dont force user to verify their mic and video
            // console.warn("============== turning off sound check =================="); // For debugging, dont force user to verify their mic and video
            // console.warn("============== turning off sound check =================="); // For debugging, dont force user to verify their mic and video
            // console.warn("============== turning off sound check =================="); // For debugging, dont force user to verify their mic and video
            // console.warn("============== turning off sound check =================="); // For debugging, dont force user to verify their mic and video
            // console.warn("============== turning off sound check =================="); // For debugging, dont force user to verify their mic and video
        }
    },

    experimenters: {
        get: function() {
            if (this.application.experimenters) {
                return this.application.experimenters;
            }
        }
    },

    experimenter: {
        configurable: true,
        get: function() {
            if (this.application.experimenters && this.application.experimenters.length > 0) {
                return this.application.experimenters[0];
            } else {
                if (this.application.corpus && this.application.corpus.resumeAuthenticationSession) {
                    var self = this;
                    this.application.corpus.resumeAuthenticationSession().then(function(sessionInfo) {
                        console.log("guessing user from authentication session", sessionInfo);
                        self.application.experimenters = [new UserMask({
                            id: sessionInfo.userCtx.name
                        })];
                    }, function() {

                    });
                }
            }
            return {};
        }
    },

    participants: {
        get: function() {
            if (this.application.participants) {
                return this.application.participants;
            }
        }
    },

    participant: {
        get: function() {
            if (this.application.participants && this.application.participants.length > 0) {
                return this.application.participants[0];
            }
            return {};
        },
        set: function(value) {
            if (value === this.participant) {
                return;
            }
            // this.participants.unshift(value);
            value.url = FieldDB.Database.prototype.BASE_DB_URL + "/" + FieldDB.FieldDBObject.application.corpus.dbname;
            this.application.participants = [value];

            this.application.participantLanguageOne = this.application.participantLanguageOne || {};
            this.application.participantLanguageTwo = this.application.participantLanguageTwo || {};
            this.application.participantLanguageThree = this.application.participantLanguageThree || {};

            if (this.participant.languageOne && this.participant.languageOne.language) {
                this.application.participantLanguageOne.iso = this.participant.languageOne.language.iso;
                this.application.participantLanguageOne.name = this.participant.languageOne.language.name;
                this.application.participantLanguageOne.nativeName = this.participant.languageOne.language.nativeName;
            } else {
                this.application.participantLanguageOne.iso = "Non applicable";
                this.application.participantLanguageOne.name = "NA";
                this.application.participantLanguageOne.nativeName = "Non applicable";
            }

            if (this.participant.languageTwo && this.participant.languageTwo.language) {
                this.application.participantLanguageTwo.iso = this.participant.languageTwo.language.iso;
                this.application.participantLanguageTwo.name = this.participant.languageTwo.language.name;
                this.application.participantLanguageTwo.nativeName = this.participant.languageTwo.language.nativeName;
            } else {
                this.application.participantLanguageTwo.iso = "Non applicable";
                this.application.participantLanguageTwo.name = "NA";
                this.application.participantLanguageTwo.nativeName = "Non applicable";
            }

            if (this.participant.languageThree && this.participant.languageThree.language) {
                this.application.participantLanguageThree.iso = this.participant.languageThree.language.iso;
                this.application.participantLanguageThree.name = this.participant.languageThree.language.name;
                this.application.participantLanguageThree.nativeName = this.participant.languageThree.language.nativeName;
            } else {
                this.application.participantLanguageThree.iso = "Non applicable";
                this.application.participantLanguageThree.name = "NA";
                this.application.participantLanguageThree.nativeName = "Non applicable";
            }
            // var changeDialectEvent = document.createEvent("CustomEvent");
            // changeDialectEvent.initCustomEvent("changeparticipantLanguageOne", true, true, null);
            // this.dispatchEvent(changeDialectEvent);

            // var changeDialectEvent = document.createEvent("CustomEvent");
            // changeDialectEvent.initCustomEvent("changeparticipantLanguageTwo", true, true, null);
            // this.dispatchEvent(changeDialectEvent);

            // var changeDialectEvent = document.createEvent("CustomEvent");
            // changeDialectEvent.initCustomEvent("changeparticipantLanguageThree", true, true, null);
            // this.dispatchEvent(changeDialectEvent);

            // this.application.participantLanguageTwo = {};
            // this.application.participantLanguageThree = {};
        }
    },

    iconSrc: {
        value: "../../assets/img/blank.png"
    },

    loadDesign: {
        value: function(optionalExperimentalDesignObject) {
            if (!this.experimentalDesignSrc) {
                throw "Experimential design source file is undefined, not loading the experiment";
            }

            if (!this.application.corpus) {
                var resultDBname = this.dbname || window.location.hash.replace("#/", "").replace(/\//g, "-");
                if (!resultDBname || resultDBname === this.stimuliDBname) {
                    resultDBname = "phophlo-demo_data";
                    var redirectUrl = window.location.href.replace(/index\.html.*$/, "") + "index.html#/phophlo/demo_data";
                    window.location.replace(redirectUrl);
                    setTimeout(function() {
                        window.location.reload();
                    }, 1000);
                    return;
                }
                this.application.corpus = new Corpus({});
                if (this.dbUrl) {
                    this.application.corpus.url = this.dbUrl;
                }
                // this.application.corpus.debugMode = true;
                this.application.corpus.loadOrCreateCorpusByPouchName(resultDBname).then(function(result) {
                    console.log("Corpus is loaded, data can be decrypted.", result);
                    if (!self.application.corpus.participantFields) {
                        self.application.corpus.participantFields = Participant.prototype.defaults.fields;
                    }
                    if (!self.application.corpus.participantFields.school) {
                        self.application.corpus.participantFields.add({
                            "id": "school",
                            "labelFieldLinguists": "School",
                            "labelNonLinguists": "",
                            "labelTranslators": "",
                            "labelExperimenters": "École",
                            "shouldBeEncrypted": true,
                            "encrypted": true,
                            "showToUserTypes": "all",
                            "defaultfield": true,
                            "help": "The school/institution where the student is affiliated (optional, encrypted if speaker is anonymous)",
                            "helpLinguists": "The school/institution where the student is affiliated (optional, encrypted if speaker is anonymous)"
                        });
                    }
                    if (!self.application.corpus.participantFields.schoolboard) {
                        self.application.corpus.participantFields.add({
                            "id": "schoolBoard",
                            "labelFieldLinguists": "School Board",
                            "labelNonLinguists": "",
                            "labelTranslators": "",
                            "labelExperimenters": "Commission scolaire",
                            "shouldBeEncrypted": true,
                            "encrypted": true,
                            "showToUserTypes": "all",
                            "defaultfield": true,
                            "help": "The school board/commission scolaire where the student goes to school (optional, encrypted if speaker is anonymous.)",
                            "helpLinguists": "The school board/commission scolaire where the student goes to school. Can be used to group student results/dialects. (optional, encrypted if speaker is anonymous.)"
                        });
                    }
                    if (!self.application.corpus.participantFields.notes) {
                        self.application.corpus.participantFields.add({
                            "id": "notes",
                            "labelFieldLinguists": "Notes",
                            "labelNonLinguists": "",
                            "labelTranslators": "",
                            "labelExperimenters": "Notes",
                            "shouldBeEncrypted": true,
                            "encrypted": true,
                            "showToUserTypes": "all",
                            "defaultfield": true,
                            "help": "Optional notes for the participant's file, encrypted if speaker is anonymous.",
                            "helpLinguists": "Optional notes for the participant's file, encrypted if speaker is anonymous."
                        });
                    }
                    if (!self.application.corpus.participantFields.enteredbyuser) {
                        self.application.corpus.participantFields.add({
                            "id": "enteredByUser",
                            "labelFieldLinguists": "Imported/Entered By",
                            "labelNonLinguists": "Entered By",
                            "labelTranslators": "Imported/Entered By",
                            "labelExperimenters": "Rempli par",
                            "type": "users",
                            "shouldBeEncrypted": "",
                            "showToUserTypes": "all",
                            "readonly": true,
                            "defaultfield": true,
                            "json": {
                                "user": {},
                                "hardware": {},
                                "software": {}
                            },
                            "help": "The user who originally entered the participant",
                            "helpLinguists": "The user who originally entered the participant"
                        });
                    }
                    if (!self.application.corpus.participantFields.modifiedbyuser) {
                        self.application.corpus.participantFields.add({
                            "id": "modifiedByUser",
                            "labelFieldLinguists": "Modified By",
                            "labelNonLinguists": "Modified By",
                            "labelTranslators": "Modified By",
                            "labelExperimenters": "Modifié par",
                            "type": "users",
                            "shouldBeEncrypted": "",
                            "showToUserTypes": "all",
                            "readonly": true,
                            "defaultfield": true,
                            "json": {
                                "users": []
                            },
                            "help": "An array of users who modified the participant",
                            "helpLinguists": "An array of users who modified the participant, this can optionally introduce a 'CheckedByUsername' into the participant's validation status if your team chooses."
                        });
                    }
                }, function(result) {
                    console.log("Corpus cannot be loaded, data cannot be decrypted, removing this db from the url.", result);
                    window.location.replace(window.location.href.replace(/#.*$/, "#/phophlo/demo_data"));
                    setTimeout(function() {
                        window.location.reload();
                    }, 1000);
                    return;
                });
            }
            this.corpus = this.application.corpus;

            this.application.stimuliCorpus = this.application.stimuliCorpus || new Corpus({
                dbname: this.stimuliDBname
            });
            this.stimuliCorpus = this.application.stimuliCorpus;
            var self = this;
            if (this.dbUrl) {
                this.application.corpus.url = this.dbUrl;
                this.application.stimuliCorpus.url = this.dbUrl;
            }

            if (optionalExperimentalDesignObject) {
                var originalDesign = new SubExperiment(optionalExperimentalDesignObject);
                this.experimentalDesign = new SubExperiment(originalDesign.clone());

                this.application.stimuliCorpus.fetchCollection(this.experimentalDesign.subexperiments).then(function(results) {
                    console.log(" downloaded sub experiments ", results);
                    self.experimentalDesign.populate(results);
                });
                if (this.experimentalDesign.stimuliDialect) {
                    this.contextualizer.currentLocale = this.experimentalDesign.stimuliDialect;
                } else {
                    console.warn("Experimental design is missing the locale of the data. this means that the user interface will not match the data.");
                }
                if (this.experimentalDesign.interfaceDialect) {
                    this.application.interfaceLocale = this.experimentalDesign.interfaceDialect;
                    this.contextualizer.currentLocale = this.experimentalDesign.interfaceDialect;
                } else {
                    console.warn("Experimental design is missing the locale of the data. this means that the user interface will not match the data.");
                }
                this.stimuliCorpus.getCorpusSpecificLocalizations();

                var experimenter = this.experimenter;
                console.log("priming existance of an experimenter from session tokens");

                // this.iconSrc = "blank.png";
                this.iconSrc = this.experimentalDesign.iconSrc;
                this.needsDraw = true;
                console.log("iconSrc" + this.iconSrc);
                if (this.experimentalDesign.congratulationsImageSrc.indexOf("://") === -1) {
                    this.experimentalDesign.congratulationsImageSrc = this.experimentalDesign.imageAssetsPath + "/" + this.experimentalDesign.congratulationsImageSrc;
                }
                this.gamify = true;
                this.tutorialMode = false;
                this.currentlyPlaying = false;
                this.resultsReportMode = false;
                this.experimentalDesign.experimentConclusion = this.experimentalDesign.experimentConclusion || this.contextualizer.localize("locale_incomplete");

                /* This makes essentially a slideshow of images, useful for debugging and reviewing */
                this.autoPlaySlideshowOfStimuli = false;
                // this.application.audioPlayer.play("assets/gammatone.wav");
            } else {
                this.stimuliCorpus.get(this.experimentalDesignSrc).then(function(doc) {
                    if (doc) {
                        console.log("Looping with request to load experimental design");
                        self.loadDesign.apply(self, [doc]);
                    } else {
                        throw "Experimential design doc file contained errors, not loading the experiment";
                    }
                }, function(error) {
                    console.warn("Could not load the design doc. ", error);
                    //try logging in as an anonymoussailsuser
                    self.application.stimuliCorpus.login({
                        username: "anonymoussailsuser",
                        password: "none"
                    }).then(function(loginresult) {
                        console.warn("logged in as anonymoussailsuser", loginresult);
                        window.location.replace(window.location.href.replace(/#.*$/, "#/phophlo/demo_data"));
                        setTimeout(function() {
                            window.location.reload();
                        }, 1000);
                        return;
                    }, function(err) {
                        console.log("Could not login either.", err);
                        // throw "Experimential design doc file could not be loaded from the server, not loading the experiment";
                    });
                });
            }



        }
    },

    draw: {
        value: function() {
            this.super();
            var self = this;
            window.setTimeout(function() {
                /* hack to make the tutorial mode seem like its working */
                if (!self.currentlyPlaying && !self.experimentIsComplete && !self.soundCheckHasBeenOpened) {
                    self.confirm(self.application.contextualizer.localize("locale_prompt_show_tutorial")).then(function() {
                        console.log("Showing tutorial mode");
                        self.toggleTutorialArea();
                    }, function(reason) {
                        console.log("Not showing tutorial");
                    });
                }
            }, 30000);
        }
    },
    /**
     *  Shows a dialog box with the message, returns a promise which will resolve
     *  if the user gives a positive repsonse, and reject if the user gives a negative response
     *
     *
     * @param {String} confirmChoicePrompt A message to be shown to the user
     * @type {Promise}
     */
    confirm: {
        value: function(confirmChoicePrompt) {
            var promiseForConfirm = Promise.defer();
            if (confirmChoicePrompt) {
                var options = {
                    iconSrc: this.iconSrc,
                    message: confirmChoicePrompt
                    // okLabel: "Continue",
                    // cancelLabel: "Pause"
                };
                Confirm.show(options, function() {
                    promiseForConfirm.resolve();
                }, function() {
                    console.log("The user clicked cancel.");

                    promiseForConfirm.reject("The user clicked cancel.");
                    // [Q] Unhandled rejection reasons (should be empty): ["(no stack) The user clicked cancel."] 
                    // https://github.com/kriskowal/q/issues/292
                    // https://github.com/kriskowal/q/issues/238 TODO seems to be nothing i can do about it...
                });
            } else {
                Promise.nextTick(function() {
                    promiseForConfirm.resolve();
                });
            }
            return promiseForConfirm.promise;
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
            if (firstTime) {
                this.currentlyPlaying = false;
                this.experimentDisplayTimeStart = Date.now();

                this.application.addEventListener("changeinterfaceLocale", this);
                this.application.addEventListener("changeCurrentAudience", this);
            }

            this.super(firstTime);
        }
    },

    toggleTutorialArea: {
        value: function() {
            this.tutorialMode = !this.tutorialMode;
            console.log("Show tutorial: " + this.tutorialMode);
        }
    },

    recordUsingMicrophoneOnly: {
        get: function() {
            return this._recordUsingMicrophoneOnly;
        },
        set: function(value) {
            if (value === this._recordUsingMicrophoneOnly) {
                return;
            }
            this._recordUsingMicrophoneOnly = value;
        }
    },

    handleShowSoundCheckAction: {
        value: function() {
            this.soundCheckHasBeenOpened = true;
            var self = this;
            SoundCheck.show({
                iconSrc: this.iconSrc,
                message: this.contextualizer.localize("locale_plug_in_headphones"),
                microphoneOnly: this.recordUsingMicrophoneOnly
                // okLabel: "Continue",
                // cancelLabel: "Pause"
            }, function() {
                console.log("User completed the sound check");
            }, function() {
                console.log("Waiting for user to plug in head phones");
            });
        }
    },

    run: {
        value: function() {
            console.log("currentlyPlaying: " + this.currentlyPlaying);

            this.experimentalDesign.jsonType = "experiment";
            this.experimentalDesign.experimentType = this.experimentType;
            this.experimentalDesign.experimentConclusion = this.experimentalDesign.experimentConclusion || this.contextualizer.localize("locale_incomplete");
            var self = this;
            if (this.application.videoRecordingVerified) {
                self.currentlyPlaying = true;
                self.startTime = Date.now();

                self._currentStimulus = self.templateObjects.currentStimulus;
                self._currentStimulus.imageAssetsPath = self.experimentalDesign.imageAssetsPath;
                self._currentStimulus.audioAssetsPath = self.experimentalDesign.audioAssetsPath;
                // self.templateObjects.currentStimulus.templateObjects.reinforcement = self.templateObjects.reinforcement;
                self.loadTestBlock.apply(self, [0]);

                self.templateObjects.tutorial.playInstructions();
            } else {
                SoundCheck.show({
                    iconSrc: this.iconSrc,
                    message: this.contextualizer.localize("locale_plug_in_headphones"),
                    microphoneOnly: this.recordUsingMicrophoneOnly
                    // okLabel: "Continue",
                    // cancelLabel: "Pause"
                }, function() {
                    self.currentlyPlaying = true;
                    self.startTime = Date.now();

                    self._currentStimulus = self.templateObjects.currentStimulus;
                    self._currentStimulus.imageAssetsPath = self.experimentalDesign.imageAssetsPath;
                    self._currentStimulus.audioAssetsPath = self.experimentalDesign.audioAssetsPath;
                    // self.templateObjects.currentStimulus.templateObjects.reinforcement = self.templateObjects.reinforcement;
                    self.loadTestBlock.apply(self, [0]);

                    self.templateObjects.tutorial.playInstructions();
                }, function() {
                    console.log("Waiting for user to plug in head phones");
                    // [Q] Unhandled rejection reasons (should be empty): ["(no stack) The user clicked cancel."] 
                    // https://github.com/kriskowal/q/issues/292
                    // https://github.com/kriskowal/q/issues/238 TODO seems to be nothing i can do about it...
                });

            }


        }
    },


    autoPlaySlideshowOfStimuli: {
        value: null
    },

    /**
     * 
     *
     * var example = {
            "auditoryStimulus": "practice_1_auditory_stimuli",
            "audioFile": "1.wav",
            "primeImage": "animal1.png",
            "targetImage": "practice1.png",
            "distractorImages": ["distractor1.png", "distractor2.png", "distractor3.png"],
            "response": {
                "reactionTimeAudioOffset": -234,
                "reactionTimeAudioOnset": 123,
                "x": 43,
                "y": 23
            }
        }
     */
    
    nextStimulus: {
        value: function() {
            if (this.canBeResumed) {
                this.currentlyPlaying = true;
            }
            var self = this;

            if (!this._currentTestBlock || !this._currentTestBlock.trials || !this._currentTestBlock.trials.length) {
                console.warn("Something is wrong, there are no stimuli so I can't go to the next. ");
                return;
            }
            if (this._currentStimulusIndex >= this._currentTestBlock.trials.length - 1) {
                this.templateObjects.reinforcement.showLast();
                this.reinforcementImageSrcWhileWaitForNextBlock = this.templateObjects.reinforcement.lastImageSrc + "";

                this.loadTestBlock.apply(this, [this._currentTestBlockIndex + 1]);
                return;
            }

            this._currentStimulusIndex++;
            console.log("Showing stimulus " + this._currentStimulusIndex + " of block " + this._currentTestBlockIndex);

            if (!this._currentTestBlock.trials._collection || !this._currentTestBlock.trials._collection[this._currentStimulusIndex]) {
                console.warn("Something is wrong, there was no stimulus.");
                return;
            }
            this.templateObjects.reinforcement.next();
            try {
                this.itemNumberInExperiment = this.itemNumberInExperiment || 0;
                this.itemNumberInExperiment = this.itemNumberInExperiment + 1;
                this._currentTestBlock.trials._collection[this._currentStimulusIndex].itemNumberInExperiment = this.itemNumberInExperiment;
                this._currentTestBlock.trials._collection[this._currentStimulusIndex].subexperimentLabel = this._currentTestBlock.label;                
                this._currentStimulus.load(this._currentTestBlock.trials._collection[this._currentStimulusIndex]);
            } catch (ERROR) {
                console.log("ERROR LOADING THE STIMULUS! ", ERROR);
            }

            if (this.autoPlaySlideshowOfStimuli) {
                window.setTimeout(function() {
                    console.log("Slideshow play...");
                    self.nextStimulus();
                }, 5000);
            }
        }
    },

    replayStimulus: {
        value: function() {
            console.log("Replaying stimulus");
            // this.application.audioPlayer.play();
            this._currentStimulus.load(this._currentTestBlock.trials._collection[this._currentStimulusIndex]);
        }
    },

    pauseStimulus: {
        value: function() {
            console.log("Pausing stimulus");
            // this.templateObjects.currentStimulus.pauseAudio();
            this.application.audioPlayer.togglePause();
        }
    },

    previousStimulus: {
        value: function() {

            if (!this._currentTestBlock || !this._currentTestBlock.trials || !this._currentTestBlock.trials.length) {
                console.warn("Something is wrong, there are no stimuli so I can't go to the next. ");
                return;
            }
            if (this._currentStimulusIndex === 0) {
                this.loadTestBlock.apply(this, [this._currentTestBlockIndex - 1, "finalIndex"]);
                return;
            }

            this._currentStimulusIndex--;
            console.log("Showing stimulus " + this._currentStimulusIndex + " of block " + this._currentTestBlockIndex);

            this.templateObjects.reinforcement.previous();
            this._currentStimulus.load(this._currentTestBlock.trials._collection[this._currentStimulusIndex]);
        }
    },

    loadTestBlock: {
        value: function(blockIndexToLoad, finalIndex) {

            if (!this.experimentalDesign || !this.experimentalDesign.subexperiments || blockIndexToLoad === undefined) {
                console.warn("Something is wrong, there are no subexperiments so I can't go to the next. ");
                return;
            }
            if (blockIndexToLoad < 0) {
                this.confirm("At the beginning!").then(function() {
                    console.log("Doing nothing");
                }, function(reason) {
                    console.log("Doing nothing");
                });
                return;
            }
            if (blockIndexToLoad >= this.experimentalDesign.subexperiments.length) {
                this.experimentCompleted();
                return;
            }
            if (!this.experimentalDesign.subexperiments._collection[blockIndexToLoad]) {
                console.warn("Something is wrong, there are no test bock so I can't go to the next. ");
                return;
            }

            this._currentTestBlockIndex = blockIndexToLoad;
            this._currentTestBlock = this.experimentalDesign.subexperiments._collection[blockIndexToLoad];

            // Show previous last image until the user confirms to go to this test block.
            if (this.reinforcementImageSrcWhileWaitForNextBlock) {
                this.lastImageForThisTestBlock = this._currentTestBlock.reinforcementAnimation.lastImageSrc + "";
                this._currentTestBlock.reinforcementAnimation.lastImageSrc = this.reinforcementImageSrcWhileWaitForNextBlock;
            }

            console.log("Loaded block " + blockIndexToLoad);
            if (this._currentTestBlock.trials && this._currentTestBlock.trials.length > 0 && typeof this._currentTestBlock.trials[0] !== "object") {
                var self = this;

                if (Object.prototype.toString.call(this._currentTestBlock.trials) === "[object Array]") {
                    this.application.stimuliCorpus.fetchCollection(this._currentTestBlock.trials).then(function(results) {
                        console.log(" downloaded trials ", results);
                        results = results.map(function(stimulus) {
                            stimulus = new FieldDB.Stimulus(stimulus);
                            var stimulusResponse = new FieldDB.Response(stimulus.clone());
                            stimulusResponse.id = FieldDB.FieldDBObject.uuidGenerator();
                            return stimulusResponse;
                        });

                        self._currentTestBlock.populate(results);
                        self.experimentBlockLoaded(finalIndex);
                    });
                } else {
                    console.warn("trials for this block were already fetched.");
                }
            }

        }
    },

    /**
     * By default when an experiment block is loaded,
     * it prompts the user if they are ready,
     * and then shows the first stimulus.
     *
     * This can be customized by experiements by overriding the experimentBlockLoaded function.
     */
    experimentBlockLoaded: {
        value: function(finalIndex) {
            var self = this;
            console.log("experimentBlockLoaded");

            if (finalIndex) {
                this._currentStimulusIndex = this._currentTestBlock.trials.length - 1;
            } else {
                this._currentStimulusIndex = -1;
            }

            if (this._currentTestBlock.reinforcementCounter) {
                this.reinforcementCounter = [];
                for (var stimulus = 0; stimulus < this._currentTestBlock.trials.length; stimulus++) {
                    var reinforcementItem = {
                        incompleteImageFile: this._currentTestBlock.reinforcementCounter.before,
                        completedImageFile: this._currentTestBlock.reinforcementCounter.after
                    };
                    if (this._currentTestBlock.reinforcementCounter.before.indexOf("://") === -1) {
                        reinforcementItem.incompleteImageFile = this.experimentalDesign.imageAssetsPath + "/" + this._currentTestBlock.reinforcementCounter.before;
                    }
                    if (this._currentTestBlock.reinforcementCounter.after.indexOf("://") === -1) {
                        reinforcementItem.completedImageFile = this.experimentalDesign.imageAssetsPath + "/" + this._currentTestBlock.reinforcementCounter.after;
                    }
                    this.reinforcementCounter.push(reinforcementItem);
                }
            } else if (this._currentTestBlock.reinforcementAnimation) {
                for (var frame = 0; frame < this._currentTestBlock.reinforcementAnimation.animationImages.length; frame++) {
                    if (this._currentTestBlock.reinforcementAnimation.animationImages[frame].incompleteImageFile) {
                        if (this._currentTestBlock.reinforcementAnimation.animationImages[frame].incompleteImageFile.indexOf("://") === -1) {
                            this._currentTestBlock.reinforcementAnimation.animationImages[frame].incompleteImageFile = this.experimentalDesign.imageAssetsPath + "/" + this._currentTestBlock.reinforcementAnimation.animationImages[frame].incompleteImageFile;
                        } else {
                            this._currentTestBlock.reinforcementAnimation.animationImages[frame].incompleteImageFile = this._currentTestBlock.reinforcementAnimation.animationImages[frame].incompleteImageFile;
                        }
                    }
                    if (this._currentTestBlock.reinforcementAnimation.animationImages[frame].currentImageFile) {
                        if (this._currentTestBlock.reinforcementAnimation.animationImages[frame].currentImageFile.indexOf("://") === -1) {
                            this._currentTestBlock.reinforcementAnimation.animationImages[frame].currentImageFile = this.experimentalDesign.imageAssetsPath + "/" + this._currentTestBlock.reinforcementAnimation.animationImages[frame].currentImageFile;
                        } else {
                            this._currentTestBlock.reinforcementAnimation.animationImages[frame].currentImageFile = this._currentTestBlock.reinforcementAnimation.animationImages[frame].currentImageFile;
                        }
                    }
                    if (this._currentTestBlock.reinforcementAnimation.animationImages[frame].completedImageFile) {
                        if (this._currentTestBlock.reinforcementAnimation.animationImages[frame].completedImageFile.indexOf("://") === -1) {
                            this._currentTestBlock.reinforcementAnimation.animationImages[frame].completedImageFile = this.experimentalDesign.imageAssetsPath + "/" + this._currentTestBlock.reinforcementAnimation.animationImages[frame].completedImageFile;
                        } else {
                            this._currentTestBlock.reinforcementAnimation.animationImages[frame].completedImageFile = this._currentTestBlock.reinforcementAnimation.animationImages[frame].completedImageFile;
                        }
                    }
                }

            }
            console.log("Using animation reinforcement", this._currentTestBlock.reinforcementAnimation);

            if (this._currentTestBlock.promptUserBeforeContinuing) {

                console.log("Waiting a bit before going to the next test block");
                setTimeout(function() {
                    var promptText = "    ";
                    if (self.application.currentAudience.text !== "Child" || self._currentTestBlock.promptUserBeforeContinuing.text.indexOf("instructions") === -1) {
                        promptText = self.contextualizer.localize(self._currentTestBlock.promptUserBeforeContinuing.text, self.experimentalDesign.stimuliDialect);
                    }
                    self.confirm(promptText).then(function() {
                        self.templateObjects.reinforcement.showFirst();
                        if (self.lastImageForThisTestBlock) {
                            self._currentTestBlock.reinforcementAnimation.lastImageSrc = self.lastImageForThisTestBlock;
                        }
                        self.nextStimulus();
                    }).fail(function(reason) {
                        console.log("TODO add a button for resume? or is the start button working for resume...");
                        self.currentlyPlaying = false;
                        self.canBeResumed = true;
                        self.application.audioPlayer.stop();
                    });
                }, 2000);

            } else {
                this.templateObjects.reinforcement.showFirst();
                this.nextStimulus();
            }
        }
    },

    resumePreviousGame: {
        value: function() {
            console.log("TODO show a list of previous games, let the user select one, then go through the game design, find the stimulus that wasnt completed, and display all the trials and stimuli to the test administarator so they can choose where to resume.");
        }
    },

    saveParticipant: {
        value: function(onlyIfNotSaved) {
            if (onlyIfNotSaved && this.participant.rev) {
                console.warn("Not saving this participant, they already have a revision", this.participant);
                return;
            }
            if (!this.participant || !this.participant.save) {
                console.warn("Not saving this participant, they are not a fielddb object", this.participant);
                return;
            }
            if (this.participant.anonymousCode.indexOf(this.participant.lastname) > -1) {
                this.participant.firstname = this.contextualizer.localize("locale_completed");
            }
            this.participant.url = FieldDB.Database.prototype.BASE_DB_URL + "/" + FieldDB.FieldDBObject.application.corpus.dbname;
            this.participant.save().then(function(result) {
                console.log("participant was saved", result);
            }, function(error) {
                console.warn("participant was not saved", error);
            });
        }
    },

    startTime: {
        get: function() {
            if (!this.experimentalDesign || !this.experimentalDesign.startTimestamp) {
                return;
            }
            return new Date(this.experimentalDesign.startTimestamp);
        },
        set: function(value) {
            this.experimentalDesign.startTimestamp = value;
        }
    },

    endTime: {
        get: function() {
            if (!this.experimentalDesign || !this.experimentalDesign.endTimestamp) {
                return;
            }
            return new Date(this.experimentalDesign.endTimestamp);
        },
        set: function(value) {
            this.experimentalDesign.endTimestamp = value;
            this.experimentalDesign.runDuration = value - this.experimentalDesign.startTimestamp;
        }
    },

    experimentCompleted: {
        value: function() {
            var self = this;

            this.endTime = Date.now();
            this.experimentalDesign.experimenter = this.experimenter.username;
            this.experimentalDesign.participant = this.participant.id;
            // delete this.experimentalDesign.rev;
            this.application.corpus.set(this.experimentalDesign.experimentType + this.experimentalDesign.endTimestamp, this.experimentalDesign.toJSON()).then(function(saveresult) {
                console.log("saved results", saveresult);
                console.warn("TODO test rev on experimentalDesign", self.experimentalDesign.rev);
                // self.experimentalDesign._rev = saveresult._rev;
                self.saveParticipant("onlynewparticipants");
            }, function(saveerror) {
                console.warn("unable to save results, logging in as an anonymous user", saveerror);
                self.application.corpus.login({
                    username: "anonymoussailsuser",
                    password: "none"
                }).then(function(loginresults) {
                    console.log("Logged in", loginresults);
                    self.application.corpus.set(self.experimentalDesign.experimentType + self.experimentalDesign.endTimestamp, self.experimentalDesign).then(function(result) {
                        console.log("experiment saved ", result);
                        // self.experimentalDesign._rev = result._rev;
                        self.saveParticipant("onlynewparticipants");
                    }, function(error) {
                        console.warn("Trying to save the experiment again in 2 seconds", error);
                        setTimout(function() {
                            self.experimentCompleted();
                        }, 2000);
                    });
                }, function(error2) {
                    // console.warn("gave up on logging in to save the experiment.", error2);
                    console.warn("Trying to save the experiment again in 2 seconds", error2);
                    setTimout(function() {
                        self.experimentCompleted();
                    }, 2000);
                });
            });

            this.confirm(this.contextualizer.localize(this.experimentalDesign.end_instructions.for_child, this.experimentalDesign.stimuliDialect)).then(function() {
                console.log("Experiment is complete.");
                self.currentlyPlaying = false;
                self.experimentIsComplete = true;
                self.canBeResumed = false;
                self.showResultReport();
            }, function(reason) {
                console.log("TODO add a button for resume?");
            });

        }
    },

    showResultReport: {
        value: function() {
            this.resultsReportMode = !this.resultsReportMode;
            console.log("resultsReportMode " + this.resultsReportMode);
            if (this.templateObjects.resultReport) {
                this.templateObjects.resultReport.calculateScore();
            }
        }
    },


    pause: {
        value: function() {}
    },

    handleLocaleChange: {
        value: function(now, previous) {
            console.log("handleLocaleChange");
            if (!now || now.length === 0 || !now[0]) {
                return;
            }
            console.log("Locale changed from: " + (previous[0] ? previous[0].label : "nothing") + " -> " + (now[0] ? now[0].label : "nothing"));
        }
    },

    handleChangeinterfaceLocale: {
        value: function() {
            if (this.application && this.application.interfaceLocale) {
                console.log("handleChangeinterfaceLocale", this.application.interfaceLocale);
                this.contextualizer.currentLocale = this.application.interfaceLocale;
                this.needsDraw = true;
                this.setContextualizedText("description");
                this.setContextualizedText("instructions");
                this.setTitle();
            } else {
                console.log("Not setting the experiments contextualizer locale");
            }
        }
    },

    handleChangeCurrentAudience: {
        value: function() {
            this.handleChangeinterfaceLocale();
        }
    },

    getTextFor: {
        value: function(key, audience, dialect) {
            console.log("getTextFor", key, audience, dialect);
            return this[key];
        }
    },

    /*
    TODO change the labelPropertyName to use an FRB contingent on gamify
    */
    gamify: {
        value: null
    },

    description: {
        value: null
    },
    setContextualizedText: {
        value: function(key) {
            var contextualizedKey = "";
            if (!this.experimentalDesign || !this.experimentalDesign[key]) {
                return key;
            }
            if (this.application && this.application.currentAudience) {
                var context = this.application.currentAudience.key;
                if (this.gamify && this.application.currentAudience.gamifiedKey) {
                    context = this.application.currentAudience.gamifiedKey;
                }
                contextualizedKey = this.experimentalDesign[key]["for_" + context];
                console.log("Contextualizing key for " + key);
            }
            if (!contextualizedKey) {
                contextualizedKey = this.experimentalDesign[key]["default"] || "";
            }

            var localized = this.contextualizer.localize(contextualizedKey, this.experimentalDesign.stimuliDialect);
            if (key === "instructions") {
                this.instructionsAudioDetails = this.contextualizer.audio(contextualizedKey);
                this.instructionsAudioDetails.path = this.experimentalDesign.audioAssetsPath;
            }
            this[key] = localized;
            return localized;
        }
    },

    title: {
        value: null
    },
    setTitle: {
        value: function() {
            var title = "";
            if (!this.experimentalDesign || !this.experimentalDesign.title) {
                return title;
            }
            if (this.gamify) {
                title = this.experimentalDesign.title["gamified_title"] || ""; //jshint ignore:line
            }
            if (!title) {
                title = this.experimentalDesign.title["default"] || "";
            }
            var localized = this.contextualizer.localize(title);
            this.title = localized;
            return localized;
        }
    }
});
