reporters.event = {
    dot: function (file) {
        file.addHeader('digraph Events {\n');
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
};