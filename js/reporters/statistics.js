(function () {
    function statsPrinter(file, render) {
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
                    stats.cycPerLoc = (stats.cycComp / stats.loc).toFixed(2);
                    stats.locPerMc = (stats.loc / stats.methods).toFixed(2);
                    stats.mcPerCc = (stats.methods / stats.classes).toFixed(2);
                    file.print(render(stats));
                }
                file.close();
            }
        }
    }

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
            return statsPrinter(file, function (stats) {
                var cycPerLocState = stats.cycPerLoc < 0.16 ? 'good' : stats.cycPerLoc > 0.24 ? 'bad' : 'ok';
                var locPerMcState = stats.locPerMc < 7 ? 'good' : stats.locPerMc > 13 ? 'bad' : 'ok';
                var mcPerCcState = stats.mcPerCc < 4 ? 'good' : stats.mcPerCc > 10 ? 'bad' : 'ok';
                return '<table>' +
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
                    '<td class="' + cycPerLocState + '">' + stats.cycPerLoc + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td>LOC/Methods</td>' +
                    '<td class="' + locPerMcState + '">' + stats.locPerMc + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td>Methods/Classes</td>' +
                    '<td class="' + mcPerCcState + '">' + stats.mcPerCc + '</td>' +
                    '</tr>' +
                    '</table>';
            });
        },
        csv: function (file) {
            file.addHeader('CYC,LOC,Methods,Classes,CYC/LOC,LOC/Methods,Methods/Classes\n');
            return statsPrinter(file, function (stats) {
                return stats.cycComp + ',' +
                    stats.loc + ',' +
                    stats.methods + ',' +
                    stats.classes + ',' +
                    stats.cycPerLoc + ',' +
                    stats.locPerMc + ',' +
                    stats.mcPerCc + '\n';
            });
        }
    };
})();