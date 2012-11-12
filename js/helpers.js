/*global: java */

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
            read: function () {
                var br = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System["in"]));
                try {
                    return br.readLine();
                } catch (e) {}
                return '';
            },
            print: function (text) {
                print(text);
            },
            close: function () {}
        }
    },
    openFile: function (filename) {
        var handle;
        return {
            read: function () {

            },
            print: function (text) {
                if (!handle) {
                    handle = new java.io.BufferedWriter(new java.io.FileWriter(filename, false));
                }
                handle.write(text);
            },
            close: function () {
                if (handle) {
                    handle.close();
                }
            }
        };
    }
};