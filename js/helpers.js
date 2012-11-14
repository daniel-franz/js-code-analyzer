/*global java */

var escapeHTML = function (content) {
    return content.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&#34;')
        .replace(/'/g, "&#39;");
};
var extend = function (dst, src) {
    for (var prop in src) {
        dst[prop] = src[prop];
    }
    return dst;
};
var ioDrivers = {
    openConsole: function () {
        return {
            addHeader: function () {},
            addFooter: function () {},
            read: function () {
                var reader = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System["in"]));
                try {
                    return reader.readLine();
                } catch (e) {}
                return '';
            },
            print: function (text) {
                print(text.replace(/\n$/, ''));
            },
            close: function () {}
        };
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
        file.addFooter('  </file>\n');
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
                    'severity="' + data.severity + '" message="' + escapeHTML(data.message) + '" ' +
                    'source="' + data.source + '" evidence="' + escapeHTML(data.evidence) + '"/>\n'
                );
            },
            newFile: function (filename) {
                if (!newFile) {
                    file.print('  </file>\n');
                }
                newFile = false;
                file.print('  <file name="' + escapeHTML(filename) + '">\n');
            },
            close: function () {
                file.close();
            }
        };
    },
    plainCheckstyle: function (file) {
        var curFile;
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
                file.print(curFile + '(' + data.line + ',' + data.column + '): ' + data.message);
            },
            newFile: function (filename) {
                curFile = filename;
            },
            close: function () {}
        };
    }
};

var handleCommandLineArgs = function (args) {
    var myConsole = ioDrivers.openConsole();
    var commandLineOpts = {};
    var urls = [];
    if (args[0]) {
        if (args[0] === '--help' || args[0] === '-h') {
            myConsole.print('analyzer/bin/analyze <options> <files>');
            myConsole.print('   -c           console output');
            myConsole.print('   -i      interactive console');
            myConsole.print('   -h                this help');
            return;
        }
        for (var i = 0; i < args.length; i++) {
            if (args[i].indexOf('-') === 0) {
                commandLineOpts[args[i]] = true;
                continue;
            }
            urls.push(args[i]);
        }
    }
    return {
        urls: urls,
        commandLineOpts: commandLineOpts
    };
};