(function ($, undefined) {
    "use strict";

    $.groupdocsWidget("groupdocsSelectable", {
        customArea: [],
        search: null,
        lasso: null,
        pages: [],
        prevProportions: 1,
        prevCustomTemplateProportions: 1,
        searchProportions: 1,
        selectedRowsCoordinates: [],
        highlightPaneContainer: null,
        highlightSearchPaneContainer: null,
        buttonPaneContainer: null,
        template: "<div id={0} class='highlight selection-highlight' style='top: {1}px; height: {2}px; width: {3}px; left: {4}px;'></div>",
        searchTemplate: "<div id={0} class='highlight search-highlight' style='top: {1}px; height: {2}px; width: {3}px; left: {4}px;'></div>",
        addTemplate: "<div id={0} class='{3}' style='top: {1}px; left: {2}px;' index='{4}'></div>",
        cAreaPageIndex: 0,
        cAreaFieldIndex: 0,

        annotationContainer: "<div id={0} style='position:relative'>{1}</div>",
        annotationTemplate: "<div class='highlight annotation-highlight' style='top: {0}px; height: {1}px; width: {2}px; left: {3}px;'></div>",

        timeouts: [],
        flag: 0,
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
        _selectionInfo: {
            position: -1,
            length: 0
        },

        SelectionModes: { SelectText: 0, SelectRectangle: 1, SelectTextToStrikeout: 2, ClickPoint: 3, TrackMouseMovement: 4, DoNothing: 5 },
        _mode: null,
        _lassoCssElement: null,
        rightMargin: 35,
        parentElement: null,
        _viewModel: null,
        selectionCounter: 0,

        _create: function () {
            this._initialized = false;
            this.initCanvasOffset();

            if (!this.options.initializeStorageOnly) {
                this.dragged = false;

                if (this.options.preventTouchEventsBubbling) {
                    function preventEventBubble(event) {
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
                    //return false;
                    //self.initHighlightPaneContainer();
                    //self.clearShown();
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
            var offset = this.element.parent().offset();
            var offsetX = offset.left, offsetY = offset.top;

            if (this.options.bookLayout)
                offsetY = this.parentElement.offset().top;
            this._canvasOffset = new groupdocs.Point(offsetX, offsetY);
        },

        _mouseInit: function() {
            var that = this;

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
            if ( this._mouseMoveDelegate ) {
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

            $(window.document)
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
            if ( this._mouseMoved ) {
                // IE mouseup check - mouseup happened when mouse was out of window
                if ($.browser.msie && (!document.documentMode || document.documentMode < 9) && !event.button) {
                    return this._mouseUp(event);

                    // Iframe mouseup check - mouseup occurred in another document
                } else if ( !event.which ) {
                    return this._mouseUp( event );
                }
            }

            if ( event.which || event.button ) {
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
            $(window.document)
                .unbind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
                .unbind( "mouseup." + this.widgetName, this._mouseUpDelegate );

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
            if (this.options.bookLayout) {
                pageLocations = $.map(images, function(img) {
                    var imgJquery = $(img);
                    var x = imgJquery.offset().left - self._canvasOffset.x + self._canvasScroll.x;
                    var y = (self.options.bookLayout ? 0 : (imgJquery.offset().top - self.element.offset().top));
                    return new groupdocs.Point(x, y);
                });
            }
            
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
            var page = null;

            this._canvasScroll = this.getCanvasScroll();
            this._mouseStartPos = new groupdocs.Point(
                event.pageX - this._canvasOffset.x + this._canvasScroll.x,
                event.pageY - this._canvasOffset.y + this._canvasScroll.y);

            //if (this.options.useVirtualScrolling) {
                //this._initialized = false;
                //this.initStorage();
            //}

            return (this._mode != this.SelectionModes.DoNothing &&
                this._findPageAt(this._mouseStartPos) != null)
        },

        _mouseStart: function (event) {
            this.options.docSpace.focus();
            //if (this.options.useVirtualScrolling)
            //    this._initialized = false;
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

            if (this._mode == this.SelectionModes.TrackMouseMovement) {
                var top = this._mouseStartPos.y;
                var page = this.findPageAtVerticalPosition(top);
                var pageNumber = parseInt(page.pageId) - 1;

                this.element.trigger("onMouseMoveStarted", [pageNumber, { left: this._mouseStartPos.x, top: top}]);
            } else {
                this.element.append(this.helper);
                this.helper.css({
                    "left": this._mouseStartPos.x,
                    "top": this._mouseStartPos.y,
                    "width": 0,
                    "height": 0
                });
            }

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

            if (this._mode != this.SelectionModes.ClickPoint && this._mode != this.SelectionModes.TrackMouseMovement) {
                this.helper.css({ left: x1, top: y1, width: this.lasso.width(), height: this.lasso.height() });
            }

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

            if (this._mode == this.SelectionModes.SelectText || this._mode == this.SelectionModes.SelectTextToStrikeout) {
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

                var scale = this.options.proportion;
                if (this.options.storeAnnotationCoordinatesRelativeToPages) {
                    top = Math.min(highestTop, top);
                    bottom = Math.max(lowestBottom, bottom);
                }
                else {
                    pageOffset = pageNumber * this.options.pageHeight;
                    pageOffset /= scale;

                    top = Math.max(pageOffset + highestTop, top);
                    bottom = Math.min(pageOffset + lowestBottom, bottom);
                }
                var selectionBounds = new groupdocs.Rect(left, top, right, bottom);
                var selectionBoundsScaled = selectionBounds.clone();

                this.options.txtarea.val($.trim(text)); //.focus().select();
            }

            switch (this._mode) {
                case this.SelectionModes.SelectText:
                    this.element.trigger('onTextSelected', [pageNumber, selectionBoundsScaled, pos, len, this.selectionCounter, originalRects]);
                    break;

                case this.SelectionModes.SelectTextToStrikeout:
                    this.element.trigger('onTextToStrikeoutSelected', [pageNumber, selectionBoundsScaled, pos, len, this.selectionCounter, originalRects]);
                    break;

                case this.SelectionModes.SelectRectangle:
                    var selectedRectangle;
                    if (this.options.storeAnnotationCoordinatesRelativeToPages) {
                        selectedRectangle = this.convertRectToRelativeToPageUnscaledCoordinates(this.lasso, this._mouseStartPos);
                    }
                    else {
                        selectedRectangle = this.convertRectToAbsoluteCoordinates(this.lasso, this._mouseStartPos);
                    }
                    this.element.trigger('onRectangleSelected', [pageNumber, selectedRectangle]);
                    break;

                case this.SelectionModes.ClickPoint:
                    this.mouseClickHandler(event);
                    break;

                case this.SelectionModes.TrackMouseMovement:
                    $(this.element).trigger('onMouseMoveStopped', []);
                    break;

                default:
                    break;
            }
            return false;
        },

        mouseClickHandler: function (event) {
            this.options.docSpace.focus();

            if (this._mode == this.SelectionModes.ClickPoint) {
                this.initStorage();
                this._canvasScroll = this.getCanvasScroll();

                var lastX = event.pageX - this._canvasOffset.x + this._canvasScroll.x;
                var lastY = event.pageY - this._canvasOffset.y + this._canvasScroll.y;
                var lastPoint = new groupdocs.Rect(lastX, lastY, lastX, lastY);
                var page = this._findPageAt(lastPoint.topLeft);

                if (!page)
                    return true;

                var pageNumber = parseInt(page.pageId) - 1;
                if (this.options.storeAnnotationCoordinatesRelativeToPages) {
                    lastPoint = this.convertRectToRelativeToPageUnscaledCoordinates(lastPoint);
                }
                else {
                    lastPoint = this.convertRectToAbsoluteCoordinates(lastPoint);
                }

                this.element.trigger('onPointClicked', [pageNumber, lastPoint]);
                return false;
            }

            return true;
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

        highlightPredefinedArea: function (rect, clickHandler, pageNumber, selectionCounter, color, hoverHandlers) {
            this.initStorage();
            this.dragged = true;

            if (this.options.storeAnnotationCoordinatesRelativeToPages) {
                this.lasso = this.convertPageAndRectToScreenCoordinates(pageNumber, rect);
            }
            else {
                this.lasso = this.convertRectToScreenCoordinates(rect);
            }
            this.selectionCounter++;
            var page = this._findPageAt(this.lasso.topLeft) || this.pages[0];

            var pageNumbers = this.options.startNumbers;
            this.options.startNumbers = { start: parseInt(page.pageId), end: parseInt(page.pageId) };

            this.findSelectedPages(true, clickHandler, selectionCounter, color || this.options.highlightColor, hoverHandlers);

            this.options.startNumbers = pageNumbers;
            this.dragged = false;
            if (typeof selectionCounter == "undefined")
                return this.selectionCounter;
            else {
                return selectionCounter;
            }
        },

        unhighlightPredefinedArea: function (rect, deleteStatic, pageNumber, selectionCounter) {
            if (this.options.storeAnnotationCoordinatesRelativeToPages) {
                this.lasso = this.convertPageAndRectToScreenCoordinates(pageNumber, rect);
            }
            else {
                this.lasso = this.convertRectToScreenCoordinates(rect);
            }
            var rects = this._getDocumentHighlightRects();

            if (!rects || rects.length == 0) {
                return;
            }

            if (typeof selectionCounter == "undefined")
                selectionCounter = "";

            for (var i = 0; i < rects.length; i++) {
                var pageId = rects[i].page + 1;
                var rowId = rects[i].row + 1;
                //var elementSelector = "#" + this.pagePrefix + pageId + "-highlight-" + rowId;
                var elementSelector = "#" + this.pagePrefix + pageId + "-highlight-" + rowId + "-" + selectionCounter;
                if (deleteStatic) {
                    elementSelector += ".static";
                }
                else {
                    elementSelector += ":not(.static)";
                }
                $(elementSelector).remove();
            }
        },

        setVisiblePagesNumbers: function (vPagesNumbers) {
            this.options.startNumbers = vPagesNumbers;
        },

        handleDoubleClick: function (event) {
            this.lasso = new groupdocs.Rect(event.pageX, event.pageY, event.pageX, event.pageY);
            this.initStorage();
            this.findSelectedPages();
        },

        initHighlightSearchPaneContainer: function () {
            var containers = this._getElementsByClassName('search-pane', document.getElementById(this.options.docSpace.attr('id') + '-pages-container'));
            var len = containers.length;
            for (var i = len; i--; )
                if (containers[i].children.length != 0)
                    containers[i].innerHTML = '';
            this.highlightSearchPaneContainer = containers;
        },
        initButtonPaneContainer: function () {
            var containers = this._getElementsByClassName('button-pane', document.getElementById(this.options.docSpace.attr('id') + '-pages-container'));
            var len = containers.length;
            for (var i = len; i--; )
                if (containers[i].children.length != 0)
                    containers[i].innerHTML = '';
            this.buttonPaneContainer = containers;
        },

        reInitPages: function (scaleFactor, visiblePagesNumbers, scrollPosition, pageHeight, pagesCount, pageLocations) {
            this._initialized = false;

            this.options.startNumbers = visiblePagesNumbers;
            this.options.proportion = scaleFactor;
            this.options.pageHeight = pageHeight;
            this.options.pageLocations = pageLocations;
            this.options.pagesCount = pagesCount;

            this.initCanvasOffset();
            this.initStorage();
        },

        changeSelectedRowsStyle: function (proportions) {
            this.changeCustomAreasStyle(proportions);
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
            var searchWordsLen, wordsLen;
            var startIndex, endIndex, wordId;
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
                                //if (rowWords[rowWordIndex].text.toLowerCase() == $.trim(searchWords[searchWordIndex].toLowerCase())) {
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
                            else {
                                searchWords = this.getWords(searchValue);
                                searchWordsLen = searchWords.length;
                                if (searchWordsLen == 0)
                                    break;
                                rowWordsLen = rowWords.length;
                                if (searchWordsLen == 1) {
                                    for (wordId = 0; wordId < rowWordsLen; wordId++) {
                                        if (rowWords[wordId].text.toLowerCase() == $.trim(searchWords[0].toLowerCase())) {
                                            r = rowWords[wordId].rect.clone();
                                            r.subtract(rowWords[wordId].pageLocation);
                                            pageWords.push(r);
                                        }
                                    }

                                }
                                else {
                                    startIndex = 0;
                                    endIndex = searchWordsLen - 1;
                                    for (wordId = 0; wordId < rowWordsLen; wordId++) {
                                        if (rowWords[wordId].text.toLowerCase() == $.trim(searchWords[startIndex].toLowerCase())) {
                                            r = rowWords[wordId].rect.clone();
                                            r.subtract(rowWords[wordId].pageLocation);
                                            r.setRight(r.left() + rowWords[wordId + endIndex].rect.right() - rowWords[wordId].rect.left());
                                            pageWords.push(r);
                                        }
                                    }
                                }
                                textPosition = -1;
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
                    //result += this.searchTemplate.format(this.pagePrefix + pageId + "-search-highlight-" + wordIndex, t, h, w, l);
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

        clearAllTimeOuts: function () {
            var timeouts = this.timeouts;
            var len = timeouts.length;
            if (len > 0) {
                for (var i = len; i--; ) {
                    clearTimeout(timeouts[i]);
                }
                timeouts = [];
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

        highlightTemplateAreas: function (data, proportion) {
            this.customArea = $.extend(true, [], data);
            this.changeCustomAreasStyle(proportion);
        },

        changeCustomAreasStyle: function (proportions) {
            if (typeof (this.customArea) === "undefined") {
                return;
            }
            if (this.customArea.length == 0)
                return;
            //this.prevCustomTemplateProportions
            var self = this;
            var area = this.customArea;
            var dif = 31;
            var len = area.length;

            $('#' + this.options.docSpace.attr('id') + '-pages-container .custom-pane').html('');

            var pageIndex = 0;
            var result = '';

            (function changeCustomAreasStyleAsync() {
                var fields = area[pageIndex].fields;
                var fieldsLen = fields.length;
                var pageId = area[pageIndex].PageId;

                for (var fieldsIndex = 0; fieldsIndex < fieldsLen; fieldsIndex++) {
                    var w = Math.round(Math.round(fields[fieldsIndex].Width) * proportions);
                    var h = Math.round(Math.round(fields[fieldsIndex].Height) * proportions);
                    var t = Math.round(Math.round(fields[fieldsIndex].Y) * proportions);
                    var l = Math.round(((fields[fieldsIndex].X - dif)) * proportions + dif);

                    var extraStyles = (self.cAreaPageIndex == pageIndex && self.cAreaFieldIndex == fieldsIndex ? 'border-color:blue' : '');
                    result += "<div id=" + this.pagePrefix + pageIndex + "-custom-highlight-" + fieldsIndex + " index=" + pageIndex + "/" + fieldsIndex + " class='input-overlay1' style='position:absolute; cursor:pointer; padding: 0px; top: " + t + "px; height: " + h + "px; width: " + w + "px; left: " + l + "px;" + extraStyles + "'></div>";

                    var customAreaHtml = window.groupdocs.stringExtensions.format(self.addTemplate, this.pagePrefix + pageIndex + "-custom-check-" + fieldsIndex, t - 5, l + w - 8, fields[fieldsIndex].iconType == 1 ? "selection-check" : "selection-del", pageIndex + "/" + fieldsIndex);
                    result += customAreaHtml;
                    //result += self.addTemplate.format(this.pagePrefix + pageIndex + "-custom-check-" + fieldsIndex, t - 5, l + w - 8, fields[fieldsIndex].iconType == 1 ? "selection-check" : "selection-del", pageIndex + "/" + fieldsIndex);
                }

                ++pageIndex;
                var nextPageId = (pageIndex < len ? area[pageIndex].PageId : -1);

                if (result != '' && nextPageId != pageId) {
                    $('#' + this.pagePrefix + pageId + ' .custom-pane').html(result);
                    self.bindCustomHandler(pageId);
                    result = '';
                }

                if (pageIndex < len) {
                    setTimeout(changeCustomAreasStyleAsync, 0);
                }
            })();
        },

        bindCustomHandler: function (pageId) {
            var self = this;
            $("#" + this.pagePrefix + pageId + " div.input-overlay1, #" + this.pagePrefix + pageId + " div.selection-check, #" + this.pagePrefix + pageId + " div.selection-del").bind({
                click: function () {
                    var index = $(this).attr('index');
                    var dvViewModel = $('#doc-space').docAssemblyViewer('getViewModel');
                    if (typeof (index) !== "undefined") {
                        var indexArray = index.split("/");
                        var pageIndex = indexArray[0];
                        var fieldIndex = indexArray[1];
                        self.cAreaPageIndex = pageIndex;
                        self.cAreaFieldIndex = fieldIndex;
                        dvViewModel.moveTo({ groupIndex: parseInt(pageIndex), fieldIndex: parseInt(fieldIndex) });
                        return false;
                    }
                }
            });
            $("#" + this.pagePrefix + pageId + " div.input-overlay1").bind({
                mouseover: function (e) {
                    var index = $(this).attr('index');
                    var dvViewModel = $('#doc-space').docAssemblyViewer('getViewModel');
                    if (typeof (index) !== "undefined") {
                        var indexArray = index.split("/");
                        var pageIndex = indexArray[0];
                        var fieldIndex = indexArray[1];
                        dvViewModel.mouseover(e, { groupIndex: parseInt(pageIndex), fieldIndex: parseInt(fieldIndex) });
                    }
                },
                mouseout: function (e) {
                    var index = $(this).attr('index');
                    var dvViewModel = $('#doc-space').docAssemblyViewer('getViewModel');
                    if (typeof (index) !== "undefined") {
                        var indexArray = index.split("/");
                        var pageIndex = indexArray[0];
                        var fieldIndex = indexArray[1];
                        dvViewModel.mouseout(e, { groupIndex: parseInt(pageIndex), fieldIndex: parseInt(fieldIndex) });
                    }
                }
            });
        },

        setCustomAreaIndex: function (data) {
            var pageIndex = data.pageIndex;
            var fieldIndex = data.fieldIndex;
            this.cAreaPageIndex = pageIndex;
            this.cAreaFieldIndex = fieldIndex;
        },

        changeTemplateAreaIcon: function (data) {
            var customArea = this.customArea;
            var fields = customArea[data.pageIndex].fields;
            var elementIdTemplate = this.pagePrefix + "{0}-custom-check-{1}";
            var elementId = window.groupdocs.stringExtensions.format(elementIdTemplate, data.pageIndex, data.fieldIndex);
            //var elementId = elementIdTemplate.format(data.pageIndex, data.fieldIndex);
            $('#' + elementId).attr('class', data.iconType == 1 ? "selection-check" : "selection-del");
            fields[data.fieldIndex].iconType = data.iconType;
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
            //var i = self.options.startNumbers.start;

            //for (; i <= self.options.startNumbers.end; i++) {
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
                    else
                        if (this.dragged) {
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

            // result.length = (objectToSelect.position - result.position + objectToSelect.text.length);
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

            if (mode == this.SelectionModes.SelectText || mode == this.SelectionModes.SelectTextToStrikeout) {
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
        },

        getRowsFromRect: function (bounds) {
            this.initStorage();

            var rect = null;
            this.lasso = bounds.clone();
            this.lasso = new groupdocs.Rect(Math.round(this.lasso.left()), Math.round(this.lasso.top()) + 0.001,
                                            Math.round(this.lasso.right()), Math.round(this.lasso.bottom()) - 0.001);

            var rects = this._getDocumentHighlightRects();
            for (var i = 0; i < rects.length; i++) {
                rect = rects[i].bounds;
                var pageOffsetX = this.pages[rects[i].page].rect.topLeft.x - this.pages[0].rect.topLeft.x;
                var pageOffsetY = this.pages[rects[i].page].rect.topLeft.y; // -this.pages[0].rect.topLeft.y;
                rect.add(new groupdocs.Point(pageOffsetX, pageOffsetY));
            }
            return rects;
        }
    });
})(jQuery);