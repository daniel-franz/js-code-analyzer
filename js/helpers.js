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
    checkstyle: {
        xml: function (file) {
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
        plain: function (file) {
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
    },
    composite: function (deps) {
        var reporter = {};
        var getReporterFunc = function (name) {
            return function () {
                for (var i = 0; i < deps.length; i++) {
                    if (deps[i][name]) {
                        deps[i][name].apply(deps[i][name], arguments);
                    }
                }
            }
        };
        for (var i = 0; i < deps.length; i++) {
            for (var j in deps[i]) {
                if (!reporter[j]) {
                    reporter[j] = getReporterFunc(j);
                }
            }
        }
        return reporter;
    },
    dependency: {
        dot: function (file) {
            file.addHeader('digraph Dependencies {\n');
            file.addHeader('    rankdir=LR\n');
            file.addFooter('}');
            return {
                dependency: function (from, to, options) {
                    var style = [];
                    if (options.inherit) {
                        style.push('style=bold');
                    }
                    if (options.instanciate) {
                        style.push('arrowhead=odot');
                    }
                    if (options.stat) {
                        style.push('color=red');
                    }
                    file.print('    "' + from + '" -> "' + to + '" [' + style.join(',') + '];\n');
                },
                close: function () {
                    file.close();
                }
            };
        },
        html: function (file) {
            file.addHeader('<!DOCTYPE html>' +
                '<html>' +
                '<head>' +
                '<style>' +
                '.matrix {' +
                '    border-spacing: 0;' +
                '}' +
                '.matrix td {' +
                '    border: 1px solid black;' +
                '}' +
                '.matrix td.used {' +
                '    background-color: #800;' +
                '    color: #ff8;' +
                '}' +
                '.diag {' +
                '    background-color: grey;' +
                '}' +
                '.name {' +
                '    background-color: #ddd;' +
                '}' +
                '.index {' +
                '    background-color: orange;' +
                '}' +
                '.index div {' +
                'margin: 2px;' +
                '    -webkit-transform: rotate(-90deg);	' +
                '    -moz-transform: rotate(-90deg);' +
                '    -ms-transform: rotate(-90deg);' +
                '    -o-transform: rotate(-90deg);' +
                '    transform: rotate(-90deg);' +
                '}' +
                '</style>' +
                '<script src="http://code.jquery.com/jquery-1.8.2.min.js"></script>' +
                '<script>'
            );
            file.addFooter('$().ready(function () {' +
                'var getAllClassNames = function() {' +
                'var tmp = {}, ret = [];' +
                'for (var i in depData) {' +
                'for (var j in depData[i].depends) {' +
                'if (tmp[i] === undefined) {' +
                'tmp[i] = {' +
                'dep: 0, reqBy: 0' +
                '};' +
                '}' +
                'if (tmp[j] === undefined) {' +
                'tmp[j] = {' +
                'dep: 0, reqBy: 0' +
                '};' +
                '}' +
                'tmp[i].dep++;' +
                'tmp[j].reqBy++;' +
                '}' +
                '}' +
                'for (i in tmp) {' +
                'ret.push({name: i, dep: tmp[i].dep, reqBy: tmp[i].reqBy});' +
                '}' +
                'return ret.sort(function (val1, val2) {' +
                'return (val1.dep - val1.reqBy) > (val2.dep - val2.reqBy);' +
                '});' +
                '};' +
                'var classNames = getAllClassNames();' +
                'var line, i, j;' +
                'line = \'<tr><td></td><td></td>\';' +
                'for (i = 0; i < classNames.length; i++) {' +
                'line += \'<td class="index" data-idx="\' + i + \'"><div>\' + (i + 1) + \'</div></td>\';' +
                '}' +
                'line += \'</tr>\';' +
                '$(\'table.matrix\').append(line);' +
                'for (i = 0; i < classNames.length; i++) {' +
                'line = \'<tr><td class="name">\' + classNames[i].name + \'</td><td class="index" data-idx="\' + i + \'">' +
                    '\' + (i + 1) + \'</td>\';' +
                'for (j = 0; j < classNames.length; j++) {' +
                'var cssClass = i === j ? \'diag\' : \'\';' +
                'if (depData[classNames[i].name] && depData[classNames[i].name].depends[classNames[j].name]) {' +
                'line += \'<td class="\' + cssClass + \' used">\';' +
                'line += \'1\';' +
                '} else {' +
                'line += \'<td class="\' + cssClass + \' unused">\';' +
                'line += \'&nbsp;\';' +
                '}' +
                'line += \'</td>\';' +
                '}' +
                'line += \'</tr>\';' +
                '$(\'table.matrix\').append(line);' +
                '}' +
                '});' +
                '</script>' +
                '</head>' +
                '<body>' +
                '<table class="matrix"></table>' +
                '</body>' +
                '</html>'
            );
            var dependencies = {};
            var dependenciesAdded = false;
            return {
                dependency: function (from, to, options) {
                    dependenciesAdded = true;
                    if (!dependencies[from]) {
                        dependencies[from] = {depends: {}};
                    }
                    if (!dependencies[from].depends[to]) {
                        dependencies[from].depends[to] = {};
                    }
                    extend(dependencies[from].depends[to], options);
                },
                close: function () {
                    if (dependenciesAdded) {
                        file.print('var depData = ' + JSON.stringify(dependencies) + ';');
                    }
                    file.close();
                }
            };
        }
    },
    event: {
        dot: function (file) {
            file.addHeader('digraph Dependencies {\n');
            file.addHeader('    rankdir=LR\n');
            file.addFooter('}');
            var events = {};
            return {
                emit: function (name, from) {
                    events[name] = true;
                    file.print('    "' + from + '" -> "' + name + '";\n');
                },
                receives: function (name, to) {
                    events[name] = true;
                    file.print('    "' + name + '" -> "' + to + '";\n');
                },
                close: function () {
                    for (var i in events) {
                        file.print('    "' + i + '" [shape=box];\n');
                    }
                    file.close();
                }
            };
        }
    },
    statistics: {
        html: function (file) {
            file.addHeader('<!DOCTYPE html>' +
                '<html>' +
                '<head>' +
                '<style>' +
                '.good {' +
                '    background-color: #0c0;' +
                '}' +
                '.ok {' +
                '    background-color: #0cc;' +
                '}' +
                '.bad {' +
                '    background-color: #c00;' +
                '}' +
                '</style>' +
                '</head>' +
                '<body>');
            file.addFooter('</body>' +
                '</html>'
            );
            var stats = {
                cycComp: 0,
                loc: 0,
                methods: 0,
                classes: 0
            };
            return {
                addCycloComplexity: function (count) {
                    stats.cycComp += count;
                },
                addLinesOfCode: function (count) {
                    stats.loc += count;
                },
                addMethodCount: function (count) {
                    stats.methods += count;
                },
                addClassCount: function (count) {
                    stats.classes += count;
                },
                close: function () {
                    var statsAdded = false;
                    for (var i in stats) {
                        statsAdded = true;
                        break;
                    }
                    if (statsAdded) {
                        var cycPerLoc = (stats.cycComp / stats.loc).toFixed(2);
                        var cycPerLocState = cycPerLoc < 0.16 ? 'good' : cycPerLoc > 0.24 ? 'bad' : 'ok';
                        var locPerMc = (stats.loc / stats.methods).toFixed(2);
                        var locPerMcState = locPerMc < 7 ? 'good' : locPerMc > 13 ? 'bad' : 'ok';
                        var mcPerCc = (stats.methods / stats.classes).toFixed(2);
                        var mcPerCcState = mcPerCc < 4 ? 'good' : mcPerCc > 10 ? 'bad' : 'ok';
                        file.print('<table>' +
                            '<tr>' +
                            '<td>CYC</td>' +
                            '<td>' + stats.cycComp + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td>LOC</td>' +
                            '<td>' + stats.loc + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td>Methods</td>' +
                            '<td>' + stats.methods + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td>Classes</td>' +
                            '<td>' + stats.classes + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td>CYC/LOC</td>' +
                            '<td class="' + cycPerLocState + '">' + cycPerLoc + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td>LOC/Methods</td>' +
                            '<td class="' + locPerMcState + '">' + locPerMc + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td>Methods/Classes</td>' +
                            '<td class="' + mcPerCcState + '">' + mcPerCc + '</td>' +
                            '</tr>' +
                            '</table>'
                        );
                    }
                    file.close();
                }
            }
        }
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