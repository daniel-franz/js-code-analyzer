var JSLINT;
steal('steal/clean/jslint.js', './helpers.js', function () {
    var jsLint_analyzer = function (options, files) {
        this.options = options;
        this.reporter = files.checkStyleReporter;
//        this.checkStyleFile = files.checkStyle;
//        this.checkStyleFile.addHeader('<?xml version="1.0" encoding="UTF-8"?>\n');
//        this.checkStyleFile.addHeader('<checkstyle version="1.3.0">\n');
    };
    jsLint_analyzer.prototype.parse = function (out) {
        var i;
        JSLINT(out, this.options.jsLintOpts);
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
//                this.checkStyleFile.print('    <error line="' + error.line + '" column="' +
//                    error.character + '" severity="' + severity + '" message="' + escapeHTML(error.reason) +
//                    '" source="JSlint.Error" evidence="' + evidence + '"/>\n'
//                );
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
//                this.checkStyleFile.print('    <error line="' + data.unused[i].line + '" column="0" ' +
//                    'severity="info" message="Unused variable: ' +
//                    escapeHTML(data.unused[i].name) + '" source="JSlint.Unused"/>\n'
//                );
            }
        }
    };
    jsLint_analyzer.prototype.destroy = function () {
//        this.checkStyleFile.addFooter('</checkstyle>\n');
//        this.checkStyleFile.close();
    };

    exports.jsLint_analyzer = jsLint_analyzer;
});