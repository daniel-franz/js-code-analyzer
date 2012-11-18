reporters.statistics = {
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
                    if (stats[i]) {
                        statsAdded = true;
                        break;
                    }
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
    },
    csv: function (file) {
        file.addHeader('CYC,LOC,Methods,Classes,CYC/LOC,LOC/Methods,Methods/Classes\n');
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
                    if (stats[i]) {
                        statsAdded = true;
                        break;
                    }
                }
                if (statsAdded) {
                    var cycPerLoc = (stats.cycComp / stats.loc).toFixed(2);
                    var locPerMc = (stats.loc / stats.methods).toFixed(2);
                    var mcPerCc = (stats.methods / stats.classes).toFixed(2);
                    file.print(stats.cycComp + ',' +
                        stats.loc + ',' +
                        stats.methods + ',' +
                        stats.classes + ',' +
                        cycPerLoc + ',' +
                        locPerMc + ',' +
                        mcPerCc + '\n'
                    );
                }
                file.close();
            }
        }
    }
};