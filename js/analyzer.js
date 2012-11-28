/*jslint rhino: true */
/*
 Copyright (C) 2012 Daniel Franz <daniel2712@gmail.com>

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

load("steal/rhino/rhino.js");

steal('analyzer/js/config.js', 'analyzer/js/analyze.js', 'analyzer/js/helpers.js').then(function () {
    var processedCLOptions = handleCommandLineArgs(_args);
    if (!processedCLOptions) {
        return;
    }
    var commandLineOpts = processedCLOptions.commandLineOpts;
    var urls = processedCLOptions.urls;

    if (urls.length) {
        options.fileWhitelist.push.apply(options.fileWhitelist, urls);
    } else {
        urls = projectBuildFile;
    }

    options.consoleOutput = commandLineOpts['-i'] || commandLineOpts['-c'];
    options.silent = commandLineOpts['-s'];

    if (options.consoleOutput) {
        var ret;
        options.analyzerOpts.doStatistics = !commandLineOpts['-no-stat'];
        options.analyzerOpts.doDependencies = false;
        options.analyzerOpts.doOpenAjaxEvents = false;
        options.analyzerOpts.doCyclomaticComplexity = !commandLineOpts['-no-cyclo'];

        var myConsole = ioDrivers.openConsole();

        if (!options.silent) {
            myConsole.print('Starting to analyze...');
        }
        do {
            ret = steal.analyze(urls, options);
        } while (
            commandLineOpts['-i'] &&
            (myConsole.print('Any key to re-check, x to exit') || true) &&
            myConsole.read() != 'x' &&
            ret !== false
        );
        if (!options.silent) {
            myConsole.print('Finished');
        }
    } else {
        steal.analyze(urls, options);
    }
});
