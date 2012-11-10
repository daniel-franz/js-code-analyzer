# JavaScript Code Analyzer
Tells your continuous integration server everything about your JS-code.

This currently only works with Javascript MVC/DoneJS.

## Features
- Outputs a Checkstyle-compatible file, graphs and HTML
- Shows JSLint-violations
- Analyzes and warns about cyclomatic complexity
- Analyzes and warns about short variable names
- Shows dependencies between objects
- Show events shared between objects


## Installation
1. Requirements: Graphviz, JavascriptMVC/DoneJS-project
2. Copy the whole directory into an *analyzer*-directory directly below your JS-root-directory.
3. Configure *js/analyzer.js* to fit your needs and directory structure.
4. Call *bin/analyze* from your continuous integration server.
5. Analyze output:
  - **checkstyle_js.xml**: Checkstyle-compatible
  - **js-dependencies.html**: HTML-file containing dependency matrix
  - **js-dependencies.svg**: SVG-file containing dependency graph
  - **openajax-events.svg**: SVG-file containing graph showing OpenAjax-events

## Credits
- [lastzero](https://github.com/lastzero)'s [liquid jslint](https://github.com/lastzero/jsmvc-extras/tree/master/liquid/jslint) is the piece of software this is derived from.
- [douglascrockford](https://github.com/douglascrockford)'s [JSLint](https://github.com/douglascrockford/JSLint) is used for basic style checking.
- [ariya](https://github.com/ariya)'s [esprima](https://github.com/ariya/esprima) is used for more heavy-weight analysis
