(function () {
    function depDataPrinter(file) {
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
    reporters.dependency = {
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
                'line = \'<tr><td class="name">\' + classNames[i].name + \'</td>' +
                    '<td class="index" data-idx="\' + i + \'">\' + (i + 1) + \'</td>\';' +
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
            return depDataPrinter(file);
        },
        htmlD3: function (file) {
            file.addHeader('<!DOCTYPE html><html><head>\n' +
                '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n' +
                '<style>\n' +
                '    body {\n' +
                '    font: 300 36px "Helvetica Neue";\n' +
                '    height: 640px;\n' +
                '    margin: 80px 160px 80px 160px;\n' +
                '    overflow: hidden;\n' +
                '    position: relative;\n' +
                '    width: 960px;\n' +
                '    }\n' +
                '    a:link, a:visited {\n' +
                '    color: #777;\n' +
                '    text-decoration: none;\n' +
                '    }\n' +
                '    a:hover {\n' +
                '    color: #666;\n' +
                '    }\n' +
                '    blockquote {\n' +
                '    margin: 0;\n' +
                '    }\n' +
                '    blockquote:before {\n' +
                '    content: "“";\n' +
                '    position: absolute;\n' +
                '    left: -.4em;\n' +
                '    }\n' +
                '    blockquote:after {\n' +
                '    content: "”";\n' +
                '    position: absolute;\n' +
                '    }\n' +
                '    body > ul {\n' +
                '    margin: 0;\n' +
                '    padding: 0;\n' +
                '    }\n' +
                '    h1 {\n' +
                '    font-size: 64px;\n' +
                '    }\n' +
                '    h1, h2, h3 {\n' +
                '    font-weight: inherit;\n' +
                '    margin: 0;\n' +
                '    }\n' +
                '    h2, h3 {\n' +
                '    text-align: right;\n' +
                '    font-size: inherit;\n' +
                '    position: absolute;\n' +
                '    bottom: 0;\n' +
                '    right: 0;\n' +
                '    }\n' +
                '    h2 {\n' +
                '    font-size: 24px;\n' +
                '    position: absolute;\n' +
                '    }\n' +
                '    h3 {\n' +
                '    bottom: -20px;\n' +
                '    font-size: 18px;\n' +
                '    }\n' +
                '    .invert {\n' +
                '    background: #1f1f1f;\n' +
                '    color: #dcdccc;\n' +
                '    }\n' +
                '    .invert h2, .invert h3 {\n' +
                '    color: #7f9f7f;\n' +
                '    }\n' +
                '    .string, .regexp {\n' +
                '    color: #f39;\n' +
                '    }\n' +
                '    .keyword {\n' +
                '    color: #00c;\n' +
                '    }\n' +
                '    .comment {\n' +
                '    color: #777;\n' +
                '    font-style: oblique;\n' +
                '    }\n' +
                '    .number {\n' +
                '    color: #369;\n' +
                '    }\n' +
                '    .class, .special {\n' +
                '    color: #1181B8;\n' +
                '    }\n' +
                '    body > svg {\n' +
                '    position: absolute;\n' +
                '    top: -80px;\n' +
                '    left: -160px;\n' +
                '    }\n' +
                '    path.arc {\n' +
                  '    fill: #fff;\n' +
                '    }\n' +
                '    .node {\n' +
                  '    font-size: 10px;\n' +
                '    }\n' +
                '    .node:hover {\n' +
                  '    fill: #1f77b4;\n' +
                '    }\n' +
                '    .link {\n' +
                  '    fill: none;\n' +
                  '    stroke: #1f77b4;\n' +
                  '    stroke-opacity: .4;\n' +
                  '    pointer-events: none;\n' +
                '    }\n' +
                '    .link.source, .link.target {\n' +
                  '    stroke-opacity: 1;\n' +
                  '    stroke-width: 2px;\n' +
                '    }\n' +
            '        .node.target {\n' +
            '          fill: #d62728 !important;\n' +
            '        }\n' +
            '        .link.source {\n' +
            '          stroke: #d62728;\n' +
            '        }\n' +
            '        .node.source {\n' +
            '          fill: #2ca02c;\n' +
            '        }\n' +
            '        .link.target {\n' +
            '          stroke: #2ca02c;\n' +
            '        }\n' +
            '    </style>\n' +
            '</head>\n' +
            '<body>\n' +
            '<script src="http://d3js.org/d3.v2.min.js"></script>\n' +
            '<script>'
            );
            file.addFooter('</script>\n' +
        '    <script>var classes = [];\n' +
        '    (function () {\n' +
            '    for (var i in depData) {\n' +
                '    for (var j in depData[i].depends) {\n' +
                    '    if (!(j in depData)) {\n' +
                        '    depData[j] = {depends: {}};\n' +
                    '    }\n' +
                '    }\n' +
            '    }\n' +
            '    for (i in depData) {\n' +
                '    var imports = [];\n' +
                '    for (j in depData[i].depends) {\n' +
                    '    imports.push(j);\n' +
                '    }\n' +
                '    classes.push({\n' +
                    '    name: i,\n' +
                    '    children: [],\n' +
                    '    imports: imports,\n' +
                    '    size: 0\n' +
                '    });\n' +
            '    }\n' +
        '    }());\n' +
        '    </script>\n' +
        '    <script>(function() {\n' +
            '    packages = {\n' +
                '    // Lazily construct the package hierarchy from class names.\n' +
                '    root: function(classes) {\n' +
                    '    var map = {};\n' +
                    '    function find(name, data) {\n' +
                        '    var node = map[name], i;\n' +
                        '    if (!node) {\n' +
                            '    node = map[name] = data || {name: name, children: []};\n' +
                            '    if (name.length) {\n' +
                                '    node.parent = find(name.substring(0, i = name.lastIndexOf(".")));\n' +
                                '    node.parent.children.push(node);\n' +
                                '    node.key = name.replace(/\\./g, "-").replace("$", "dollar");\n' +
                            '    }\n' +
                        '    }\n' +
                        '    return node;\n' +
                    '    }\n' +
                    '    classes.forEach(function(d) {\n' +
                        '    delete d.parent;\n' +
                        '    d.children = [];\n' +
                    '    });\n' +
                    '    classes.forEach(function(d) {\n' +
                        '    find(d.name, d);\n' +
                    '    });\n' +
                    '    return map[""];\n' +
                '    },\n' +
                '    // Return a list of imports for the given array of nodes.\n' +
                '    imports: function(nodes) {\n' +
                    '    var map = {},\n' +
                    '    imports = [];\n' +
                    '    // Compute a map from name to node.\n' +
                    '    nodes.forEach(function(d) {\n' +
                        '    var x = d,\n' +
                            '    name = d.name;\n' +
                        '    while (x = x.parent) {\n' +
                            '    if (x.last) {\n' +
                                '    d = x;\n' +
                            '    }\n' +
                        '    }\n' +
                        '    map[name] = d;\n' +
                    '    });\n' +
                    '    // For each import, construct a link from the source to target node.\n' +
                    '    nodes.forEach(function(d) {\n' +
                        '    if (d.imports) d.imports.forEach(function(i) {\n' +
                            '    if (map[i]) {\n' +
                                '    imports.push({source: map[d.name], target: map[i]});\n' +
                            '    }\n' +
                        '    });\n' +
                    '    });\n' +
                    '    return imports;\n' +
                '    }\n' +
            '    };\n' +
        '    }()); </script>\n' +
        '    <script>\n' +
        '    (function () {\n' +
            '    (function update (nodes) {\n' +
            '    var w = window.innerWidth,\n' +
                '    h = window.innerHeight,\n' +
                '    rx = w / 2,\n' +
                '    ry = h / 2,\n' +
                '    m0,\n' +
                '    rotate = 0;\n' +
            '    var cluster = d3.layout.cluster()\n' +
                '    .size([360, ry - 120])\n' +
                '    .sort(function(a, b) { return d3.ascending(a.key, b.key); });\n' +
            '    var bundle = d3.layout.bundle();\n' +
            '    var line = d3.svg.line.radial()\n' +
                '    .interpolate("bundle")\n' +
                '    .tension(.85)\n' +
                '    .radius(function(d) { return d.y; })\n' +
                '    .angle(function(d) { return d.x / 180 * Math.PI; });\n' +
            '    // Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>\n' +
                '    d3.selectAll("body div").remove();\n' +
            '    var div = d3.select("body").insert("div", "h2")\n' +
                '    .style("top", "-80px")\n' +
                '    .style("left", "-160px")\n' +
                '    .style("width", w + "px")\n' +
                '    .style("height", w + "px")\n' +
                '    .style("position", "absolute");\n' +
            '    var svg = div.append("svg:svg")\n' +
                '    .attr("width", w)\n' +
                '    .attr("height", w)\n' +
                '    .append("svg:g")\n' +
                '    .attr("transform", "translate(" + rx + "," + ry + ")");\n' +
            '    svg.append("svg:path")\n' +
                '    .attr("class", "arc")\n' +
                '    .attr("d", d3.svg.arc().outerRadius(ry - 120)' +
                        '.innerRadius(0).startAngle(0).endAngle(2 * Math.PI));\n' +
            '    nodes = cluster.nodes(packages.root(nodes || classes));\n' +
            '    var links = packages.imports(nodes),\n' +
                '    splines = bundle(links);\n' +
            '    var path = svg.selectAll("path.link")\n' +
                '    .data(links)\n' +
                '    .enter().append("svg:path")\n' +
                '    .attr("class", function(d) { ' +
                        'return "link source-" + d.source.key + " target-" + d.target.key; })\n' +
                '    .attr("d", function(d, i) { return line(splines[i]); });\n' +
            '    svg.selectAll("g.node")\n' +
                '    .data(nodes.filter(function (d) {\n' +
                    '    while (d = d.parent) {\n' +
                        '    if (d.last) {\n' +
                            '    return false;\n' +
                        '    }\n' +
                    '    }\n' +
                    '    return true;\n' +
                '    }))\n' +
                '    .enter().append("svg:g")\n' +
                '    .attr("class", "node")\n' +
                '    .attr("id", function(d) { return "node-" + d.key; })\n' +
                '    .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })\n' +
                '    .append("svg:text")\n' +
                '    .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })\n' +
                '    .attr("dy", ".31em")\n' +
                '    .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })\n' +
                '    .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })\n' +
                '    .text(function(d) { return d.name.substring(d.name.lastIndexOf(".") + 1); })\n' +
                '    .on("mouseover", mouseover)\n' +
                '    .on("mouseout", mouseout)\n' +
                '    .on("click", function (d) {toggle(d); update(nodes);});\n' +
            '    function mouseover(d) {\n' +
                '    svg.selectAll("path.link.target-" + d.key)\n' +
                    '    .classed("target", true)\n' +
                    '    .each(updateNodes("source", true));\n' +
                '    svg.selectAll("path.link.source-" + d.key)\n' +
                    '    .classed("source", true)\n' +
                    '    .each(updateNodes("target", true));\n' +
            '    }\n' +
            '    function mouseout(d) {\n' +
                '    svg.selectAll("path.link.source-" + d.key)\n' +
                    '    .classed("source", false)\n' +
                    '    .each(updateNodes("target", false));\n' +
                '    svg.selectAll("path.link.target-" + d.key)\n' +
                    '    .classed("target", false)\n' +
                    '    .each(updateNodes("source", false));\n' +
            '    }\n' +
            '    function updateNodes(name, value) {\n' +
                '    return function(d) {\n' +
                    '    if (value) {\n' +
                        '    this.parentNode.appendChild(this);\n' +
                    '    }\n' +
                    '    svg.select("#node-" + d[name].key).classed(name, value);\n' +
                '    };\n' +
            '    }\n' +
            '    function toggle(d) {\n' +
                '    d.last = !d.last;\n' +
            '    }\n' +
            '    }());\n' +
        '    }());\n' +
        '    </script>\n' +
        '    </body></html>'
            );
            return depDataPrinter(file);
        }
    };
}());