/*global extend: true, exports: true */

var JSLINT;
steal('steal/clean/jslint.js', './helpers.js', function () {
    var jsLint_analyzer = function (options, files) {
        this.options = options;
        this.reporter = files.checkStyleReporter;
    };
    jsLint_analyzer.prototype.parse = function (out) {
        var i;
        var opts = {};
        extend(opts, this.options.jsLintOpts);
        JSLINT(out, opts);
        if (JSLINT.errors.length) {
            for (i = 0; i < JSLINT.errors.length; i++) {
                var error = JSLINT.errors[i];
                var severity = 'warning';
                if (!error.evidence) {
                    break;
                }
                var line = error.evidence.replace(/\t/g, "     ");

                var evidence = line.substring(
                        Math.max(error.character - 25, 0),
                        Math.min(error.character + 25, line.length)
                    ).replace(/^\s+/, "");

                if (error.reason == 'Extra comma.') {
                    severity = 'error';
                }

                this.reporter.error({
                    line: error.line,
                    column: error.character,
                    severity: severity,
                    message: error.reason,
                    source: 'JSlint.Error',
                    evidence: evidence
                });
            }
        }

        var data = JSLINT.data();

        if (data.unused) {
            for (i = 0; i < data.unused.length; i++) {
                this.reporter.error({
                    line: data.unused[i].line,
                    severity: 'info',
                    message: 'Unused variable: ' + data.unused[i].name,
                    source: 'JSlint.Unused'
                });
            }
        }
    };
    jsLint_analyzer.prototype.destroy = function () {
    };

    exports.jsLint_analyzer = jsLint_analyzer;
});