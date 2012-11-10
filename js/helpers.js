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
var outputDrivers = {
    print: function (text, options) {
        print(text);
    },
    printFile: function (text, options) {
        options.file.write(text);
    },
    openFile: function (filename) {
        var fstream = new java.io.FileWriter(filename, false);
        return new java.io.BufferedWriter(fstream);
    }
};