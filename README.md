# JavaScript Code Analyzer
Tells your continuous integration server everything about your JS-code.

This currently only works with Javascript MVC/DoneJS.

## Features
- Outputs a Checkstyle-compatible file, graphs and HTML
- Shows JSLint-violations
- Analyzes and warns about cyclomatic complexity
- Analyzes and warns about short variable names
- Shows dependencies between objects
- Shows events shared between objects
- Shows global code size metrics
- Works on the command line

## Installation
1. Requirements: Graphviz, JavascriptMVC/DoneJS-project
2. Copy the whole directory into an *analyzer*-directory directly below your JS-root-directory.
3. Configure *js/analyzer.js* to fit your needs and directory structure.
4. Call *bin/analyze* from your continuous integration server.
5. Analyze output:
  - **checkstyle_js.xml**: Checkstyle-compatible
  - **js-dependencies.html**: file containing dependency matrix
  - **js-dependencies.svg**: file containing dependency graph
  - **openajax-events.svg**: file containing graph showing OpenAjax-events
  - **js-statistics.html**: file containing global code size-metrics

## Command line usage
analyzer/bin/analyze <options> <files>

###### Options
- -h for help
- -i for interactive mode (re-check on key-press)
- -c for command-line output

## Credits
- [lastzero](https://github.com/lastzero)'s [liquid jslint](https://github.com/lastzero/jsmvc-extras/tree/master/liquid/jslint) is the piece of software this is derived from.
- [douglascrockford](https://github.com/douglascrockford)'s [JSLint](https://github.com/douglascrockford/JSLint) is used for basic style checking.
- [ariya](https://github.com/ariya)'s [esprima](https://github.com/ariya/esprima) is used for more heavy-weight analysis
- The global code size-thresholds are taken from [pdepend](http://pdepend.org/documentation/handbook/reports/overview-pyramid.html)