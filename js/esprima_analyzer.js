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
        var cont = true;
        traverse(ast, function (ast) {
            if (cont && ast.type === 'Identifier') {
                if (everything || ast.name.match(/^[A-Z]/) || ast.name === '$' || ast.name === 'jQuery' ||
                    ast.name === 'can' || (ret[0] === 'can' && (ast.name === 'construct' || ast.name === 'control'))
                ) {
                    ret.push(ast.name);
                } else {
                    cont = false;
                }
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
                for (var i = 0; i < ast['arguments'].length; i++) {
                    if (ast['arguments'][i].type === 'MemberExpression') {
                        tmp = parseMemberExpression({ast: ast['arguments'][i]});
                        if (tmp && tmp !== '$') {
                            ret[className].depends[tmp] = ret[className].depends[tmp] || {};
                            ret[className].depends[tmp].other = true;
                        }
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
        this.options = options;
        this.dependencyReporter = files.dependencyReporter;
        this.checkStyleReporter = files.checkStyleReporter;
        this.eventReporter = files.eventReporter;
        this.statisticsReporter = files.statisticsReporter;
    };

    esprima_analyzer.prototype.parse = function (out) {
        var me = this;
        var ast = exports.parse(out, {loc: true, comment: true});

        analyzeCycComp(ast, function (cycStat) {
            var i;
            for (i in cycStat) {
                if (cycStat[i]) {
                    if (me.options.analyzerOpts.doStatistics) {
                        me.statisticsReporter.addCycloComplexity(cycStat[i].complexity);
                    }
                    if (me.options.analyzerOpts.doCyclomaticComplexity &&
                        cycStat[i].complexity > me.options.analyzerOpts.cycCompThreshold
                    ) {
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

        if (me.options.analyzerOpts.doStatistics) {
            analyzeLoc(ast, function (locStat) {
                me.statisticsReporter.addLinesOfCode(locStat.loc);
            });

            countMethods(ast, function (count) {
                me.statisticsReporter.addMethodCount(count);
            });

            analyzeClassName(ast, function (name) {
                if (name) {
                    me.statisticsReporter.addClassCount(1);
                }
            });
        }

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

        if (this.options.analyzerOpts.doDependencies) {
            analyzeDepMatrix(ast, function (depStat) {
                var i, j;

                for (i in depStat) {
                    for (j in depStat[i].depends) {
                        me.dependencyReporter.dependency(i, j, depStat[i].depends[j]);
                    }
                }
            });
        }
        if (this.options.analyzerOpts.doOpenAjaxEvents) {
            analyzeOpenAjaxEvents(ast, function (eventStat) {
                var i, j;

                for (i in eventStat) {
                    for (j in eventStat[i].emits) {
                        me.eventReporter.emit(j, i);
                    }
                    for (j in eventStat[i].receives) {
                        me.eventReporter.receives(j, i);
                    }
                }
            });
        }

        traverse(ast, function (ast, curDepth) {
            walker.publish(ast, curDepth);
        });

        walker.clear();
    };
    esprima_analyzer.prototype.destroy = function () {
    };

    exports.esprima_analyzer = esprima_analyzer;
});