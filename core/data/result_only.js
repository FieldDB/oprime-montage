exports.emit = function(key, value) {
  console.log(key, value);
};
exports.map = function(doc) {
  try {
    emit = emit || this.emit;
  } catch (e) {
    emit = this.emit;
  }

  try {
    if (doc.fieldDBtype !== "SubExperimentDataList" || !doc.results) {
      return;
    }
    var totalTestScore = 0;
    var totalTestStimuli = 0;
    var totalAnswered = 0;
    var calculatedResults = [];

    var subexperiments = [];

    var experimentId = doc.relatedData[0].URI.split("?rev=")[0];
    var experimentRev = doc.relatedData[0].URI.split("?rev=")[1];

    if (doc && doc.results && doc.results) {
      subexperiments = JSON.parse(JSON.stringify(doc.results));
    }

    for (var subexperimentIndex = 0; subexperimentIndex < subexperiments.length; subexperimentIndex++) {
      var subexperiment = subexperiments[subexperimentIndex];
      subexperiment.scoreSubTotal = 0;
      subexperiment.stimuliSubTotal = 0;
      subexperiment.answeredSubTotal = 0;

      var trials = [];
      if (subexperiment.results && subexperiment.results) {
        trials = subexperiment.results;
      }
      for (var stimulusIndex = 0; stimulusIndex < trials.length; stimulusIndex++) {
        var stimulusToScore = trials[stimulusIndex];

        var calculatedResult = {};
        if (stimulusToScore.prime) {
          calculatedResult.prime = stimulusToScore.prime ? stimulusToScore.prime.utterance : null;
        }

        if (stimulusToScore.target) {
          calculatedResult.target = stimulusToScore.target ? stimulusToScore.target.utterance : null;
          calculatedResult.targetOrthography = stimulusToScore.target ? stimulusToScore.target.orthography : null;
          var appropriateImage = stimulusToScore.target ? stimulusToScore.target.utterance : null;
          if (appropriateImage === "gʁi") {
            appropriateImage = "gris";
          } else {
            appropriateImage = "X";
          }
          calculatedResult.appropriateImage = appropriateImage;
        }

        if (stimulusToScore && stimulusToScore.responses && stimulusToScore.responses[stimulusToScore.responses.length - 1] && stimulusToScore.responses[stimulusToScore.responses.length - 1].score !== undefined) {
          stimulusToScore.response = stimulusToScore.responses[stimulusToScore.responses.length - 1];
          stimulusToScore.response = stimulusToScore.response || {};
          stimulusToScore.response.choice = stimulusToScore.response.choice || {
            utterance: null
          };

          calculatedResult.response = stimulusToScore.response.choice ? stimulusToScore.response.choice.utterance : null;
          var chosenImage = stimulusToScore.response.choice ? stimulusToScore.response.choice.utterance : null;
          if (chosenImage === "gʁi") {
            chosenImage = "gris";
          } else {
            chosenImage = "X";
          }
          calculatedResult.chosenImage = chosenImage;

          stimulusToScore.score = parseFloat(stimulusToScore.response.score, 10);
          calculatedResult.score = stimulusToScore.score;

          totalAnswered = totalAnswered + 1;
          subexperiment.answeredSubTotal = subexperiment.answeredSubTotal + 1;
        } else {
          stimulusToScore.score = 0;
          calculatedResult.score = stimulusToScore.score;
          calculatedResult.chosenImage = "NA";
          calculatedResult.response = "NA";
        }
        subexperiment.stimuliSubTotal = subexperiment.stimuliSubTotal + 1;
        subexperiment.scoreSubTotal = subexperiment.scoreSubTotal + stimulusToScore.score;
        calculatedResults.push(calculatedResult);
        // emit("stimulusToScoreresponses", stimulusToScore.responses);

      }

      if (subexperiment.label.indexOf("ractice") === -1 && subexperiment.label.indexOf("ractique") === -1) {
        totalTestScore = totalTestScore + subexperiment.scoreSubTotal;
        totalTestStimuli = totalTestStimuli + trials.length;
      }
      // emit("subexperiment", subexperiment.scoreSubTotal);
      subexperiment.stimuliSubTotal = trials.length || 0.001;
      subexperiment.calculatedResults = calculatedResults;
      calculatedResults = [];
    }
    totalTestStimuli = totalTestStimuli || 0.001;
    var experimentConclusion;
    if (totalTestScore / totalTestStimuli * 100 >= doc.passingScore) {
      experimentConclusion = "Ce résultat est acceptable.";
    }
    if (totalTestScore / totalTestStimuli * 100 < doc.passingScore) {
      experimentConclusion = "Ce résultat est sous la norme de passage.";
    }
    emit("sails", {
      score: (totalTestScore / totalTestStimuli * 100),
      rawTestScore: totalTestScore,
      totalAnswered: totalAnswered,
      totalTestStimuli: totalTestStimuli,
      participant: doc.participant,
      experimenter: doc.experimenter,
      experimentId: experimentId,
      experimentRev: experimentRev,
      runDuration: doc.runDuration,
      startTime: doc.startTimestamp,
      endTime: doc.endTimestamp,
      experimentConclusion: experimentConclusion,
      subexperiments: subexperiments.map(function(subexperiment) {
        return {
          score: (subexperiment.scoreSubTotal / subexperiment.stimuliSubTotal * 100) + "%",
          calculatedResults: subexperiment.calculatedResults,
          title: subexperiment.label
        };
      })
    });

  } catch (e) {
    emit(e, 1);
  }
};



// function(doc) {
//     try {
//         emit = emit || this.emit;
//     } catch (e) {
//         emit = this.emit;
//     }

//     try {
//         if (doc.jsonType === "experiment") {

//             var totalTestScore = 0;
//             var totalTestStimuli = 0;
//             var totalAnswered = 0;
//             var results = [];

//             var subexperiments = [];
//             if (doc && doc.subexperiments && doc.subexperiments._collection) {
//                 subexperiments = doc.subexperiments._collection;
//             }
//             for (var subexperimentIndex = 0; subexperimentIndex < subexperiments.length; subexperimentIndex++) {
//                 var subexperiment = subexperiments[subexperimentIndex];
//                 subexperiment.scoreSubTotal = 0;

//                 var trials = [];
//                 if (subexperiment.trials && subexperiment.trials._collection) {
//                     trials = subexperiment.trials._collection;
//                 }
//                 for (var stimulusIndex = 0; stimulusIndex < trials.length; stimulusIndex++) {
//                     var stimulusToScore = trials[stimulusIndex];
//                     if (stimulusToScore.responses && stimulusToScore.responses[stimulusToScore.responses.length - 1] && stimulusToScore.responses[stimulusToScore.responses.length - 1].score !== undefined) {
//                         stimulusToScore.response = stimulusToScore.responses[stimulusToScore.responses.length - 1];
//                         stimulusToScore.score = stimulusToScore.responses[stimulusToScore.responses.length - 1].score;
//                         results.push({
//                             prime: stimulusToScore.prime ? stimulusToScore.prime.utterance : null,
//                             stimulus: stimulusToScore.stimulus ? stimulusToScore.stimulus.utterance : null,
//                             target: stimulusToScore.target ? stimulusToScore.target.utterance : null,
//                             response: stimulusToScore.response.choice ? stimulusToScore.response.choice.utterance : null,
//                             score: stimulusToScore.score
//                         });
//                         subexperiment.scoreSubTotal += stimulusToScore.score;
//                         totalAnswered++;
//                     } else {
//                         // stimulusToScore.response = {
//                         //  response: {
//                         //      orthography: "NA"
//                         //  }
//                         // };
//                         // stimulusToScore.score = null;
//                         // results.push(stimulusToScore);
//                     }
//                 }
//                 if (true || subexperiment.label.indexOf("practice") === -1) {
//                     totalTestScore += subexperiment.scoreSubTotal;
//                     totalTestStimuli += trials.length;
//                 }
//             }
//             emit(totalTestScore / totalAnswered, results);
//         }
//     } catch (e) {
//         emit(e, 1);
//     }
// }
