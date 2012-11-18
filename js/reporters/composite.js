reporters.composite = function (deps) {
    var reporter = {};
    var getReporterFunc = function (name) {
        return function () {
            for (var i = 0; i < deps.length; i++) {
                if (deps[i][name]) {
                    deps[i][name].apply(deps[i][name], arguments);
                }
            }
        };
    };
    for (var i = 0; i < deps.length; i++) {
        for (var j in deps[i]) {
            if (!reporter[j]) {
                reporter[j] = getReporterFunc(j);
            }
        }
    }
    return reporter;
};