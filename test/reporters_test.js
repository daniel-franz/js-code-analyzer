steal('../js/reporters/reporters.js', function () {
    module('Reporters');

    test('composite reporter', 3, function () {
        var reporter1 = {
            someThing: function (testParam) {
                ok(testParam);
            },
            otherThing: function () {
                ok(false);
            }
        };
        var reporter2 = {
            someThing: function (testParam) {
                ok(testParam);
            },
            thirdThing: function () {
                ok(true);
            }
        };

        var compoReporter = reporters.composite([reporter1, reporter2]);

        compoReporter.someThing(true);
        compoReporter.thirdThing();
    });
});