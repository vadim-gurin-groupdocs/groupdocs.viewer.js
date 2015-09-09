(function () {
    "use strict";

    if (!window.groupdocs)
        window.groupdocs = {};

    window.groupdocs.stringExtensions = {
        format: function (sourceString) {
            var s = sourceString,
                i = arguments.length;

            while (--i) {
                s = s.replace(new RegExp('\\{' + (i - 1) + '\\}', 'gm'), arguments[i]);
            }
            return s;
        },

        trim: function (string, target) {
            var regex = new RegExp("^[" + target + "]+|[" + target + "]+$", "g");
            return string.replace(regex, '');
        },

        trimStart: function (string, target) {
            var regex = new RegExp("^[" + target + "]+", "g");
            return string.replace(regex, '');
        },

        trimEnd: function (string, target) {
            var regex = new RegExp("[" + target + "]+$", "g");
            return string.replace(regex, '');
        },

        getAccentInsensitiveRegexFromString: function (text) {
            var accents = [
                ["A", 'ÀÁÂÃÄÅÆ'],
                ["C", 'Ç'],
                ["E", 'ÈÉÊËÆ'],
                ["I", 'ÌÍÎÏ'],
                ["N", 'Ñ'],
                ["O", 'ÒÓÔÕÖØ'],
                ["S", 'ß'],
                ["U", 'ÙÚÛÜ'],
                ["Y", 'Ÿ'],
                ["У", 'Ў'], // cyrilllic

                ["a", 'àáâãäåæ'],
                ["c", 'ç'],
                ["e", 'èéêëæ'],
                ["i", 'ìíîï'],
                ["n", 'ñ'],
                ["o", 'òóôõöø'],
                ["s", 'ß'],
                ["u", 'ùúûü'],
                ["y", 'ÿ'],
                ["у", 'ў'] // cyrilllic
            ];

            var charNum;
            var charsToBeReplaced = "";
            for (charNum = 0; charNum < accents.length; charNum++)
                charsToBeReplaced += accents[charNum][0];

            var charsRegex = new RegExp("[" + charsToBeReplaced + "]", "g");

            function makeComp(input) {
                return input.replace(charsRegex, function (c) {
                    var replacementChars = null;
                    for (charNum = 0; charNum < accents.length; charNum++) {
                        if (accents[charNum][0] == c) {
                            replacementChars = accents[charNum][1];
                            break;
                        }
                    }
                    if (replacementChars === null)
                        replacementChars = "";
                    return '[' + c + replacementChars + ']';
                });
            };
            return makeComp(text);
        },

        _padWithLeadingZeros: function (string) {
            return new Array(5 - string.length).join("0") + string;
        },

        _unicodeCharEscape: function (charCode) {
            return "\\u" + this._padWithLeadingZeros(charCode.toString(16));
        },

        unicodeEscape: function (string) {
            var self = this;
            return string.split("")
                         .map(function (character) {
                             var charCode = character.charCodeAt(0);
                             return charCode > 127 ? self._unicodeCharEscape(charCode) : character;
                         })
                         .join("");
        }
    };

})();