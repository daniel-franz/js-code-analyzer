/*global java */

var escapeHTML = function (content) {
    return content.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&#34;')
        .replace(/'/g, "&#39;");
};
var extend = function (d, s) {
    for (var p in s) {
        d[p] = s[p];
    }
    return d;
};
var ioDrivers = {
    openConsole: function () {
        return {
            addHeader: function () {},
            addFooter: function () {},
            read: function () {
                var br = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System["in"]));
                try {
                    return br.readLine();
                } catch (e) {}
                return '';
            },
            print: function (text) {
                print(text.replace(/\n$/, ''));
            },
            close: function () {}
        }
    },
    openFile: function (filename) {
        var handle, header = '', footer = '';
        return {
            addHeader: function (text) {
                header += text;
            },
            addFooter: function (text) {
                footer += text;
            },
            read: function () {

            },
            print: function (text) {
                if (!handle) {
                    handle = new java.io.BufferedWriter(new java.io.FileWriter(filename, false));
                    handle.write(header);
                }
                handle.write(text);
            },
            close: function () {
                if (handle) {
                    handle.write(footer);
                    handle.close();
                }
            }
        };
    }
};
var reporters = {
    xmlCheckstyle: function (file) {
        file.addHeader('<?xml version="1.0" encoding="UTF-8"?>\n');
        file.addHeader('<checkstyle version="1.3.0">\n');
        file.addFooter('</file>\n');
        file.addFooter('</checkstyle>\n');
        var newFile = true;
        return {
            error: function (obj) {
                var data = {
                    line: 0,
                    column: 0,
                    severity: '',
                    message: '',
                    source: '',
                    evidence: ''
                };
                extend(data, obj);
                file.print('    <error line="' + data.line + '" column="' + data.column + '" ' +
                    'severity="' + data.severity + '" message="'+ escapeHTML(data.message) + '" ' +
                    'source="' + data.source + '" evidence="' + escapeHTML(data.evidence) + '"/>\n'
                );
            },
            newFile: function (filename) {
                if (!newFile) {
                    file.print('</file>\n');
                }
                newFile = false;
                file.print('  <file name="' + escapeHTML(filename) + '">\n');
            },
            close: function () {
                file.close();
            }
        }
    }
};