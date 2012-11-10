steal('steal/clean/jslint.js', './helpers.js', function () {
    var jsLint_analyzer = function (options, files) {
        this.options = options;
        this.print = outputDrivers.printFile;
        this.checkStyleFile = files.checkStyle;
        this.print('<?xml version="1.0" encoding="UTF-8"?>\n', {file: this.checkStyleFile});
        this.print('<checkstyle version="1.3.0">\n', {file: this.checkStyleFile});
    };
    jsLint_analyzer.prototype.parse = function (out, curFilename) {
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

                var evidence = escapeHTML(
                    line.substring(
                        Math.max(error.character - 25, 0),
                        Math.min(error.character + 25, line.length)
                    ).replace(/^\s+/, ""));

                if (error.reason == 'Extra comma.') {
                    severity = 'error';
                }

                this.print('    <error line="' + error.line + '" column="' +
                    error.character + '" severity="' + severity + '" message="' + escapeHTML(error.reason) +
                    '" source="JSlint.Error" evidence="' + evidence + '"/>\n', {file: this.checkStyleFile}
                );
            }
        }

        var data = JSLINT.data();

        if (data.unused) {
            for (i = 0; i < data.unused.length; i++) {
                this.print('    <error line="' + data.unused[i].line + '" column="' +
                    data.unused[i].character + '" severity="info" message="Unused variable: ' +
                    escapeHTML(data.unused[i].name) + '" source="JSlint.Unused"/>\n', {file: this.checkStyleFile}
                );
            }
        }
    };
    jsLint_analyzer.prototype.destroy = function () {
        this.print('</checkstyle>\n', {file: this.checkStyleFile});
        this.checkStyleFile.close();
    };

    exports.jsLint_analyzer = jsLint_analyzer;
});