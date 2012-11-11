var exports = {};
steal('../js/esprima_analyzer.js', function () {
    module('Esprima analyzer', {
        setup: function () {
            var me = this;
            var mockFile = function (name) {
                me[name] = [];
                return {
                    print: function (text) {
                        me[name].push(text);
                    },
                    close: function () {}
                };
            };

            this.analyzer = new exports.esprima_analyzer({
                analyzerOpts: {
                    cycCompThreshold: 0
                }
            }, {
                depGraph: mockFile('depGraph'),
                checkStyle: mockFile('checkStyle'),
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

    test('analyzeCycComp', function () {
        this.analyzer.parse('function test () {var i = 42;}');
        equal(this.checkStyle[0], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 1" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse('function test () {if (x === 5) {var i = 42;} else {var j = 42;}}');
        equal(this.checkStyle[1], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 3" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse('function test () {var i = (x === 5 ? 42 : 23);}');
        equal(this.checkStyle[2], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 2" source="esprima.complexity" evidence="test"/>\n');

        this.analyzer.parse('function test () {switch (x) {case 1: var j = 2; break; case 2: var j = 3; break; default: j = 1000; break;}}');
        equal(this.checkStyle[3], '    <error line="1" column="9" severity="warning" ' +
            'message="Excessive cyclomatic complexity: 4" source="esprima.complexity" evidence="test"/>\n');
    });
});