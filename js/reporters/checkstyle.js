(function () {
    function mergeDefaultData(obj) {
        return extend({
            line: 0,
            column: 0,
            severity: '',
            message: '',
            source: '',
            evidence: ''
        }, obj);
    }
    reporters.checkstyle = {
        xml: function (file) {
            file.addHeader('<?xml version="1.0" encoding="UTF-8"?>\n');
            file.addHeader('<checkstyle version="1.3.0">\n');
            file.addFooter('  </file>\n');
            file.addFooter('</checkstyle>\n');
            var firstFile = true;
            return {
                error: function (obj) {
                    var data = mergeDefaultData(obj);
                    file.print('    <error line="' + data.line + '" column="' + data.column + '" ' +
                        'severity="' + data.severity + '" message="' + escapeHTML(data.message) + '" ' +
                        'source="' + data.source + '" evidence="' + escapeHTML(data.evidence) + '"/>\n'
                    );
                },
                newFile: function (filename) {
                    if (!firstFile) {
                        file.print('  </file>\n');
                    }
                    firstFile = false;
                    file.print('  <file name="' + escapeHTML(filename) + '">\n');
                },
                close: function () {
                    file.close();
                }
            };
        },
        plain: function (file) {
            var curFile;
            return {
                error: function (obj) {
                    var data = mergeDefaultData(obj);
                    file.print(curFile + '(' + data.line + ',' + data.column + '): ' + data.message);
                },
                newFile: function (filename) {
                    curFile = filename;
                },
                close: function () {}
            };
        }
    };
})();