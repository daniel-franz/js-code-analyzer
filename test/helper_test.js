steal('../js/helpers.js', function () {
    module('Helpers');

    test('escapeHTML', function () {
        equal(
            escapeHTML('<a href="analyze-my-code">Analyzing&The Code\'s Quality-Check</a>'),
            '&lt;a href=&#34;analyze-my-code&#34;&gt;Analyzing&amp;The Code&#39;s Quality-Check&lt;/a&gt;'
        );
    });

    test('extend', function () {
        var input = {test: {obj: '123'}};
        var output = extend({}, input);
        deepEqual(input, output);
    });

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