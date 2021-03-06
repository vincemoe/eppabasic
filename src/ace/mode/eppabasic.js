define(function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var WorkerClient = require("../worker/worker_client").WorkerClient;

    var Range = require("../range").Range;

    // Eppabasic compiler parts
    var Lexer = require('compiler/lexer');
    var Toolchain = require('compiler/toolchain');
    var Compiler = require('compiler/compiler');
    var VariableScopeList = require('compiler/variablescopelist');
    var i18n = require('i18n');

    function CustomTokenizer() {
        this.lexer = new Lexer('', true);
        this.toolchain = new Toolchain();

        this.tokenTypes = {
            'comment': 'comment',
            'number': 'constant.numeric',
            'string': 'string',
            'lt': 'keyword.operator',
            'lte': 'keyword.operator',
            'gt': 'keyword.operator',
            'gte': 'keyword.operator',
            'eq': 'keyword.operator',
            'neq': 'keyword.operator',
            'and': 'keyword.operator',
            'or': 'keyword.operator',
            'xor': 'keyword.operator',
            'not': 'keyword.operator',
            'plus': 'keyword.operator',
            'minus': 'keyword.operator',
            'mul': 'keyword.operator',
            'div': 'keyword.operator',
            'idiv': 'keyword.operator',
            'pow': 'keyword.operator',
            'mod': 'keyword.operator',
            'concat': 'keyword.operator',
            'comma': 'punctuation.operator',
            'lparen': 'paren.lparen',
            'rparen': 'paren.rparen',

            // For loops
            'for': 'keyword.control',
            'to': 'keyword.control',
            'step': 'keyword.control',
            'next': 'keyword.control',

            // Do loops
            'do': 'keyword.control',
            'loop': 'keyword.control',
            'until': 'keyword.control',
            'while': 'keyword.control',

            // If statements
            'if': 'keyword.control',
            'then': 'keyword.control',
            'elseif': 'keyword.control',
            'else': 'keyword.control',
            'endif': 'keyword.control',

            // Variable declarations
            'dim': 'keyword.other',
            'as': 'keyword.other',

            // Function declarations
            'function': 'keyword.other',
            'return': 'keyword.control',
            'endfunction': 'keyword.other',

            // Subprogram declarations
            'sub': 'keyword.other',
            'endsub': 'keyword.other',

            // Arrays
            'lbracket': 'paren.lparen',
            'rbracket': 'paren.rparen',
        };
        this.specialIdentifiers = {
            //// Types
            'integer': 'support.type',
            'double': 'support.type',
            'number': 'support.type',
            'string': 'support.type',
        };
        var compiler = this.toolchain.getCompiler();
        compiler.functions.forEach(function (f) {
            this.specialIdentifiers[f.name.toLowerCase()] = 'support.function';
        }.bind(this));
        require('compiler/constants')(this.toolchain.types).forEach(function(c) {
            this.specialIdentifiers[c.name.toLowerCase()] = 'support.constant';
        }.bind(this));
        this.indentEffect = {
            'for': 1,
            'next': -1,

            'do': 1,
            'loop': -1,

            'if': 1,
            'endif': -1,

            'function': 1,
            'endfunction': -1,

            'sub': 1,
            'endsub': -1
        };
    }

    CustomTokenizer.prototype = {
        getIndent: function (line, state) {
            var tokens = [];
            this.lexer.input = line;

            var total = 0;

            do {
                var token = this.lexer.next();

                if (this.indentEffect[token.type] !== undefined) {
                    total += this.indentEffect[token.type];
                }
            } while (token.type != 'eos' && token !== null);

            return total;
        },

        getLineTokens: function (line, state, row) {
            var parser = this.toolchain.getParser(line);

            try {
                parser.parse();
            } catch (e) {
                console.log(e);
            }

            var lexer = parser.lexer;

            while (lexer.peek() && lexer.peek().type !== 'eos') {
                lexer.advance();
            }

            var allTokens = lexer.allTokens;

            var tokens = [];

            allTokens.forEach(function (token) {
                if (token.code !== undefined) {
                    var type = this.tokenTypes[token.type];

                    if (token.type == 'identifier') {
                        type = this.specialIdentifiers[token.val.toLowerCase()];

                        if (type === 'support.function' && token.identifierType && token.identifierType !== 'function name') {
                            type = null;
                        }

                        if (type === 'support.type' && token.identifierType && token.identifierType !== 'type') {
                            type = null;
                        }
                    }

                    tokens.push({ type: type || '', value: token.code });
                }
            }.bind(this));

            return {
                tokens: tokens,
                state: ''
            };
        }
    }

    var Mode = function () {
        this.getTokenizer = function () {
            if (!this.$tokenizer) {
                this.$tokenizer = new CustomTokenizer();
            }
            return this.$tokenizer;
        };

        this.getNextLineIndent = function (state, line, tab) {
            var tokenizer = this.getTokenizer();

            var addition = '';
            if (tokenizer.getIndent(line, state) > 0) {
                addition = tab;
            }

            return this.$getIndent(line) + addition;
        };

        this.checkOutdent = function (line, input) {
            return true;
        };

        this.autoOutdent = function (state, doc, row) {
            if (row == 0) {
                return;
            }

            var tokenizer = this.getTokenizer();

            var line = doc.getLine(row);
            var lastLine = doc.getLine(row - 1);
            var indent = this.$getIndent(line);

            if (tokenizer.getIndent(line, state) < 0) {
                var newIndent = this.$getIndent(lastLine);

                if (tokenizer.getIndent(lastLine, 'start') <= 0) {
                    newIndent = newIndent.substr(4);
                }

                doc.replace(new Range(row, 0, row, indent.length), newIndent);
            }
        };

        /*this.createWorker = function(session) {
            var worker = new WorkerClient(["ace"], "ace/mode/eppabasic_worker", "EppaBasicWorker");
            worker.attachToDocument(session.getDocument());

            worker.on("errors", function(results) {
                session.setAnnotations(results.data);
            });

            worker.on("terminate", function() {
                session.clearAnnotations();
            });

            return worker;
        };*/
    };
    oop.inherits(Mode, TextMode);

    (function () {

        this.createWorker = function (session) {
            var worker = new WorkerClient(['ace'], 'ace/mode/eppabasic_worker', 'EppaBasicWorker');
            worker.attachToDocument(session.getDocument());

            worker.on('parsed', function (res) {
                var errors = res.data[0];
                var warnings = res.data[1];
                var variableScopes = res.data[2] && new VariableScopeList(res.data[2]);

                if (variableScopes)
                    this.variableScopes = variableScopes;

                session.clearAnnotations();
                if (errors.length !== 0 || warnings.length !== 0) {
                    this.showErrors(session, errors, warnings);
                }
            }.bind(this));
            worker.on('internalerror', function (res) {
                console.error(res.data[0]);         // TODO Handle compiler internal errors
            }.bind(this));

            return worker;
        }

        this.showErrors = function showErrors(session, errors, warnings) {
            var annotations = [];

            errors.forEach(function (e) {
                annotations.push({
                    row: e.line - 1,
                    text: i18n.t(e.msg, e.data),
                    type: 'error'
                })
            });
            warnings.forEach(function (w) {
                annotations.push({
                    row: w.line - 1,
                    text: i18n.t(w.msg, w.data),
                    type: 'warning'
                })
            });

            session.setAnnotations(annotations);
        };
    }).call(Mode.prototype);

    exports.Mode = Mode;
});
