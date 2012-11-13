/*global extend: true, exports: true */
steal('./esprima.js', './helpers.js', function () {
    var walker = {
        nodeTypes: {},
        callbacks: [],
        publish: function (ast, curDepth) {
            function publishTo(type) {
                if (walker.nodeTypes[type]) {
                    for (var i = 0; i < walker.nodeTypes[type].length; i++) {
                        walker.nodeTypes[type][i](ast, curDepth);
                    }
                }
            }
            publishTo('*');
            publishTo(ast.type);
        },
        subscribe: function (type, func) {
            if (typeof type === 'string') {
                type = [type];
            }
            for (var i = 0; i < type.length; i++) {
                if (!walker.nodeTypes[type[i]]) {
                    walker.nodeTypes[type[i]] = [];
                }
                walker.nodeTypes[type[i]].push(func);
            }
        },
        clear: function () {
            var i;
            for (i = 0; i < walker.callbacks.length; i++) {
                walker.callbacks[i]();
            }
            for (i in walker.nodeTypes) {
                walker.nodeTypes[i] = [];
            }
            walker.callbacks = [];
        }
    },
    traverse = function (ast, func) {
        func(ast, 0);
        (function traverse(ast, curDepth) {
            for (var i in ast) {
                if (ast[i] && typeof ast[i] === 'object') {
                    func(ast[i], curDepth);
                    traverse(ast[i], curDepth + 1);
                }
            }
        }(ast, 1));
    },
    parseMemberExpression = function (ast, everything) {
        var ret = [];
        traverse(ast, function (ast) {
            if (ast.type === 'Identifier' && (everything || ast.name.match(/^[A-Z]/) || ast.name === '$' ||
                ast.name === 'jQuery' || ast.name === 'can' ||
                (ret[0] === 'can' && (ast.name === 'construct' || ast.name === 'control')))
            ) {
                ret.push(ast.name);
            }
        });
        return ret.join('.');
    },
    analyzeCycComp = function (ast, success) {
        var ret = {};
        var last = {};
        var parentStack = [];
        var parentName = null;
        var parentDepth = 0;
        walker.subscribe('*', function (ast, curDepth) {
            if (parentName && parentDepth === curDepth) {
                parentStack.pop();
                var tmp = parentStack[parentStack.length - 1];
                parentName = tmp ? tmp.name : null;
                parentDepth = tmp ? tmp.depth : 0;
            }
        });
        walker.subscribe(['VariableDeclarator', 'Property', 'AssignmentExpression'], function (ast) {
            last[ast.type] = ast;
        });
        walker.subscribe(['FunctionExpression', 'FunctionDeclaration'], function (ast, curDepth) {
            var lastVar = last.VariableDeclarator;
            var lastProp = last.Property;
            var lastAss = last.AssignmentExpression;
            var parent = ast.id ||
                lastVar && lastVar.init === ast && lastVar.id ||
                lastProp && lastProp.value === ast && lastProp.key ||
                lastAss && lastAss.right === ast && {name: parseMemberExpression(lastAss.left, true), loc: lastAss.loc};
            if (parent && parent.name) {
                parentName = parent.name;
                while (ret[parentName]) {
                    parentName = parentName + ' ';
                }
                parentDepth = curDepth;
                parentStack.push({
                    name: parentName,
                    depth: parentDepth
                });
                ret[parentName] = {
                    complexity: 0,
                    line: parent.loc.start.line,
                    column: parent.loc.start.column
                };
            }
        });
        walker.subscribe(['BlockStatement', 'ConditionalExpression'], function (ast) {
            if (parentName) {
                ret[parentName].complexity++;
            }
        });
        walker.subscribe('SwitchStatement', function (ast) {
            if (ast.cases && parentName) {
                ret[parentName].complexity += ast.cases.length;
            }
        });
        walker.callbacks.push(function () {
            success(ret);
        });
    },
    analyzeShortVarNames = function (ast, customWhitelist, success) {
        var ret = [];
        var whitelist = ['i', 'j', 'k', 'l', 'id', 'el', 'ev', '$'].concat(customWhitelist || []);
        function analyze(astItem) {
            var whitelisted = false;
            if (astItem && astItem.name) {
                if (astItem.name.length < 3) {
                    for (var i = 0; i < whitelist.length; i++) {
                        if (astItem.name === whitelist[i]) {
                            whitelisted = true;
                        }
                    }
                    if (!whitelisted) {
                        ret.push({
                            name: astItem.name,
                            line: astItem.loc.start.line,
                            column: astItem.loc.start.column
                        });
                    }
                }
            }
        }

        walker.subscribe('VariableDeclarator', function (ast) {
            analyze(ast.id);
        });
        walker.subscribe(['FunctionExpression', 'FunctionDeclaration'], function (ast) {
            if (ast.params) {
                for (var i = 0; i < ast.params.length; i++) {
                    analyze(ast.params[i]);
                }
            }
        });
        walker.callbacks.push(function () {
            success(ret);
        });
    },
    analyzeLoc = function (ast, success) {
        var loc = ast.loc.end.line;
        var cloc = 0;
        for (var i = 0; i < ast.comments.length; i++) {
            var comment = ast.comments[i];
            cloc += comment.loc.end.line - comment.loc.start.line + 1;
        }
        success({
            loc: loc,
            cloc: cloc
        });
    },
    countMethods = function (ast, success) {
        var ret = 0;

        walker.subscribe(['FunctionExpression'], function (ast) {
            ret++;
        });

        walker.callbacks.push(function () {
            success(ret);
        });
    },
    getClassName = function (ast) {
        return '' + ast['arguments'][0].value;
    },
    isClassName = function (ast) {
        if (ast['arguments'][0] && ast['arguments'][0].type === 'Literal' && ast['arguments'][1] &&
            ast['arguments'][1].type === 'ObjectExpression'
        ) {
            var candidate = getClassName(ast);
            return candidate.match(/^[A-Z]/) && candidate.match(/\./);
        }
        return false;
    },
    analyzeClassName = function (ast, success) {
        var ret;
        walker.subscribe('CallExpression', function (ast) {
            if (!ret && isClassName(ast)) {
                ret = getClassName(ast);
            }
        });
        walker.callbacks.push(function () {
            success(ret);
        });
    },
    analyzeDepMatrix = function (ast, success) {
        var className, tmp, inherit;
        var ret = {};

        walker.subscribe('CallExpression', function (ast) {
            if (!className && isClassName(ast)) {
                className = getClassName(ast);
                ret[className] = {
                    depends: {}
                };
                inherit = true;
            }
            if (className) {
                tmp = parseMemberExpression({ast: ast.callee});
                if (tmp && tmp !== '$') {
                    ret[className].depends[tmp] = ret[className].depends[tmp] || {};
                    if (inherit) {
                        ret[className].depends[tmp].inherit = true;
                        inherit = false;
                    } else {
                        ret[className].depends[tmp].stat = true;
                    }
                }
            }
        });
        walker.subscribe('NewExpression', function (ast) {
            if (className) {
                tmp = parseMemberExpression({ast: ast.callee});
                if (tmp && tmp !== '$') {
                    ret[className].depends[tmp] = ret[className].depends[tmp] || {};
                    ret[className].depends[tmp].instanciate = true;
                }
            }
        });
        walker.subscribe('VariableDeclarator', function (ast) {
            if (className && ast.init && ast.init.type === 'MemberExpression') {
                tmp = parseMemberExpression({ast: ast.init});
                if (tmp && tmp !== '$') {
                    ret[className].depends[tmp] = ret[className].depends[tmp] || {};
                    ret[className].depends[tmp].other = true;
                }
            }
        });
        walker.subscribe('Property', function (ast) {
            if (className && ast.value && ast.value.type === 'MemberExpression') {
                tmp = parseMemberExpression({ast: ast.value});
                if (tmp && tmp !== '$') {
                    ret[className].depends[tmp] = ret[className].depends[tmp] || {};
                    ret[className].depends[tmp].other = true;
                }
            }
        });
        walker.callbacks.push(function () {
            success(ret);
        });
    },
    analyzeOpenAjaxEvents = function (ast, success) {
        var ret = {}, className;

        walker.subscribe('CallExpression', function (ast) {
            if (!className && isClassName(ast)) {
                className = getClassName(ast);
                ret[className] = {
                    emits: {},
                    receives: {}
                };
            } else if (className) {
                var tmp = parseMemberExpression({ast: ast.callee});
                if (tmp && tmp === 'OpenAjax' && ast.callee.property.name === 'publish') {
                    ret[className].emits[ast['arguments'][0].value] = true;
                }
                if (tmp && tmp === 'OpenAjax' && ast.callee.property.name === 'subscribe') {
                    ret[className].receives[ast['arguments'][0].value] = true;
                }
            }
        });
        walker.subscribe('Property', function (ast) {
            if (className) {
                var key = '' + ast.key.value;
                if (key.substr(-9) === 'subscribe') {
                    ret[className].receives[key.substr(0, key.length - 10)] = true;
                }
            }
        });
        walker.callbacks.push(function () {
            success(ret);
        });
    };
    var esprima_analyzer = function (options, files) {
        this.globalDepStat = {};
        this.globalLoc = 0;
        this.globalCycComp = 0;
        this.globalMethodCount = 0;
        this.globalClassCount = 0;

        this.options = options;
        this.depFile = files.depGraph;
        this.checkStyleReporter = files.checkStyleReporter;
        this.depMatrix = files.depMatrix;
        this.eventFile = files.eventGraph;
        this.statsFile = files.statistics;
        this.depFile.addHeader('digraph Dependencies {\n');
        this.depFile.addHeader('    rankdir=LR\n');
        this.eventFile.addHeader('digraph Dependencies {\n');
        this.eventFile.addHeader('    rankdir=LR\n');
    };

    esprima_analyzer.prototype.parse = function (out) {
        var me = this;
        var ast = exports.parse(out, {loc: true, comment: true});

        if (this.options.analyzerOpts.doCyclomaticComplexity) {
            analyzeCycComp(ast, function (cycStat) {
                var i;
                for (i in cycStat) {
                    if (cycStat[i]) {
                        me.globalCycComp += cycStat[i].complexity;
                        if (cycStat[i].complexity > me.options.analyzerOpts.cycCompThreshold) {
                            me.checkStyleReporter.error({
                                line: cycStat[i].line,
                                column: cycStat[i].column,
                                severity: 'warning',
                                message: 'Excessive cyclomatic complexity: ' + cycStat[i].complexity,
                                source: 'esprima.complexity',
                                evidence: i
                            });
                        }
                    }
                }
            });
        }

        analyzeLoc(ast, function (locStat) {
            me.globalLoc += locStat.loc;
        });

        countMethods(ast, function (count) {
            me.globalMethodCount += count;
        });

        analyzeClassName(ast, function (name) {
            if (name) {
                me.globalClassCount++;
            }
        });

        analyzeShortVarNames(ast, this.options.analyzerOpts.shortVarWhitelist, function (shortVarStat) {
            var i;
            for (i = 0; i < shortVarStat.length; i++) {
                if (shortVarStat[i]) {
                    me.checkStyleReporter.error({
                        line: shortVarStat[i].line,
                        column: shortVarStat[i].column,
                        severity: 'info',
                        message: 'Short variable name: ' + shortVarStat[i].name,
                        source: 'esprima.shortVar'
                    });
                }
            }
        });

        if (this.options.analyzerOpts.doOpenAjaxEvents) {
            analyzeDepMatrix(ast, function (depStat) {
                var i, j;
                extend(me.globalDepStat, depStat);

                for (i in depStat) {
                    for (j in depStat[i].depends) {
                        var style = [];
                        if (depStat[i].depends[j].inherit) {
                            style.push('style=bold');
                        }
                        if (depStat[i].depends[j].instanciate) {
                            style.push('arrowhead=odot');
                        }
                        if (depStat[i].depends[j].stat) {
                            style.push('color=red');
                        }
                        me.depFile.print(
                            '    "' + i + '" -> "' + j + '" [' + style.join(',') + '];\n'
                        );
                    }
                }
            });
        }
        if (this.options.analyzerOpts.doOpenAjaxEvents) {
            analyzeOpenAjaxEvents(ast, function (eventStat) {
                var i, j;
                var eventList = {};

                for (i in eventStat) {
                    for (j in eventStat[i].emits) {
                        me.eventFile.print('    "' + i + '" -> "' + j + '";\n');
                        eventList[j] = true;
                    }
                    for (j in eventStat[i].receives) {
                        me.eventFile.print('    "' + j + '" -> "' + i + '";\n');
                        eventList[j] = true;
                    }
                }
                for (i in eventList) {
                    me.eventFile.print('    "' + i + '" [shape=box];\n');
                }
            });
        }

        traverse(ast, function (ast, curDepth) {
            walker.publish(ast, curDepth);
        });

        walker.clear();
    };
    esprima_analyzer.prototype.destroy = function () {
        this.depMatrix.addHeader('<!DOCTYPE html>' +
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
            '<script>' +
            '');
        if (this.options.analyzerOpts.doDependencies) {
            this.depMatrix.print('var depData = ' + JSON.stringify(this.globalDepStat) + ';');
        }
        this.depMatrix.addFooter('$().ready(function () {' +
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
            '</html>');
        this.depMatrix.close();

        this.depFile.addFooter('}');
        this.depFile.close();

        this.eventFile.addFooter('}');
        this.eventFile.close();


        var cycPerLoc = (this.globalCycComp / this.globalLoc).toFixed(2);
        var cycPerLocState = cycPerLoc < 0.16 ? 'good' : cycPerLoc > 0.24 ? 'bad' : 'ok';
        var locPerMc = (this.globalLoc / this.globalMethodCount).toFixed(2);
        var locPerMcState = locPerMc < 7 ? 'good' : locPerMc > 13 ? 'bad' : 'ok';
        var mcPerCc = (this.globalMethodCount / this.globalClassCount).toFixed(2);
        var mcPerCcState = mcPerCc < 4 ? 'good' : mcPerCc > 10 ? 'bad' : 'ok';

        this.statsFile.addHeader('<!DOCTYPE html>' +
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

        if (this.options.analyzerOpts.doStatistics) {
            this.statsFile.print('<table>' +
                '<tr>' +
                '<td>CYC</td>' +
                '<td>' + this.globalCycComp + '</td>' +
                '</tr>' +
                '<tr>' +
                '<td>LOC</td>' +
                '<td>' + this.globalLoc + '</td>' +
                '</tr>' +
                '<tr>' +
                '<td>Methods</td>' +
                '<td>' + this.globalMethodCount + '</td>' +
                '</tr>' +
                '<tr>' +
                '<td>Classes</td>' +
                '<td>' + this.globalClassCount + '</td>' +
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
                '</table>');
        }
        this.statsFile.addFooter('</body>' +
            '</html>'
        );
        this.statsFile.close();
    };

    exports.esprima_analyzer = esprima_analyzer;
});