steal('../js/esprima_analyzer.js', function () {
    module('Esprima analyzer', {
        setup: function () {
            var me = this;
            var mockFile = function (name) {
                me[name] = [];
                return {
                    addHeader: function () {},
                    addFooter: function () {},
                    read: function () {
                        return '';
                    },
                    print: function (text) {
                        me[name].push(text);
                    },
                    close: function () {}
                };
            };
            this.analyzer = new exports.esprima_analyzer({
                analyzerOpts: {
                    doStatistics: true,
                    doDependencies: true,
                    doOpenAjaxEvents: true,
                    doCyclomaticComplexity: true,
                    cycCompThreshold: 0
                }
            }, {
                depGraph: mockFile('depGraph'),
                checkStyleReporter: reporters.xmlCheckstyle(mockFile('checkStyle')),
                depMatrix: mockFile('depMatrix'),
                eventGraph: mockFile('eventGraph'),
                statistics: mockFile('statistics')
            });
        },
        teardown: function () {
            this.analyzer.destroy();
            this.analyzer = null;
        }
    });

    test('Cyclomatic complexity', function () {
        this.analyzer.parse('function test() {var i = 42;}');
        equal(this.checkStyle[0], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 1" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse('function test() {if (x === 5) {var i = 42;} else {var j = 42;}}');
        equal(this.checkStyle[1], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 3" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse('function test() {var i = (x === 5 ? 42 : 23);}');
        equal(this.checkStyle[2], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 2" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse('function test() {switch (x) {' +
            'case 1: var j = 2; break; case 2: var j = 3; break; default: j = 1000; break;' +
            '}}');
        equal(this.checkStyle[3], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 4" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse(
            'function test() { function test2() {var i = foo ? 42 : 23;} if (foo) {var i = 2;} else {var i = 3;}}'
        );
        equal(this.checkStyle[4], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 3" source="esprima.complexity" evidence="test"/>\n');
        equal(this.checkStyle[5], '    <error line="1" column="27" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 2" source="esprima.complexity" evidence="test2"/>\n');

        this.analyzer.parse(
            'function test() { if (foo) {var i = 2;} else {var i = 3;} function test2() {var i = foo ? 42 : 23;}}'
        );
        equal(this.checkStyle[6], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 3" source="esprima.complexity" evidence="test"/>\n');
        equal(this.checkStyle[7], '    <error line="1" column="67" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 2" source="esprima.complexity" evidence="test2"/>\n');

        equal(this.analyzer.globalCycComp, 20);
    });

    test('Code size metrics', function () {
        this.analyzer.parse(
            'can.construct(\'Test.ClassName\', {\n' +
                'testMethod: function () {\n' +
                    'var i = 2;\n' +
                '}\n' +
            '}, {\n' +
                'testMethod2: function () {\n' +
                    'var i = 3;\n' +
                '}\n' +
            '});'
        );

        equal(this.analyzer.globalLoc, 9);
        equal(this.analyzer.globalMethodCount, 2);
        equal(this.analyzer.globalClassCount, 1);

        this.analyzer.parse(
            'Test.ClassName(\'Test.DerivedClassName\', {\n' +
                'testMethod2: function () {\n' +
                    'return this.testMethod();\n' +
                '}\n' +
            '}, {\n' +
                'testMethod4: function () {\n' +
                    'var i = 4;\n' +
                '},\n' +
                'testMethod5: function () {\n' +
                    'var i = 5;\n' +
                '}\n' +
            '});'
        );

        equal(this.analyzer.globalLoc, 21);
        equal(this.analyzer.globalMethodCount, 5);
        equal(this.analyzer.globalClassCount, 2);
    });

    test('short variables', function () {
        this.analyzer.parse('var i = 0; var p = 2; var x = \'3\';');

        equal(this.checkStyle[0], '    <error line="1" column="15" severity="info" message="Short variable name: p" ' +
            'source="esprima.shortVar" evidence=""/>\n');
        equal(this.checkStyle[1], '    <error line="1" column="26" severity="info" message="Short variable name: x" ' +
            'source="esprima.shortVar" evidence=""/>\n');

        this.analyzer.options.analyzerOpts.shortVarWhitelist = ['x'];
        this.analyzer.parse('var i = 0; var p = 2; var x = \'3\';');
        equal(this.checkStyle[2], '    <error line="1" column="15" severity="info" message="Short variable name: p" ' +
            'source="esprima.shortVar" evidence=""/>\n');
        equal(this.checkStyle[3], undefined);

    });

    test('Dependency analysis', function () {
        this.analyzer.parse(
            'can.construct(\'Test.ClassName\', {\n' +
                'testMethod: function () {\n' +
                    'var i = 2;\n' +
                '}\n' +
            '}, {\n' +
                'testMethod2: function () {\n' +
                    'var i = 3;\n' +
                '}\n' +
            '});'
        );

        // inherited => bold
        equal(this.depGraph[0], '    \"Test.ClassName\" -> \"can.construct\" [style=bold];\n');

        this.analyzer.parse(
            'Test.ClassName(\'Test.DerivedClassName\', {\n' +
                'testMethod2: function () {\n' +
                    'return this.testMethod();\n' +
                '}\n' +
            '}, {\n' +
                'testMethod4: function () {\n' +
                    'var i = 4;\n' +
                '},\n' +
                'testMethod5: function () {\n' +
                    'Test.ClassName.testMethod();\n' +
                '}\n' +
            '});'
        );

        // inherited => bold
        // static call => red
        equal(this.depGraph[1], '    \"Test.DerivedClassName\" -> \"Test.ClassName\" [style=bold,color=red];\n');

        this.analyzer.parse(
            'Test.ClassName(\'Test.SecondDerivedClassName\', {\n' +
                'testProp: Test.DerivedClassName,\n' +
                'testMethod2: function () {\n' +
                    'var testVar = can.control;\n' +
                    'return new can.construct();\n' +
                '}\n' +
            '}, {\n' +
            '});'
        );

        // inherited => bold
        // other (variable, property,...) => no style
        // instantiation => arrowhead odot

        equal(this.depGraph[2], '    \"Test.SecondDerivedClassName\" -> \"Test.ClassName\" [style=bold];\n');
        equal(this.depGraph[3], '    \"Test.SecondDerivedClassName\" -> \"Test.DerivedClassName\" [];\n');
        equal(this.depGraph[4], '    \"Test.SecondDerivedClassName\" -> \"can.control\" [];\n');
        equal(this.depGraph[5], '    \"Test.SecondDerivedClassName\" -> \"can.construct\" [arrowhead=odot];\n');
    });

    test('OpenAjax events', function () {
        this.analyzer.parse(
            'can.control(\'Test.SenderControl\', {\n' +
                'testMethod: function () {\n' +
                    'OpenAjax.hub.publish(\'test.event\', {});\n' +
                '}\n' +
            '}, {\n' +
            '});'
        );

        equal(this.eventGraph[0], '    \"Test.SenderControl\" -> \"test.event\";\n');
        equal(this.eventGraph[1], '    \"test.event\" [shape=box];\n');

        this.analyzer.parse(
            'can.control(\'Test.ReceiverControl\', {\n' +
                'testMethod: function () {\n' +
                '}\n' +
            '}, {\n' +
                '\'test.event subscribe\': function () {\n' +
                    'var i = 3;\n' +
                '}\n' +
            '});'
        );

        equal(this.eventGraph[2], '    \"test.event\" -> \"Test.ReceiverControl\";\n');
        equal(this.eventGraph[3], '    \"test.event\" [shape=box];\n');

        this.analyzer.parse(
            'can.control(\'Test.SecondReceiverControl\', {\n' +
                'testMethod: function () {\n' +
                '}\n' +
            '}, {\n' +
                'init: function () {\n' +
                    'OpenAjax.hub.subscribe(\'test.event\', function () {});\n' +
                '}\n' +
            '});'
        );

        equal(this.eventGraph[4], '    \"test.event\" -> \"Test.SecondReceiverControl\";\n');
        equal(this.eventGraph[5], '    \"test.event\" [shape=box];\n');

    });
});