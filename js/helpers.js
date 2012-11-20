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

var handleCommandLineArgs = function (args) {
    var myConsole = ioDrivers.openConsole();
    var commandLineOpts = {};
    var urls = [];
    if (args[0]) {
        if (args[0] === '--help' || args[0] === '-h') {
            myConsole.print('analyzer/bin/analyze <options> <files>');
            myConsole.print('   -c              console output');
            myConsole.print('   -i         interactive console');
            myConsole.print('   -s                      silent');
            myConsole.print('   -no-cyclo    disable cycloComp');
            myConsole.print('   -no-stat    disable statistics');
            myConsole.print('   -h                   this help');
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