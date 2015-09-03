if (!window.groupdocs)
    window.groupdocs = {};

window.groupdocs.Pdf2JavaScriptWrapper = function (options) {
    this.options = $.extend(true, {},
			this.options,
			options);
    this.init();
};
$.extend(window.groupdocs.Pdf2JavaScriptWrapper.prototype, {
    documentDescription: null,
    options: {
    },
    init: function () {
        this.documentDescription = JSON.parse(this.options.documentDescription);
    },

    initWithOptions: function (options) {
        this.options = options;
        this.init();
    },

    getPageCount: function () {
        if (this.documentDescription.pages)
            return this.documentDescription.pages.length;
        else if (typeof this.documentDescription.pageCount != "undefined")
            return this.documentDescription.pageCount;
        else
            return 0;
    },

    getPageSize: function () {
        var width = this.documentDescription.widthForMaxHeight;
        var height = this.documentDescription.maxPageHeight;
        if (typeof width === "undefined" || typeof height === "undefined") {
            if (this.documentDescription.pages) {
                var page = this.documentDescription.pages[0];
                width = page.w;
                height = page.h;
            }
            else
                width = height = null;
        }
        return { width: width, height: height };
    },

    getContentControls: function () {
        return this.documentDescription.contentControls;
    },

    getBookmarks: function () {
        return this.documentDescription.bookmarks;
    },

    getPages: function (prop, pagesLocation, startPage0, endPage0, synchronousWorkOuter) {
        if (!this.documentDescription.pages)
            return null;
        var pages0 = [];
        var totalChars = 0;

        var pageCount = this.documentDescription.pages.length;
        if (pageCount > 0 && pagesLocation.length < pageCount
            && pagesLocation.length < endPage0 - startPage0 + 1) // document destroyed while initializing
            return null;
        var stepLength = 100;
        var numberOfSteps = Math.ceil(pageCount / stepLength);
        var currentImageWidth = prop * this.documentDescription.widthForMaxHeight;

        var step0 = 0;
        var executeStep = function (pages, step, scale, startPage, endPage, synchronousWork) {
            var mustBreak = false;
            for (var index = step * stepLength; index < pageCount && index < (step + 1) * stepLength; index++) {
                var page = this.documentDescription.pages[index];
                var ploc;
                if (typeof startPage !== "undefined") {
                    if (index < startPage)
                        continue;
                    if (index > endPage) {
                        mustBreak = true;
                        break;
                    }
                    ploc = pagesLocation[index - startPage];
                }
                else
                    ploc = pagesLocation[index];
                var pageId = page.number;

                scale = currentImageWidth / page.w;

                var pageRotation = page.rotation;
                if (typeof pageRotation == "undefined")
                    pageRotation = 0;
                var pageWidth = page.w;
                var pageHeight = page.h;

                if (pageRotation % 180 != 0) {
                    scale *= pageWidth / pageHeight;
                }
                var pageRows = this.getRows(page, pageId, scale, totalChars, ploc);

                //if (pageRows.length) {
                //    var lastRowWords = pageRows[pageRows.length - 1].words;
                //    if (lastRowWords.length) {
                //        var lastWord = lastRowWords[lastRowWords.length - 1];
                //        totalChars = (lastWord.position + lastWord.text.length);
                //    }
                //}

                var right = ploc.x + pageWidth * scale;
                var bottom = ploc.y + pageHeight * scale;

                switch (pageRotation) {
                    case 90:
                    case 270:
                        right = ploc.x + pageHeight * scale;;
                        bottom = ploc.y + pageWidth * scale;
                        break;
                }

                pages.push({
                    pageId: pageId,
                    rows: pageRows,
                    rect: new groupdocs.Rect(ploc.x, ploc.y, right, bottom),
                    originalWidth: pageWidth,
                    rotation: page.rotation
                });
            }
            if (synchronousWork)
                return mustBreak;
            step++;
            if (step < numberOfSteps && !mustBreak)
                window.setTimeout(function () {
                    executeStep(pages, step, scale, startPage, endPage);
                }, 10);
        } .bind(this);

        if (synchronousWorkOuter || this.options.synchronousWork) {
            for (var i = 0; i < numberOfSteps; i++) {
                if (executeStep(pages0, i, prop, startPage0, endPage0, true))
                    break;
            }
        }
        else {
            window.setTimeout(function () {
                executeStep(pages0, step0, prop, startPage0, endPage0);
            }, 10);
        }

        return pages0;
    },

    getRows: function (page, pageId, scale, totalChars, ploc) {
        var pageRotation = page.rotation;
        var pageWidth = page.w;
        var pageHeight = page.h;
        
        var rows = [];

        if (page.rows) {
            for (var index = 0; index < page.rows.length; index++) {
                var row = page.rows[index];
                var rowWords = this.getWords(row, pageId, scale, totalChars, ploc, pageRotation, pageWidth, pageHeight);
                var rowChars = this.getChars(row, pageId, scale, totalChars, ploc, pageRotation, pageWidth, pageHeight);

                var rotatedCoords = this.getRotatedtextCoordinates(pageRotation, pageWidth, pageHeight,
                                                              row.l, row.t, row.w, row.h);

                var rowLeft = rotatedCoords.left;
                var rowTop = rotatedCoords.top;
                var rowWidth = rotatedCoords.width;
                var rowHeight = rotatedCoords.height;

                var scaledX = rowLeft * scale,
                    scaledY = rowTop * scale,
                    left = scaledX + ploc.x,
                    top = scaledY + ploc.y,
                    width = rowWidth * scale,
                    height = rowHeight * scale;

                rows.push({
                    text: row.s,
                    words: rowWords,
                    chars: rowChars,
                    pageLocation: ploc,
                    originalRect: new groupdocs.Rect(rowLeft, rowTop, rowLeft + rowWidth, rowTop + rowHeight),
                    rect: new groupdocs.Rect(left, top, left + width, top + height)
                });
            }
        }
        return rows;
    },

    getWords: function (row, pageId, scale, totalChars, ploc, pageRotation, pageWidth, pageHeight) {
        var children = [];
        var words_x = [];
        var words_w = [];
        var words = row.s.split(' ');

        words_x = $.map(
            row.c, // {left, width} array
            function (val, index) {
                if (index % 2 == 0)
                    return val;
                else
                    words_w.push(val);
            }
        );
        for (var i = 0; i < words_x.length; i++) {
            var rotatedCoords = this.getRotatedtextCoordinates(pageRotation, pageWidth, pageHeight,
                                                              words_x[i], row.t, words_w[i], row.h);

            var wordLeft = rotatedCoords.left;
            var wordTop = rotatedCoords.top;
            var wordWidth = rotatedCoords.width;
            var wordHeight = rotatedCoords.height;

            var scaledX = Math.round(wordLeft * scale),
                scaledY = Math.round(wordTop * scale),
                left = scaledX + ploc.x,
                top = scaledY + ploc.y,
                width = Math.round(wordWidth * scale),
                height = Math.round(wordHeight * scale);


            children.push({
                text: words[i],
                pageLocation: ploc,
                originalRect: new groupdocs.Rect(wordLeft, wordTop, wordLeft + wordWidth, wordTop + wordHeight),
                rect: new groupdocs.Rect(left, top, left + width, top + height)
            });
        }

        return children;
    },

    getChars: function (row, pageId, scale, totalChars, ploc, pageRotation, pageWidth, pageHeight) {
        var children = [];
        var chars_x = [];
        var chars_w = [];
        var isLastWordCharFlags = [];

        var wordsLine = row.s.replace(/\s+/g, '');

        if (row.ch) {

            var spaceCount = 1;

            for (var j = 0; j < row.ch.length; j++) {

                if (row.s.charAt(j + spaceCount) == ' ') {
                    spaceCount++;
                    isLastWordCharFlags.push(true);
                }
                else if (j != (row.ch.length - 1)) {
                    isLastWordCharFlags.push(false);
                }

                chars_x.push(row.ch[j]);

                if (j < (row.ch.length - 1)) {
                    chars_w.push(row.ch[j + 1] - row.ch[j]);

                }
                else if (j == (row.ch.length - 1)) {
                    isLastWordCharFlags.push(true);
                    chars_w.push(row.w - row.ch[j]);
                }
            }

            for (var i = 0; i < chars_x.length; i++) {

                var rotatedCoords = this.getRotatedtextCoordinates(pageRotation, pageWidth, pageHeight,
                                                              chars_x[i], row.t, chars_w[i], row.h);

                var charLeft = rotatedCoords.left;
                var charTop = rotatedCoords.top;
                var charWidth = rotatedCoords.width;
                var charHeight = rotatedCoords.height;

                var scaledX = Math.round(charLeft * scale),
                   scaledY = Math.round(charTop * scale),
                   left = scaledX + ploc.x,
                   top = scaledY + ploc.y,
                   width = Math.round(charWidth * scale),
                   height = Math.round(charHeight * scale);

                children.push({
                    text: wordsLine.charAt(i),
                    isLastWordChar: isLastWordCharFlags[i],
                    pageLocation: ploc,
                    originalRect: new groupdocs.Rect(charLeft, charTop, charLeft + charWidth, charTop + charHeight),
                    rect: new groupdocs.Rect(left, top, left + width, top + height)
                });
            }
        }
        return children;
    },

    getRowCharacterCoordinates: function (pageNumber, rowNumber) {
        var coordinates = this.documentDescription.pages[pageNumber].rows[rowNumber].ch;
        return coordinates;
    },

    reorderPage: function (oldPosition, newPosition) {
        var pages = this.documentDescription.pages;
        var page = pages[oldPosition];
        pages.splice(oldPosition, 1);
        pages.splice(newPosition, 0, page);
    },

    getRotatedtextCoordinates: function (pageRotation, pageWidth, pageHeight,
                                         textLeft, textTop, textWidth, textHeight) {
        var resultLeft = textLeft, resultTop = textTop,
            resultWidth = textWidth, resultHeight = textHeight;

        switch (pageRotation) {
            case 90:
                resultLeft = pageHeight - textTop - textHeight;
                resultTop = textLeft;
                resultWidth = textHeight;
                resultHeight = textWidth;
                break;

            case 180:
                resultLeft = pageWidth - textLeft - textWidth;
                resultTop = pageHeight - textTop - textHeight;
                resultWidth = textWidth;
                resultHeight = textHeight;
                break;

            case 270:
                resultLeft = textTop;
                resultTop = pageWidth - textLeft - textWidth;
                resultWidth = textHeight;
                resultHeight = textWidth;
                break;
        }
        return { left: resultLeft, top: resultTop, width: resultWidth, height: resultHeight };
    }
});


