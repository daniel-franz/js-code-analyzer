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
    })
});