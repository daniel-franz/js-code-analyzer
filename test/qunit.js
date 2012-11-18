var exports = {};
steal(
    'funcunit/qunit'
).then(
    './helper_test.js',
    './reporters_test.js',
    './esprima_analyzer_test.js',
    './jslint_analyzer_test.js'
);