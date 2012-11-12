steal('../js/jslint_analyzer.js', function () {
    module('JSLint analyzer', {
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

            this.analyzer = new exports.jsLint_analyzer({
                jsLintOpts: {
                    devel: true,
                    eqeqeq: false,
                    forin: true,
                    browser: true,
                    windows: false,
                    rhino: false,
                    onevar: false,
                    immed: true,
                    undef: true,
                    nomen: false,
                    plusplus: false,
                    es5: false,
                    maxlen: 120,
                    indent: 4,
                    newcap: false,
                    css: true,
                    white: true,
                    predef: [
                        'window', 'jQuery', 'steal', '$', 'can'
                    ]
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

    test('Extra comma', function () {
        var input = 'var test = {prop: 12, };';
        this.analyzer.parse(input);
        equal(this.checkStyle[0], '    <error line="1" column="21" severity="error" message="Extra comma.' +
            '" source="JSlint.Error" evidence="' + input + '"/>\n');
    });

    test('Unused variable', function () {
        var input = 'var test = {\n' +
            '    test: function () {\n' +
            '        var x = 12;\n' +
            '    }\n' +
            '};';
        this.analyzer.parse(input);
        equal(this.checkStyle[0], '    <error line="2" column="0" severity="info" message="Unused variable: x' +
            '" source="JSlint.Unused"/>\n');
    });
});
