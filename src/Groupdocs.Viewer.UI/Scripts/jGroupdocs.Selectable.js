﻿(function ($, undefined) {
    "use strict";

    $.groupdocsWidget("groupdocsSelectable", {
        search: null,
        lasso: null,
        pages: [],
        searchProportions: 1,
        highlightSearchPaneContainer: null,
        template: "<div id={0} class='highlight selection-highlight' style='top: {1}px; height: {2}px; width: {3}px; left: {4}px;'></div>",
        searchTemplate: "<div id={0} class='highlight search-highlight' style='top: {1}px; height: {2}px; width: {3}px; left: {4}px;'></div>",
        options: {
            appendTo: "body",
            txtarea: "",
            pdf2XmlWrapper: null,
            startNumbers: null,
            pagesCount: 0,
            proportion: 1,
            cancel: ':input,option,.comment',
            bookLayout: false,
            docSpace: '',
            highlightColor: null
        },

        _initialized: false,
        _textSelectionByCharModeEnabled: false,
        _canvasOffset: null,
        _canvasScroll: null,
        _mouseStartPos: null,
        SelectionModes: { SelectText: 0, SelectRectangle: 1, SelectTextToStrikeout: 2, ClickPoint: 3, TrackMouseMovement: 4, DoNothing: 5 },
        _mode: null,
        _lassoCssElement: null,
        parentElement: null,
        selectionCounter: 0,

        _create: function () {
            this._initialized = false;
            this.initCanvasOffset();

            if (!this.options.initializeStorageOnly) {
                this.dragged = false;

                if (this.options.preventTouchEventsBubbling) {
                    var preventEventBubble = function (event) {
                        event.preventBubble();
                    }

                    this.element.bind({
                        touchstart: preventEventBubble,
                        touchmove: preventEventBubble,
                        touchend: preventEventBubble
                    });
                }

                this._mouseInit();
                this.helper = $("<div class='ui-selectable-helper'></div>");
                this.createEventHandlers();
                this.setMode(this.SelectionModes.SelectText);
                this.pagePrefix = this.options.pagePrefix;
            }
            this.search = [];
        },

        createEventHandlers: function () {
            var self = this;
            //$.ctrl('C', function () {
            $(document).keydown(function(e) {
                if (e.keyCode == 67 && e.ctrlKey) {
                    var activeElement = $(document.activeElement);
                    var activeElementId = activeElement.attr('id');
                    var activeElementName = activeElement.attr('name');
                    if ((activeElementId !== self.options.txtarea.attr('id') || activeElementName !== self.options.txtarea.attr('name'))
                        && (activeElement.is("input") || activeElement.is("textarea")))
                        return;
                    self.options.txtarea.focus().select();
                }
            });

            $(self.element).bind({
                click: function (e) {
                    return self.mouseClickHandler(e);
                }
            });
        },

        _init: function () {
            this._initialized = false;
            if (this.options.pdf2XmlWrapper == null)
                return;

            this.initStorage();
            this._initialized = false;
        },

        destroy: function () {
            this._mouseDestroy();
            return this;
        },

        initStorage: function () {
            if (this._initialized)
                return;

            this._initialized = true;

            this.pageLocations = this._getPageLocations();
            var locations = this.pageLocations;

            if (this.options.pdf2XmlWrapper != null) {
                if (this.options.bookLayout) {
                    this.pages = this.options.pdf2XmlWrapper.getPages(this.options.proportion, locations,
                        this.options.startNumbers.start - 1, this.options.startNumbers.end - 1, this.options.useVirtualScrolling);
                }
                else {
                    this.pages = this.options.pdf2XmlWrapper.getPages(this.options.proportion, locations, 0, this.options.pagesCount - 1);
                }
            }
        },

        initCanvasOffset: function () {
            this.parentElement = this.options.docSpace.parent();
            var offset = this.options.docSpace.offset();
            var offsetX, offsetY = this.parentElement.offset().top;
            if (this.options.bookLayout)
                offsetX = offset.left;
            else
                offsetX = this.options.documentSpaceLeft;
            this._canvasOffset = new groupdocs.Point(offsetX, offsetY);
        },

        _mouseInit: function() {
            var that = this;
            var domElement = this.element.get(0);
            this.document = $(domElement.style ?
				// element within the document
				domElement.ownerDocument :
				// element is window or document
				domElement.document || domElement);

            this.element
                .bind("mousedown." + this.widgetName, function(event) {
                    return that._mouseDown(event);
                })
                .bind("click." + this.widgetName, function(event) {
                    if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
                        $.removeData(event.target, that.widgetName + ".preventClickEvent");
                        event.stopImmediatePropagation();
                        return false;
                    }
                });

            this.started = false;
        },

        _mouseDestroy: function() {
            this.element.unbind("." + this.widgetName);
            if (this._mouseMoveDelegate) {
                this.document
                    .unbind("mousemove." + this.widgetName, this._mouseMoveDelegate)
                    .unbind("mouseup." + this.widgetName, this._mouseUpDelegate);
            }
        },

        _mouseDown: function(event) {
            this._mouseMoved = false;

            // we may have missed mouseup (out of window)
            (this._mouseStarted && this._mouseUp(event));

            this._mouseDownEvent = event;

            var that = this,
                btnIsLeft = (event.which === 1),
                // event.target.nodeName works around a bug in IE 8 with
                // disabled inputs (#7620)
                elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
            if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
                return true;
            }
            
            // Click event may never have fired (Gecko & Opera)
            if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
                $.removeData(event.target, this.widgetName + ".preventClickEvent");
            }

            // these delegates are required to keep context
            this._mouseMoveDelegate = function(event) {
                return that._mouseMove(event);
            };
            this._mouseUpDelegate = function(event) {
                return that._mouseUp(event);
            };

            this.document
                .bind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
                .bind( "mouseup." + this.widgetName, this._mouseUpDelegate );

            event.preventDefault();
            return true;
        },

        _mouseMove: function(event) {
            // Only check for mouseups outside the document if you've moved inside the document
            // at least once. This prevents the firing of mouseup in the case of IE<9, which will
            // fire a mousemove event if content is placed under the cursor. See #7778
            // Support: IE <9
            if (this._mouseMoved) {
                // IE mouseup check - mouseup happened when mouse was out of window
                if ($.browser.msie && (!document.documentMode || document.documentMode < 9) && !event.button) {
                    return this._mouseUp(event);

                    // Iframe mouseup check - mouseup occurred in another document
                } else if (!event.which) {
                    return this._mouseUp(event);
                }
            }

            if (event.which || event.button) {
                this._mouseMoved = true;
            }

            if (this._mouseStarted) {
                this._mouseDrag(event);
                return event.preventDefault();
            }

            this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
            (this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));

            return !this._mouseStarted;
        },

        _mouseUp: function(event) {
            this.document
                .unbind("mousemove." + this.widgetName, this._mouseMoveDelegate)
                .unbind("mouseup." + this.widgetName, this._mouseUpDelegate);

            if (this._mouseStarted) {
                this._mouseStarted = false;

                if (event.target === this._mouseDownEvent.target) {
                    $.data(event.target, this.widgetName + ".preventClickEvent", true);
                }

                this._mouseStop(event);
            }
            return false;
        },

        getPages: function () {
            this.initStorage();
            return this.pages;
        },

        _getPageLocations: function () {
            var pageLocations = null;
            if (!this.options.bookLayout) {
                pageLocations = $.map(this.options.pageLocations,
                        function(page) {
                            return new groupdocs.Point(page.left, page.top());
                        });
                return pageLocations;
            }

            var self = this;
            var docSpaceId = this.options.docSpace.attr("id");
            var imagesSelector = ".page-image";
            var images = this.element.find(imagesSelector);
            if (this.options.bookLayout) {
                images = images.filter("[id='" + docSpaceId + "-img-" + this.options.startNumbers.start.toString() +
                    "'],[id='" + docSpaceId + "-img-" + this.options.startNumbers.end.toString() + "']");
            }

            this._canvasScroll = this.getCanvasScroll();
            pageLocations = $.map(images, function(img) {
                var imgJquery = $(img);
                var x = imgJquery.offset().left - self._canvasOffset.x + self._canvasScroll.x;
                var y = (self.options.bookLayout ? 0 : (imgJquery.offset().top - self.element.offset().top));
                return new groupdocs.Point(x, y);
            });
            
            return pageLocations;
        },

        getCanvasScroll: function () {
            if (this.options.bookLayout)
                return new groupdocs.Point(this.parentElement.scrollLeft(), this.parentElement.scrollTop());
            else
                return new groupdocs.Point(this.element.parent().scrollLeft(), this.element.parent().scrollTop());
        },

        clearSelection: function () {
            this.element.find(".selection-highlight:not(.static)").remove();
        },

        clearSelectionOnPage: function (pageNumber) {
            this.element.find("#" + this.pagePrefix + (pageNumber + 1) + " > .highlight-pane > .selection-highlight:not(.static)").remove();
        },

        _mouseCapture: function (event) {
            this._canvasScroll = this.getCanvasScroll();
            this._mouseStartPos = new groupdocs.Point(
                event.pageX - this._canvasOffset.x + this._canvasScroll.x,
                event.pageY - this._canvasOffset.y + this._canvasScroll.y);

            return (this._mode != this.SelectionModes.DoNothing &&
                this._findPageAt(this._mouseStartPos) != null)
        },

        _mouseStart: function (event) {
            this.setFocus();
            this.initStorage();
            this.clearSelection();

            if (this._mode == this.SelectionModes.DoNothing) {
                return false;
            }
            this.selectionCounter++;

            //this._canvasScroll = new groupdocs.Point(this.parentElement.scrollLeft(), this.parentElement.scrollTop());
            this._canvasScroll = this.getCanvasScroll();
            if (this.options.bookLayout)
                this._canvasScroll.y += this.parentElement.parent().scrollTop();

            if (this.checkMouseIsInEdgeInBookMode(this._mouseStartPos.x, this._mouseStartPos.y))
                return false;

            this.element.append(this.helper);
            this.helper.css({
                "left": this._mouseStartPos.x,
                "top": this._mouseStartPos.y,
                "width": 0,
                "height": 0
            });

            this.options.txtarea.val("");
            this.lasso = new groupdocs.Rect();
        },

        _mouseDrag: function (event) {
            if (this._mode == this.SelectionModes.DoNothing || this.checkMouseIsInEdgeInBookMode(this._mouseStartPos.x, this._mouseStartPos.y))
                return false;

            var x1 = this._mouseStartPos.x, y1 = this._mouseStartPos.y,
                x2 = event.pageX - this._canvasOffset.x + this._canvasScroll.x,
                y2 = event.pageY - this._canvasOffset.y + this._canvasScroll.y;
            var currentX = x2,
                currentY = y2;

            if (!this._findPageAt(new groupdocs.Point(currentX, currentY)))
                return false;

            this.dragged = true;

            if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
            if (y1 > y2) { var tmp = y2; y2 = y1; y1 = tmp; }

            this.lasso.set(x1, y1, x2, y2);
            this.helper.css({ left: x1, top: y1, width: this.lasso.width(), height: this.lasso.height() });
            this.findSelectedPages(false, null, undefined, this.options.highlightColor);
            this.element.trigger("onMouseDrag", [{ left: currentX, top: currentY}]);
            return false;
        },

        _mouseStop: function (event) {
            if (this._mode == this.SelectionModes.DoNothing)
                return false;

            this.helper.remove();

            var page = this._findPageAt(this.lasso.topLeft) || this.pages[0];
            if (typeof (page) === "undefined") return false;

            var pageOffset;
            var pageNumber = parseInt(page.pageId) - 1;
            var originalRects = null;

            if (pageNumber < 0) return false;

            if (this._mode == this.SelectionModes.SelectText) {
                if (!this.dragged) {
                    return false;
                }

                var self = this;
                this.dragged = false;

                var rects = self._getDocumentHighlightRects();
                if (!rects || rects.length == 0) {
                    return false;
                }

                var text = '';
                var bounds = (this.options.storeAnnotationCoordinatesRelativeToPages ?
                    this.convertRectToRelativeToPageUnscaledCoordinates(this.lasso) :
                    this.convertRectToAbsoluteCoordinates(this.lasso));

                var top = bounds.top(), bottom = bounds.bottom();
                bounds = rects[0].originalRect;

                var left = bounds.left(), right = bounds.right();
                var highestTop = bounds.top();
                var lowestBottom = bounds.bottom();
                var pos = rects[0].position, len = rects[rects.length - 1].position + rects[rects.length - 1].length - pos;
                originalRects = [];

                for (var i = 0; i < rects.length; i++) {
                    text += rects[i].text;
                    text += ((i > 0 && (rects[i - 1].page != rects[i].page || rects[i - 1].row != rects[i].row)) ? '\r\n' : ' ');

                    bounds = rects[i].originalRect;
                    originalRects.push(bounds);

                    left = Math.min(left, bounds.left());
                    right = Math.max(right, bounds.right());
                    highestTop = Math.min(highestTop, bounds.top());
                    lowestBottom = Math.max(lowestBottom, bounds.bottom());
                }

                top = Math.min(highestTop, top);
                bottom = Math.max(lowestBottom, bottom);
                this.options.txtarea.val($.trim(text));
            }

            return false;
        },

        mouseClickHandler: function (event) {
            this.setFocus();
            return true;
        },

        setFocus: function () {
            if (this.options.bookLayout)
                this.parentElement.focus();
            else
                this.options.docSpace.focus();
        },

        checkMouseIsInEdgeInBookMode: function (mouseX, mouseY) {
            var elementWidth = this.element.width();
            var elementHeight = this.element.height();
            var edgeWidth = 100, edgeHeight = 100;
            if (this.options.bookLayout &&
                    ((mouseX > elementWidth - edgeWidth && mouseY < edgeHeight) ||
                    (mouseX > elementWidth - edgeWidth && mouseY > elementHeight - edgeHeight) ||
                    (mouseX < edgeWidth && mouseY < edgeHeight) ||
                    (mouseX < edgeWidth && mouseY > elementHeight - edgeHeight)
                    ))
                return true;
            else
                return false;

        },

        convertRectToAbsoluteCoordinates: function (rect, position) {
            this.initStorage();

            var selectedRectangle = rect.clone();
            var scale = this.options.proportion;
            var page = null;
            if (position)
                page = this._findPageNearby(position);
            else
                page = this._findPageNearby(selectedRectangle.topLeft);
            selectedRectangle.subtract(page.rect.topLeft);

            var pageNumber = parseInt(page.pageId) - 1;
            var pageOffset = pageNumber * this.options.pageHeight;
            pageOffset /= scale;
            selectedRectangle.scale(1 / scale);
            selectedRectangle.add(new groupdocs.Point(0, pageOffset));
            return selectedRectangle;
        },

        convertRectToScreenCoordinates: function (rect) {
            this.initStorage();

            var bounds = rect.clone().scale(this.options.proportion);
            if (bounds.top() < 0)
                bounds.setTop(0);

            var pageHeight = this.options.pageHeight;
            var pageNumber = Math.floor(bounds.top() / pageHeight);
            bounds.subtract(new groupdocs.Point(0, pageNumber * pageHeight));
            if (this.pages.length != 0)
				bounds.add(this.pages[pageNumber].rect.topLeft);
            return bounds;
        },

        convertRectToRelativeToPageUnscaledCoordinates: function (rect, position) {
            this.initStorage();

            var sourceRectangle = rect.clone();
            var scale = this.options.proportion;
            var page = null;
            if (position)
                page = this._findPageNearby(position);
            else
                page = this._findPageNearby(sourceRectangle.topLeft);
            sourceRectangle.subtract(page.rect.topLeft);
            sourceRectangle.scale(1 / scale);
            return sourceRectangle;
        },

        convertPageAndRectToScreenCoordinates: function (pageNumber, rect) {
            this.initStorage();

            var bounds = rect.clone().scale(this.options.proportion);
            if (bounds.top() < 0)
                bounds.setTop(0);
            if (this.pages.length != 0)
                bounds.add(this.pages[pageNumber].rect.topLeft);
            return bounds;
        },

        setVisiblePagesNumbers: function (vPagesNumbers) {
            this.options.startNumbers = vPagesNumbers;
        },

        initHighlightSearchPaneContainer: function () {
            var containers = this._getElementsByClassName('search-pane', document.getElementById(this.options.docSpace.attr('id') + '-pages-container'));
            var len = containers.length;
            for (var i = len; i--; )
                if (containers[i].children.length != 0)
                    containers[i].innerHTML = '';
            this.highlightSearchPaneContainer = containers;
        },

        reInitPages: function (scaleFactor, visiblePagesNumbers, scrollPosition, pageHeight, pagesCount, pageLocations, documentSpaceLeft) {
            this._initialized = false;

            this.options.startNumbers = visiblePagesNumbers;
            this.options.proportion = scaleFactor;
            this.options.pageHeight = pageHeight;
            this.options.pageLocations = pageLocations;
            this.options.pagesCount = pagesCount;
            this.options.documentSpaceLeft = documentSpaceLeft;

            this.initCanvasOffset();
            this.initStorage();
        },

        changeSelectedRowsStyle: function (proportions) {
            this.changeSearchStyle(proportions);

            var highlights = this.element.find('.highlight-pane .highlight');
            var scale = proportions / this.options.proportion;
            this.options.proportion = proportions;

            $.each(highlights, function () {
                var pos = $(this).position();
                $(this).css({ top: pos.top * scale,
                    left: pos.left * scale,
                    width: $(this).width() * scale,
                    height: $(this).height() * scale
                });
            });
        },

        performSearch: function (originalSearchValue, zoomValue, isCaseSensitive,
                                 searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch) {
            var searchValue;
            var phraseIsInDoubleQuotes = false;
            if (isCaseSensitive)
                searchValue = originalSearchValue;
            else
                searchValue = originalSearchValue.toLowerCase();

            if (searchForSeparateWords && treatPhrasesInDoubleQuotesAsExact) {
                var trimmedText = searchValue.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");
                if (trimmedText.length >= 2 && trimmedText[0] == '"' && trimmedText[trimmedText.length - 1] == '"') {
                    searchForSeparateWords = false;
                    searchValue = trimmedText.substr(1, trimmedText.length - 2);
                    searchValue = searchValue.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");
                    phraseIsInDoubleQuotes = true;
                }
            }

            this.search.length = 0;
            this.initHighlightSearchPaneContainer();
            if (searchValue == '')
                return -1;
            this.searchProportions = zoomValue;
            var pages = this.pages;
            var pagesLen = pages.length;
            var pageWords = [], pageWordsUnscaled = [];
            var searchWords = [];
            var searchWordsLen;
            var seachCountItem = 0;
            var startingCharacterInWordNum;
            var searchValueWithAccentedWords;

            if (useAccentInsensitiveSearch) {
                searchValueWithAccentedWords = new RegExp(window.groupdocs.stringExtensions.getAccentInsensitiveRegexFromString(searchValue));
            }
            var r;

            for (var pageId = 0; pageId < pagesLen; pageId++) {
                var rows = pages[pageId].rows;
                var rowsLen = rows.length;
                var PageId = pageId + 1;
                var rowWords, rowWordsLen;

                for (var rowId = 0; rowId < rowsLen; rowId++) {
                    var left = 0, right = 0;
                    var row = rows[rowId];
                    var rowText;
                    if (isCaseSensitive)
                        rowText = row.text;
                    else
                        rowText = row.text.toLowerCase();

                    if (searchForSeparateWords) {
                        searchWords = this.getWords(searchValue);

                        if (useAccentInsensitiveSearch) {
                            var wordsWithAccentedChars = new Array();
                            for (var wordNum = 0; wordNum < words.length; wordNum++) {
                                wordsWithAccentedChars.push(
                                    new RegExp(window.groupdocs.stringExtensions.getAccentInsensitiveRegexFromString(searchWords[wordNum])));
                            }
                            searchWords = wordsWithAccentedChars;
                        }

                        searchWordsLen = searchWords.length;
                        if (searchWordsLen == 0)
                            break;
                        rowWords = row.words;
                        rowWordsLen = rowWords.length;

                        var rowWordIndex, searchWordIndex;
                        for (rowWordIndex = 0; rowWordIndex < rowWordsLen; rowWordIndex++) {
                            for (searchWordIndex = 0; searchWordIndex < searchWordsLen; searchWordIndex++) {
                                var searchWord = $.trim(searchWords[searchWordIndex]);
                                var rowWord = rowWords[rowWordIndex].text;
                                if (!isCaseSensitive) {
                                    searchWord = searchWord.toLowerCase();
                                    rowWord = rowWord.toLowerCase();
                                }
                                startingCharacterInWordNum = rowWord.indexOf(searchWord);
                                if (startingCharacterInWordNum != -1) {
                                    var characterCoordinates = this.options.pdf2XmlWrapper.getRowCharacterCoordinates(pageId, rowId);
                                    var firstWordLeft = rowWords[rowWordIndex].originalRect.left();

                                    var firstWordStartPosition = 0;
                                    for (var charNum = 0; charNum < characterCoordinates.length; charNum++) {
                                        var characterCoordinate = characterCoordinates[charNum];
                                        if (Math.round(characterCoordinate) >= Math.round(firstWordLeft)) {
                                            firstWordStartPosition = charNum;
                                            break;
                                        }
                                    }

                                    var searchStartPosition = firstWordStartPosition + startingCharacterInWordNum;
                                    if (searchStartPosition < characterCoordinates.length) {
                                        left = characterCoordinates[searchStartPosition];
                                    }
                                    else
                                        left = firstWordLeft;
                                    if (left < firstWordLeft || left > wordRight)
                                        left = firstWordLeft;

                                    searchEndPosition = searchStartPosition + searchWord.length;
                                    if (searchEndPosition >= characterCoordinates.length)
                                        right = row.originalRect.right();
                                    else
                                        right = characterCoordinates[searchEndPosition];

                                    r = rowWords[rowWordIndex].rect.clone();
                                    r.subtract(rowWords[rowWordIndex].pageLocation);
                                    var scale = this.options.proportion;
                                    var scaledLeft = left * scale;
                                    var scaledRight = right * scale;
                                    r.setLeft(scaledLeft);
                                    r.setRight(scaledRight);
                                    pageWords.push(r);

                                    r = rowWords[rowWordIndex].originalRect.clone();
                                    r.setLeft(left);
                                    r.setRight(right);
                                    pageWordsUnscaled.push(r);
                                }
                            }
                        }
                    }
                    else {
                        var currentImageWidth = this.options.proportion * this.options.pdf2XmlWrapper.getPageSize().width;

                        var textPosition;
                        if (useAccentInsensitiveSearch)
                            textPosition = rowText.search(searchValueWithAccentedWords);
                        else
                            textPosition = rowText.indexOf(searchValue);
                        while (textPosition != -1) {
                            rowWords = row.words;
                            if (this.options.searchPartialWords) {
                                var spaceCountRegex = /\s/g;
                                var containingSubstring = rowText.substring(0, textPosition);
                                var initialWords = containingSubstring.match(spaceCountRegex);
                                var overlappedWords = searchValue.match(spaceCountRegex);
                                var firstWordNumber = 0, overlappedWordCount = 0;
                                if (initialWords)
                                    firstWordNumber = initialWords.length;
                                if (overlappedWords)
                                    overlappedWordCount = overlappedWords.length;
                                var lastWordNumber = firstWordNumber + overlappedWordCount;
                                var characterCoordinates = this.options.pdf2XmlWrapper.getRowCharacterCoordinates(pageId, rowId);
                                var firstWordLeft = rowWords[firstWordNumber].originalRect.left();
                                var lastWordLeft = rowWords[lastWordNumber].originalRect.left();

                                var wordRight = rowWords[lastWordNumber].originalRect.right();
                                //var wordLength = words[firstWordNumber].text.length;
                                var rowRight = row.originalRect.right();

                                startingCharacterInWordNum = containingSubstring.length - containingSubstring.lastIndexOf(" ") - 1;
                                var firstWordStartPosition = 0, lastWordStartPosition = 0;

                                var foundFirstWordStartPosition = false;
                                for (var charNum = 0; charNum < characterCoordinates.length; charNum++) {
                                    var characterCoordinate = characterCoordinates[charNum];
                                    if (!foundFirstWordStartPosition && Math.round(characterCoordinate) >= Math.round(firstWordLeft)) {
                                        firstWordStartPosition = charNum;
                                        foundFirstWordStartPosition = true;
                                    }
                                    if (Math.round(characterCoordinate) >= Math.round(lastWordLeft)) {
                                        lastWordStartPosition = charNum;
                                        break;
                                    }
                                }

                                var searchStartPosition = firstWordStartPosition + startingCharacterInWordNum;
                                if (searchStartPosition < characterCoordinates.length) {
                                    left = characterCoordinates[searchStartPosition];
                                }
                                else
                                    left = firstWordLeft;
                                if (left < firstWordLeft || left > wordRight)
                                    left = firstWordLeft;

                                //var searchEndPosition = searchStartPosition + searchValue.length;
                                var lastSpacePosition = searchValue.lastIndexOf(" ");
                                var lastWordOfSearchPhrase = searchValue.substring(lastSpacePosition + 1, searchValue.length);
                                var searchEndPosition;
                                if (firstWordNumber == lastWordNumber)
                                    searchEndPosition = searchStartPosition + searchValue.length;
                                else
                                    searchEndPosition = lastWordStartPosition + lastWordOfSearchPhrase.length;
                                var lastWordMatches = true;
                                if (searchEndPosition < characterCoordinates.length) {
                                    var lastWordText = rowWords[lastWordNumber].text.toLowerCase();
                                    //if (startingCharacterInWordNum + searchValue.length == wordLength)
                                    if (lastWordText.substring(lastWordText.length - lastWordOfSearchPhrase.length, lastWordText.length) == lastWordOfSearchPhrase)
                                        right = wordRight;
                                    else {
                                        right = characterCoordinates[searchEndPosition];
                                        lastWordMatches = false;
                                    }
                                }
                                else
                                    right = rowRight;
                                if (right < left)
                                    right = rowRight;

                                if (!treatPhrasesInDoubleQuotesAsExact || !phraseIsInDoubleQuotes || lastWordMatches) {
                                    r = rowWords[firstWordNumber].rect.clone();
                                    r.subtract(rowWords[firstWordNumber].pageLocation);
                                    var scale = currentImageWidth / pages[pageId].originalWidth;
                                    var scaledLeft = left * scale;
                                    var scaledRight = right * scale;
                                    r.setLeft(scaledLeft);
                                    r.setRight(scaledRight);
                                    pageWords.push(r);

                                    r = rowWords[firstWordNumber].originalRect.clone();
                                    r.setLeft(left);
                                    r.setRight(right);
                                    pageWordsUnscaled.push(r);
                                }
                                textPosition = rowText.indexOf(searchValue, textPosition + searchValue.length);
                            }
                        }
                    }
                }

                if (pageWords.length > 0) {
                    this.search.push({ PageId: PageId, pageWords: pageWords.slice(0),
                        pageWordsUnscaled: pageWordsUnscaled.slice(0)
                    });
                    seachCountItem += pageWords.length;
                    pageWords.length = 0;
                    pageWordsUnscaled.length = 0;
                }
            }

            this.highlightSearch(null, null);
            return seachCountItem;
        },

        getWords: function (phrase) {
            var words = $.map(phrase.split(' '),
                function (val, index) {
                    if (val != '') {
                        return val;
                    }
                });
            return words;
        },

        highlightSearch: function (startPage, endPage) {
            if (!this.search)
                return;
            var data = this.search;
            this.initHighlightSearchPaneContainer();
            for (var i = 0; i < data.length; i++) {
                var pageId = data[i].PageId;
                if (startPage === null || endPage === null ||
                     (pageId - 1 >= startPage && pageId - 1 <= endPage)) {
                    var pageWords = data[i].pageWords;
                    for (var j = 0; j < pageWords.length; j++) {
                        var highlightElement = window.groupdocs.stringExtensions.format(this.searchTemplate, this.pagePrefix + pageId + "-search-highlight-" + j, pageWords[j].top(), pageWords[j].height(), pageWords[j].width(), pageWords[j].left());
                        $('#' + this.pagePrefix + pageId + ' div.search-pane').append(highlightElement);
                    }
                }
            }
        },

        changeSearchStyle: function (proportions) {
            if (this.options.useVirtualScrolling || this.search.length == 0)
                return;
            this.initHighlightSearchPaneContainer();

            var search = this.search;
            var dif = 0;
            var len = search.length;
            var searchProportions = this.searchProportions;
            var containers = this.highlightSearchPaneContainer;
            for (var pageIndex = 0; pageIndex < len; pageIndex++) {
                var result = '';
                var pageId = search[pageIndex].PageId;
                var pageWords = search[pageIndex].pageWords;
                var pageWordsLen = pageWords.length;
                for (var wordIndex = 0; wordIndex < pageWordsLen; wordIndex++) {
                    var w = Math.round(Math.round(pageWords[wordIndex].width() / searchProportions) * proportions);
                    var h = Math.round(Math.round(pageWords[wordIndex].height() / searchProportions) * proportions);
                    var t = Math.round(Math.round(pageWords[wordIndex].top() / searchProportions) * proportions);
                    var l = Math.round(((pageWords[wordIndex].left() - dif) / searchProportions) * proportions + dif);

                    var searchElement = window.groupdocs.stringExtensions.format(this.searchTemplate, this.pagePrefix + pageId + "-search-highlight-" + wordIndex, t, h, w, l);
                    result += searchElement;
                }
                containers[pageId - 1].innerHTML = result;
            }
        },

        recalculateSearchPositions: function (proportions) {
            if (!this.options.useVirtualScrolling || this.search.length == 0)
                return;
            this.initHighlightSearchPaneContainer();

            var search = this.search;
            var len = search.length;
            for (var pageIndex = 0; pageIndex < len; pageIndex++) {
                var searchPage = search[pageIndex];
                var pageWordsUnscaled = searchPage.pageWordsUnscaled;
                var pageWordsLen = pageWordsUnscaled.length;
                var w, h, t, l;
                for (var wordIndex = 0; wordIndex < pageWordsLen; wordIndex++) {
                    l = Math.round(pageWordsUnscaled[wordIndex].left() * proportions);
                    w = Math.round(pageWordsUnscaled[wordIndex].width() * proportions);
                    t = Math.round(pageWordsUnscaled[wordIndex].top() * proportions);
                    h = Math.round(pageWordsUnscaled[wordIndex].height() * proportions);
                    searchPage.pageWords[wordIndex].set(l, t, l + w, t + h);
                }
            }
        },

        _getElementsByClassName: function (classname, node) {
            if (!node) node = document.getElementsByTagName("body")[0];
            var a = [];
            var re = new RegExp('\\b' + classname + '\\b');
            var els = node.getElementsByTagName("*");
            for (var i = 0, j = els.length; i < j; i++)
                if (re.test(els[i].className)) a.push(els[i]);
            return a;
        },
        
        findSelectedPages: function (isStatic, clickHandler, selectionCounter, color, hoverHandlers) {
            if (this._mode != this.SelectionModes.SelectText && this._mode != this.SelectionModes.SelectTextToStrikeout) {
                return;
            }

            if (typeof selectionCounter == "undefined")
                selectionCounter = this.selectionCounter;
            var rects = this._getDocumentHighlightRects(selectionCounter);
            if (!rects || rects.length == 0) {
                return;
            }
            
            var highlightPane = null, lastPageId = null;
            var template = "<div id='{0}' class='highlight selection-highlight' style='top: {1}px; height: {2}px;'></div>";
            for (var i = 0; i < rects.length; i++) {
                var bounds = rects[i].bounds;
                var pageId = rects[i].page + 1;
                var rowId = rects[i].row + 1;
                if (highlightPane == null || (lastPageId != null && lastPageId != pageId)) {
                    highlightPane = this.element.find('#' + this.pagePrefix + pageId + ' div.highlight-pane');
                    lastPageId = pageId;
                }

                var pageRowId = this.pagePrefix + pageId + "-highlight-" + rowId + "-" + selectionCounter;
                var pageRow = highlightPane.find("#" + pageRowId);

                if (pageRow.length == 0) {
                    var div = $(window.groupdocs.stringExtensions.format(template, pageRowId, bounds.top() + 2, bounds.height()));

                    highlightPane.append(div);
                    pageRow = div;
                }

                if (clickHandler) {
                    var ev = $._data(pageRow.get(0), 'events');
                    if (!ev || !ev.click) {
                        pageRow.click(clickHandler);
                    }
                }

                if (hoverHandlers) {
                    var ev = $._data(pageRow.get(0), 'events');
                    if (!ev || !ev.mouseover)
                        pageRow.hover(hoverHandlers.mouseenter, hoverHandlers.mouseleave);
                }

                if (isStatic) {
                    pageRow.addClass("static");

                    if (color)
                        pageRow.css('background-color', color);
                }

                pageRow.css({ "left": bounds.left() - 1, "width": bounds.width(), "height": bounds.height() });

                if (!this.options.bookLayout) {
                    var page = this.pages[rects[i].page];
                    var pageRotation = page.rotation;
                    if (typeof pageRotation == "undefined")
                        pageRotation = 0;
                    var perpendicular = pageRotation % 180 > 0;
                    if (perpendicular)
                        pageRow.css({ "top": bounds.top() });
                }
            }
        },

        _getDocumentHighlightRects: function (selectionCounter) {
            var pages = this.pages;
            if (pages.length == 0)
                return null;

            var self = this;
            var lasso = self.lasso;
            var rects = [];
            for (var i = 0; i < pages.length; i++) {
                if (pages[i] && lasso.intersects(pages[i].rect)) {
                    var r = self._getPageHighlightRects(i, selectionCounter);
                    if (r && r.length) {
                        rects = rects.concat(r);
                    }
                }
            }
            return rects;
        },

        _getPageHighlightRects: function (pageIndex, selectionCounter) {
            var lasso = this.lasso;
            var rows = this.pages[pageIndex].rows;
            var rects = [];

            for (var i = 0; i < rows.length; i++) {
                if (!lasso.intersects(rows[i].rect)) {
                    if (this.dragged) {
                        $("#" + this.pagePrefix + (pageIndex + (this.options.bookLayout ? this.options.startNumbers.start : 1)) +
                          "-highlight-" + (i + 1) + "-" + selectionCounter + ":not(.static)").remove();
                    }
                    continue;
                }

                var rowRect = rows[i].rect;
                if ((lasso.left() < rowRect.left() && lasso.bottom() > rowRect.bottom()) ||
                    (lasso.right() > rowRect.right() && lasso.top() < rowRect.top()) ||
                    (lasso.bottom() > rowRect.bottom() && lasso.top() < rowRect.top())) {

                    var bounds = new groupdocs.Rect(rowRect.left(), rowRect.top() + 1, rowRect.right(), rowRect.bottom() - 1);
                    bounds.subtract(rows[i].pageLocation);

                    var r = {
                        bounds: bounds,
                        originalRect: rows[i].originalRect,
                        text: '',
                        page: pageIndex + (this.options.bookLayout /*|| this.options.useVirtualScrolling */? this.options.startNumbers.start - 1 : 0),
                        row: i,
                        position: -1,
                        length: 0
                    };
                    rects.push(r);

                    if (!this.dragged) {
                        var lastWord = rows[i].words[rows[i].words.length - 1];
                        r.text = rows[i].text;
                        r.position = rows[i].words[0].position;
                        r.length = (lastWord.position + lastWord.text.length - r.position);
                    }
                }
                else {
                    var r = this._getRowHighlightRect(pageIndex, i);
                    if (r != null) {
                        rects.push(r);
                    }
                    else if (this.dragged) {
                            $("#" + this.pagePrefix + (pageIndex + (this.options.bookLayout ? this.options.startNumbers.start : 1)) +
                            "-highlight-" + (i + 1) + "-" + selectionCounter + ":not(.static)").remove();
                        }
                }
            }
            return rects;
        },

        _getRowHighlightRect: function (pageIndex, rowIndex) {
            var lasso = this.lasso;

            var lassoTop = Math.min(lasso.top(), lasso.bottom()),
                lassoBottom = Math.max(lasso.top(), lasso.bottom());

            var page = this.pages[pageIndex];
            var pageRotation = page.rotation;
            if (typeof pageRotation == "undefined")
                pageRotation = 0;
            var perpendicular = pageRotation % 180 > 0;

            var row = page.rows[rowIndex],
                rowTop = row.rect.top(),
                rowBottom = row.rect.bottom();

            var objectsToSelect = (this._textSelectionByCharModeEnabled && row.chars) ? row.chars : row.words;

            var selectToEnd = (rowTop < lassoTop && lassoTop < rowBottom && lassoBottom >= rowBottom) && !      perpendicular,
                selectFromStart = (lassoTop <= rowTop && rowTop < lassoBottom && lassoBottom < rowBottom),
                increment = (selectFromStart ? -1 : 1),
                i = (selectFromStart ? objectsToSelect.length - 1 : 0);

            for (; i < objectsToSelect.length && i >= 0 && !lasso.intersects(objectsToSelect[i].rect); i += increment) {
                objectsToSelect[i].shown = false;
            }

            if (i == objectsToSelect.length || i < 0) {
                return null;
            }

            var objectToSelect = objectsToSelect[i];
            var right = 0, bottom = 0;
            var left = objectToSelect.rect.left(),
                top = objectToSelect.rect.top();
            var originalLeft = objectToSelect.originalRect.left(),
                originalTop = objectToSelect.originalRect.top();
            var originalRight = 0, originalBottom = 0;
            var result = {
                bounds: null,
                text: '',
                page: pageIndex + (this.options.bookLayout ? this.options.startNumbers.start - 1 : 0),
                row: rowIndex,
                position: objectToSelect.position,
                length: objectToSelect.text.length
            };

            for (; i < objectsToSelect.length && i >= 0 && (selectFromStart || selectToEnd || lasso.intersects(objectsToSelect[i].rect)); i += increment) {
                objectToSelect = objectsToSelect[i];
                objectToSelect.shown = true;

                if (!this.dragged) {

                    if (!this._textSelectionByCharModeEnabled) {
                        result.text += objectToSelect.text + ' ';
                    }
                    else if (this._textSelectionByCharModeEnabled) {
                        if (!objectToSelect.isLastWordChar) {
                            result.text += objectToSelect.text;
                        } else {
                            result.text += objectToSelect.text + ' ';
                        }
                    }
                }

                left = Math.min(left, objectToSelect.rect.left());
                top = Math.min(top, objectToSelect.rect.top());
                right = Math.max(right, objectToSelect.rect.right());
                bottom = Math.max(bottom, objectToSelect.rect.bottom());

                originalLeft = Math.min(originalLeft, objectToSelect.originalRect.left());
                originalTop = Math.min(originalTop, objectToSelect.originalRect.top());
                originalRight = Math.max(originalRight, objectToSelect.originalRect.right());
                originalBottom = Math.max(originalBottom, objectToSelect.originalRect.bottom());
            }

            for (; i < objectsToSelect.length && i >= 0; i += increment) {
                objectsToSelect[i].shown = false;
            }

            var bounds = new groupdocs.Rect(left, top + 1, right, bottom - 1);
            bounds.subtract(page.rect.topLeft);
            result.bounds = bounds;

            var originalBounds = new groupdocs.Rect(originalLeft, originalTop + 1, originalRight, originalBottom - 1);
            result.originalRect = originalBounds;
            result.length = (objectToSelect.position + objectToSelect.text.length);

            return result;
        },

        _findPageAt: function (point) {
            if (this.pages != null) {
                for (var i = 0; i < this.pages.length; i++) {
                    if (this.pages[i].rect.contains(point)) {
                        return this.pages[i];
                    }
                }
            }

            return null;
        },

        _findPageNearby: function (point) {
            var minHorizontalDifference = 0, minVerticalDifference = 0, pageNumber = null;
            var foundVerticalMatch = false, foundHorizontalMatch = false;

            for (var i = 0; i < this.pages.length; i++) {
                if (this.pages[i].rect.contains(point)) {
                    return this.pages[i];
                }
                else if (point.y >= this.pages[i].rect.top() && point.y <= this.pages[i].rect.bottom()) {
                    var horizontalDifference = Math.abs(point.x - this.pages[i].rect.left());
                    if (!foundVerticalMatch || horizontalDifference < minHorizontalDifference) {
                        minHorizontalDifference = horizontalDifference;
                        foundVerticalMatch = true;
                        pageNumber = i;
                    }
                }
                else if (point.x >= this.pages[i].rect.left() && point.x <= this.pages[i].rect.right()) {
                    var verticalDifference = Math.abs(point.y - this.pages[i].rect.top());
                    if (!foundHorizontalMatch || verticalDifference < minVerticalDifference) {
                        minVerticalDifference = verticalDifference;
                        foundHorizontalMatch = true;
                        pageNumber = i;
                    }
                }
            }

            return this.pages[pageNumber];
        },

        findPageAtVerticalPosition: function (y) {
            for (var i = 0; i < this.pages.length; i++) {
                if ((y >= this.pages[i].rect.top() && y <= this.pages[i].rect.bottom())
                    || (y >= this.pages[i].rect.bottom() && (i + 1) >= this.pages.length)
                    || (y >= this.pages[i].rect.bottom() && y <= this.pages[i + 1].rect.top())) {
                    return this.pages[i];
                }
            }
            return null;
        },

        setTextSelectionMode: function (mode) {
            this._textSelectionByCharModeEnabled = mode;
        },

        setMode: function (mode) {
            this._mode = mode;

            if (mode == this.SelectionModes.SelectText) {
                if (this._lassoCssElement == null)
                    this._lassoCssElement = $('<style type="text/css">.ui-selectable-helper { visibility: hidden; }</style>').appendTo('head');
            }
            else
                if (this._lassoCssElement) {
                    this._lassoCssElement.remove();
                    this._lassoCssElement = null;
                }
        },

        getMode: function () {
            return this._mode;
        }
    });
})(jQuery);