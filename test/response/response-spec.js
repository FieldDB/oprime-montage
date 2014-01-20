var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("response-test", function(testPage) {
    var test;
    beforeEach(function() {
        test = testPage.test;
    });

    describe("test/response/response-spec", function() {
        var response;

        beforeEach(function() {
            response = test.response;
        });

        describe("when first loaded", function() {
            it("it should do something", function() {
                expect(response).toBeDefined();
            });
        });
        describe('audio', function() {
            var testAudio;

            beforeEach(function() {
                testAudio = document.getElementById("testaudio");
            });

            it('should play audio', function() {
                runs(function() {
                    spyOn(testAudio, 'play');
                    testAudio.play();
                    // helper.trigger(window.document, 'deviceready');
                });

                waitsFor(function() {
                    return (testAudio.play.calls.length > 0);
                }, 'calls should be called once', 5000);

                runs(function() {
                    expect(testAudio.play).toHaveBeenCalled();
                });
            });
        });
    });
});
