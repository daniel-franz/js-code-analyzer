var exports = {};
steal('steal/build', './helpers.js', './jslint_analyzer.js', './esprima_analyzer.js', function (steal) {
    var analyzers = {
        data: {},
        factory: function (type, options) {
            if (!analyzers.data.files) {
                analyzers.data.files = {};
            }
            if (!analyzers.data.files.depGraph) {
                analyzers.data.files.depGraph = ioDrivers.openFile('dependencies.dot');
            }
            if (!analyzers.data.files.eventGraph) {
                analyzers.data.files.eventGraph = ioDrivers.openFile('openajax-events.dot');
            }
            if (!analyzers.data.files.checkStyle) {
                analyzers.data.files.checkStyle = ioDrivers.openFile('checkstyle_js.xml');
            }
            if (!analyzers.data.files.depMatrix) {
                analyzers.data.files.depMatrix = ioDrivers.openFile('js-dependencies.html');
            }
            if (!analyzers.data.files.statistics) {
                analyzers.data.files.statistics = ioDrivers.openFile('js-statistics.html');
            }
            return new analyzers[type](options, analyzers.data.files);
        },
        startFile: function (filename) {
            analyzers.data.files.checkStyle.print('  <file name="' + escapeHTML(filename) + '">\n');
        },
        stopFile: function (filename) {
            analyzers.data.files.checkStyle.print('  </file>\n');
        },
        jsLint: exports.jsLint_analyzer,
        esprima: exports.esprima_analyzer
    };
    var isFilenameIgnored = function (curFilename, ext, options) {
        var i, j;
        for (i = 0; i < options.skipExtensions.length; i++) {
            if (ext === options.skipExtensions[i]) {
                return true;
            }
        }
        for (i = 0; i < options.fileBlacklist.length; i++) {
            if (curFilename.substr(0, options.fileBlacklist[i].length) === options.fileBlacklist[i]) {
                for (j = 0; j < options.fileWhitelist.length; j++) {
                    if (curFilename.substr(0, options.fileWhitelist[j].length) === options.fileWhitelist[j] &&
                        options.fileWhitelist[j].substr(0, options.fileBlacklist[i].length) === options.fileBlacklist[i]
                    ) {
                        return false;
                    }
                }
                return true;
            }
        }
        var inList = false;
        for (i = 0; i < options.fileWhitelist.length; i++) {
            if (curFilename.substr(0, options.fileWhitelist[i].length) === options.fileWhitelist[i]) {
                inList = true;
            }
        }
        if (!inList && options.fileWhitelist.length) {
            return true;
        }
        return false;
    };
    steal.analyze = function (url, options) {
        options = extend({
            pathPrefix: '',
            jquery : false,
            analyzers: ['esprima', 'jsLint'],
            skipExtensions: ['ejs', 'css'],
            fileWhitelist: [],
            fileBlacklist: []
        }, steal.opts(options || {}, {
            //compress everything, regardless of what you find
            all : 1,
            //folder to build to, defaults to the folder the page is in
            to: 1
        }));
        var alreadyLoaded = {};
        var folder = steal.URI.cur.dir();
        var myAnalyzers = [];

        for (var i = 0; i < options.analyzers.length; i++) {
            myAnalyzers.push(analyzers.factory(options.analyzers[i], options));
        }

        steal.build.open(url, function (files) {
            files.each(function (script, text, i) {
                var curFilename, ext;
                if (script.type === 'fn' && script.rootSrc) {
                    var src = script.rootSrc + "",
                        base = "" + window.location,
                        url = ('../../' + src).match(/([^\?#]*)/)[1];
                    curFilename = src;
                    ext = curFilename.split('.').pop();
                    url = Envjs.uri(url, base);

                    if (url.match(/^file\:/)) {
                        url = url.replace("file:/", "");
                        text = readFile("/" + url);
                    }

                    if (url.match(/^http\:/)) {
                        text = readUrl(url);
                    }
                } else {
                    curFilename = folder.join(script.src).toString();
                    ext = script.ext;
                    text = text.options.text;
                }
                if (!text || !curFilename || alreadyLoaded[curFilename]) {
                    return;
                }
                if (isFilenameIgnored(curFilename, ext, options)) {
                    return;
                }
                analyzers.startFile(options.pathPrefix + curFilename);
                for (var j = 0; j < myAnalyzers.length; j++) {
                    myAnalyzers[j].parse(text, curFilename);
                }
                analyzers.stopFile(options.pathPrefix + curFilename);
                alreadyLoaded[curFilename] = true;
            });
        });

        for (var j = 0; j < myAnalyzers.length; j++) {
            myAnalyzers[j].destroy();
        }
    };
});
