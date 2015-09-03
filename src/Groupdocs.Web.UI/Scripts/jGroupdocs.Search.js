(function ($, undefined) {
    "use strict";

    $.groupdocsWidget('search', {
        _viewModel: null,
        options: {
            isCaseSensitive: false,
            searchForSeparateWords: false
        },

        _create: function () {
            $.extend(this.options, { element: this.element });
            this.bindingProvider = new window.groupdocs.bindingProvider();
            this.options.bindingProvider = this.bindingProvider;
            if (this.options.createHtml) {
                this._createHtml();
            }
            this._viewModel = this.getViewModel();
            this.bindingProvider.applyBindings(this._viewModel, this.element);
        },

        _init: function () {
        },

        getViewModel: function () {
            if (this._viewModel == null) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        _createViewModel: function () {
            var vm = new searchViewModel(this.options);
            return vm;
        },

        _createHtml: function () {
            this.bindingProvider.createHtml("search", this.element, this.options);
            var root = this.element;
            root.trigger("onHtmlCreated");
        }
    });

    // Doc Viewer Model
    var searchModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(searchModel.prototype, {
        _init: function () {
        }
    });

    // Doc Viewer View Model
    var searchViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };
    $.extend(searchViewModel.prototype, {
        searchValue: null,
        previousEnabled: null,
        nextEnabled: null,
        minAreaTopRelativeToBeginning: null,
        maxAreaTopRelativeToBeginning: null,
        searched: false,
        viewerIsScrolled: false,
        searchForward: false,
        closestArea: null,
        newHighlightedAreaLeftRelative: 0,
        highlightAreas: null,
        sible: null,
        useHtmlBasedEngine: false,
        useCaseSensitiveSearch: false,
        useAccentInsensitiveSearch: false,
        viewerViewModel: null,
        pageNumberAttribute: "data-page-num",
        useRtl: false,
        searchPageAfterScrollingToIt: null,
        hitsOnAllPagesAreFound: false,

        _create: function (options) {
            this._model = new searchModel(options);
            this._init(options);
        },

        _init: function (options) {
            this.searchValue = this.bindingProvider.getObservable("");
            this.previousEnabled = this.bindingProvider.getObservable(true);
            this.nextEnabled = this.bindingProvider.getObservable(true);
            this.visible = this.bindingProvider.getObservable(this.searchIsVisible);
        },

        triggerSearchEvent: function (isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch) {
            if (!this.searched) {
                var searchValue = this.searchValue();
                this.element.trigger("onPerformSearch", [searchValue, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch]);
            }
            this.searched = true;
            return false;
        },

        findClosestArea: function (searchForward,
                                   isCaseSensitive,
                                   searchForSeparateWords,
                                   treatPhrasesInDoubleQuotesAsExact,
                                   useAccentInsensitiveSearch,
                                   pageNumber) {
            var searched = this.searched;
            this.triggerSearchEvent(isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch);
            var isCurrentHighlightAreaFound = false;
            var currentlyHighlightedAreaLeft = null, currentlyHighlightedAreaTop = null;
            var currentlyHighlightedAreaHeight = null;
            var currentSearchHighlightClass = "current_search_highlight";
            var highlightGroupName = null;
            var currentHitPageNumber, currentPages, currentPagesStart, currentPagesEnd;
            var startPage, endPage;

            currentPages = this.viewerViewModel.getVisiblePagesNumbers();
            currentPagesStart = currentPages.start - 1;
            currentPagesEnd = currentPages.end - 1;

            if (this.useHtmlBasedEngine) {
                if (this.useVirtualScrolling && this.isWaitingForPageOpening && pageNumber === undefined) {
                    return;
                }
                this.isWaitingForPageOpening = false;
                if (this.highlightAreas == null || !this.hitsOnAllPagesAreFound || !searched) {
                    this.highlightAreas = this.viewerElement.find(".search_highlight_html");

                    this.hitsOnAllPagesAreFound = true;
                    endPage = this.viewerViewModel.pageCount();
                    for (var pageNum = 0; pageNum < endPage; pageNum++) {
                        if (!this.viewerViewModel.isPageVisible(pageNum)) {
                            this.hitsOnAllPagesAreFound = false;
                            break;
                        }
                    }

                    if (this.hitsOnAllPagesAreFound)
                        this.sortHighlightedAreas();
                }

                if (this.useVirtualScrolling && pageNumber !== undefined) {
                    this.highlightAreas = this.highlightAreas.filter("[data-page-num=" + pageNumber + "]");
                }
            }
            else {
                if (this.highlightAreas == null || !searched) {
                    this.highlightAreas = this.viewerElement.find(".search-pane > .search-highlight");
                    this.sortHighlightedAreas();
                }
            }
            var allHighlightedAreas = this.highlightAreas;

            this.currentHighlightArea = this.highlightAreas.filter("." + currentSearchHighlightClass +
                ",tspan[class*='" + currentSearchHighlightClass + "']"); // SVG
            var closestArea = null;

            if (this.currentHighlightArea.length > 0) {
                if (this.currentHighlightArea.is("[name*='search_highlight']")) {
                    highlightGroupName = this.currentHighlightArea.attr("name");
                    this.currentHighlightArea = allHighlightedAreas.filter("[name='" + highlightGroupName + "']");
                }
                isCurrentHighlightAreaFound = true;
                currentlyHighlightedAreaLeft = this.currentHighlightArea.offset().left;
                currentlyHighlightedAreaTop = this.currentHighlightArea.offset().top;
                currentlyHighlightedAreaHeight = this.currentHighlightArea.height();
            }

            if (!this.pagesContainerElement)
                this.pagesContainerElement = this.viewerElement.find(".pages_container");
            var pagesContainerTop = this.pagesContainerElement.offset().top;
            var pagesContainerLeft = this.pagesContainerElement.offset().left;
            var scrollTop;

            var visibleScreenTop = this.viewerElement.scrollTop();
            //var isCurrentHighlightAreaVisible = this.isCurrentlyHighlightedAreaVisible();
            scrollTop = Math.floor(this.getScrollTop(visibleScreenTop));

            var minDistance = 0, minHorizontalDistance = null;
            var areaTop, areaLeft;
            var areaTopRelativeToBeginning = 0, closestAreaTopRelativeToBeginning = 0;
            var areaLeftRelativeToBeginning = 0;
            this.minAreaTopRelativeToBeginning = null;
            this.maxAreaTopRelativeToBeginning = null;
            this.minAreaLeftRelativeToBeginning = null;
            this.maxAreaLeftRelativeToBeginning = null;

            var minLeft, maxLeft;
            var horizontalDistance;
            var firstArea = true;
            var self = this;
            if (this.useVirtualScrolling && pageNumber !== undefined) {
                this.sortHighlightedAreas();
                if (searchForward)
                    closestArea = this.highlightAreas.first();
                else
                    closestArea = this.highlightAreas.last();
                closestAreaTopRelativeToBeginning = closestArea.offset().top - pagesContainerTop;
                closestArea = closestArea.get(0);
            }
            else {
                var areaElement;
                this.highlightAreas.each(function (index) {
                    if (isCurrentHighlightAreaFound && (!self.useHtmlBasedEngine || self.hitsOnAllPagesAreFound)) {
                        if (this === self.currentHighlightArea.get(0)) {
                            var nextHitIndex;
                            if (searchForward) {
                                nextHitIndex = index + 1;
                                if (highlightGroupName !== null)
                                {
                                    for (; nextHitIndex < self.highlightAreas.length; nextHitIndex++)
                                        if (highlightGroupName != $(self.highlightAreas.get(nextHitIndex)).attr("name"))
                                            break;
                                }
                            }
                            else {
                                nextHitIndex = index - 1;
                                if (highlightGroupName !== null)
                                {
                                    for (; nextHitIndex >= 0; nextHitIndex--)
                                        if (highlightGroupName != $(self.highlightAreas.get(nextHitIndex)).attr("name"))
                                            break;
                                }
                            }

                            if (nextHitIndex >= self.highlightAreas.length) {
                                nextHitIndex = self.highlightAreas.length - 1;
                            }
                            else if (nextHitIndex < 0) {
                                nextHitIndex = 0;
                            }
                            closestArea = self.highlightAreas.get(nextHitIndex);
                            areaElement = $(closestArea);
                            areaTop = areaElement.offset().top;
                            areaTopRelativeToBeginning = Math.floor(areaTop - pagesContainerTop);
                            areaLeft = areaElement.offset().left;
                            areaLeftRelativeToBeginning = areaLeft - pagesContainerLeft;

                            closestAreaTopRelativeToBeginning = areaTopRelativeToBeginning;

                            self.minAreaTopRelativeToBeginning = $(self.highlightAreas.get(0)).offset().top;
                            self.maxAreaTopRelativeToBeginning = $(self.highlightAreas.get(self.highlightAreas.length - 1)).offset().top;
                            return false;
                        }
                        else
                            return true;
                    }

                    areaElement = $(this);
                    if (self.useHtmlBasedEngine && isCurrentHighlightAreaFound && highlightGroupName == areaElement.attr("name"))
                        return;
                    areaTop = areaElement.offset().top;
                    areaTopRelativeToBeginning = Math.floor(areaTop - pagesContainerTop);
                    areaLeft = areaElement.offset().left;
                    areaLeftRelativeToBeginning = areaLeft - pagesContainerLeft;

                    if (self.minAreaTopRelativeToBeginning == null || (areaTopRelativeToBeginning == self.minAreaTopRelativeToBeginning && areaLeftRelativeToBeginning < self.minAreaLeftRelativeToBeginning))
                        self.minAreaLeftRelativeToBeginning = areaLeftRelativeToBeginning;

                    if (self.maxAreaTopRelativeToBeginning == null || (areaTopRelativeToBeginning == self.maxAreaTopRelativeToBeginning && areaLeftRelativeToBeginning > self.maxAreaLeftRelativeToBeginning))
                        self.maxAreaLeftRelativeToBeginning = areaLeftRelativeToBeginning;

                    if (self.minAreaTopRelativeToBeginning == null || areaTopRelativeToBeginning < self.minAreaTopRelativeToBeginning) {
                        self.minAreaTopRelativeToBeginning = areaTopRelativeToBeginning;
                        self.minAreaLeftRelativeToBeginning = areaLeftRelativeToBeginning;
                    }
                    if (self.maxAreaTopRelativeToBeginning == null || areaTopRelativeToBeginning > self.maxAreaTopRelativeToBeginning) {
                        self.maxAreaTopRelativeToBeginning = areaTopRelativeToBeginning;
                        self.maxAreaLeftRelativeToBeginning = areaLeftRelativeToBeginning;
                    }

                    if (isCurrentHighlightAreaFound) {
                        var distanceToCurrentlyHighlighted = Math.abs(areaTopRelativeToBeginning - scrollTop);
                        if (distanceToCurrentlyHighlighted < 1) {
                            horizontalDistance = Math.abs(areaLeft - currentlyHighlightedAreaLeft);
                            if ((horizontalDistance >= 1) &&
                            ((searchForward && areaLeft > currentlyHighlightedAreaLeft) ||
                            (!searchForward && areaLeft < currentlyHighlightedAreaLeft)) &&
                            (horizontalDistance < minHorizontalDistance || minHorizontalDistance === null)) {
                                closestArea = areaElement;
                                minHorizontalDistance = horizontalDistance;
                                closestAreaTopRelativeToBeginning = areaTopRelativeToBeginning;
                                firstArea = false;
                            }
                        }
                    }

                    if (minHorizontalDistance === null &&
                            ((searchForward && areaTopRelativeToBeginning > scrollTop) ||
                            (!searchForward && areaTopRelativeToBeginning < scrollTop))) {
                        var distance = Math.abs(areaTopRelativeToBeginning - scrollTop);
                        if (distance >= 1) {
                            if ((distance < minDistance && minDistance - distance >= 1) || firstArea) {
                                closestArea = areaElement;
                                minDistance = distance;
                                closestAreaTopRelativeToBeginning = areaTopRelativeToBeginning;
                                firstArea = false;
                                if (searchForward)
                                    minLeft = areaLeft;
                                else
                                    maxLeft = areaLeft;
                            }
                            else if (Math.abs(distance - minDistance) < 1) {
                                if (searchForward && areaLeft < minLeft) {
                                    minLeft = areaLeft;
                                    closestArea = areaElement;
                                    closestAreaTopRelativeToBeginning = areaTopRelativeToBeginning;
                                }
                                if (!searchForward && areaLeft > maxLeft) {
                                    maxLeft = areaLeft;
                                    closestArea = areaElement;
                                    closestAreaTopRelativeToBeginning = areaTopRelativeToBeginning;
                                }
                            }
                        }
                    }
                });
            }
            var increment, notLoadedPageNum;

            if (this.useHtmlBasedEngine && this.useVirtualScrolling && !closestArea && pageNumber === undefined) { // not started search after scrolling to a page already
                var viewerPages = this.viewerViewModel.pages();
                var pageAreas;
                if (searchForward) {
                    startPage = this.viewerViewModel.lastVisiblePageForVirtualMode() + 1;
                    increment = 1;
                }
                else {
                    startPage = this.viewerViewModel.firstVisiblePageForVirtualMode() - 1;
                    increment = -1;
                }

                for (var i = startPage; (searchForward && i < viewerPages.length) || (!searchForward && i >= 0) ; i += increment) {
                    var page = viewerPages[i];
                    if (page.parsedHtmlElement) {
                        pageAreas = page.parsedHtmlElement.find(".search_highlight_html");
                        if (pageAreas.length > 0) {
                            this.searchPageAfterScrollingToIt = {
                                searchForward: searchForward,
                                pageNumber: i
                            };
                            this.viewerViewModel.setPage(i + 1);
                            return;
                            //                            if (searchForward)
                            //                                closestArea = pageAreas.first().get(0);
                            //                            else
                            //                                closestArea = pageAreas.last().get(0);
                            //                            allHighlightedAreas = allHighlightedAreas.add(closestArea);
                            //                            closestAreaTopRelativeToBeginning = page.top();
                            //                            page.searched = true;
                            //break;
                        }
                    }
                }
            }

            var newHighlightedAreaLeft = null;
            var newHighlightedAreaLeftRelative = null;
            if (closestArea) { // found a search hit
                var closestAreaJquery = $(closestArea);
                var newHitPageNumber = parseInt(closestAreaJquery.attr(this.pageNumberAttribute));
                endPage = newHitPageNumber;
                if (newHitPageNumber > currentPagesEnd) {
                    startPage = currentPagesEnd;
                    increment = 1;
                }
                else {
                    startPage = currentPagesStart;
                    increment = -1;
                }
                var scrollNow = true;
                if (this.useHtmlBasedEngine && newHitPageNumber !== null && !(newHitPageNumber >= currentPagesStart && newHitPageNumber <= currentPagesEnd)) {
                    for (notLoadedPageNum = startPage; notLoadedPageNum != endPage; notLoadedPageNum += increment) {
                        if (!this.viewerViewModel.isPageVisible(notLoadedPageNum)) {
                            // found a search hit outside visible pages
                            this.loadPagesOnOneLevel(notLoadedPageNum, searchForward, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact);
                            scrollNow = false;
                            break;
                        }
                    }
                }

                if (scrollNow) {
                    if (closestAreaJquery.is("[name*='search_highlight']")) {
                        highlightGroupName = closestAreaJquery.attr("name");
                        closestArea = allHighlightedAreas.filter("[name='" + highlightGroupName + "']");
                    }
                    else {
                        closestArea = closestAreaJquery;
                    }

                    this.viewerElement[0].scrollTop = closestAreaTopRelativeToBeginning;
                    this.viewerIsScrolled = true;
                    this.viewerElement.trigger("ScrollDocView", [null, { target: this.viewerElement[0] }]);
                    this.viewerElement.trigger("ScrollDocViewEnd", [null, { target: this.viewerElement[0] }]);
                    this.viewerIsScrolled = false;
                    pagesContainerTop = this.pagesContainerElement.offset().top;

                    var oldClass, newClass;
                    if (this.currentHighlightArea.is("tspan")) { // SVG
                        oldClass = this.currentHighlightArea.attr("class");
                        newClass = oldClass.replace(new RegExp("\\b" + currentSearchHighlightClass + "\\b"), "");
                        this.currentHighlightArea.attr("class", newClass);
                    }
                    else {
                        this.currentHighlightArea.removeClass(currentSearchHighlightClass);
                    }

                    if (closestArea.is("tspan")) { // SVG
                        oldClass = closestArea.attr("class");
                        closestArea.attr("class", oldClass + " " + currentSearchHighlightClass);
                    }
                    else {
                        closestArea.addClass(currentSearchHighlightClass);
                    }
                    var newHighlightedAreaTop = closestArea.offset().top;
                    var newHighlightedAreaTopRelative = newHighlightedAreaTop - pagesContainerTop;
                    newHighlightedAreaLeft = closestArea.offset().left;
                    newHighlightedAreaLeftRelative = newHighlightedAreaLeft - pagesContainerLeft;
                    scrollTop = newHighlightedAreaTopRelative;
                }
            }
            else {
                // startPage = currentHitPageNumber;
                if (searchForward) {
                    increment = 1;
                    startPage = currentPagesEnd;
                    endPage = this.viewerViewModel.pageCount();
                }
                else {
                    increment = -1;
                    startPage = currentPagesStart;
                    endPage = -1;
                }
                if (this.useHtmlBasedEngine && !(newHitPageNumber >= currentPagesStart && newHitPageNumber <= currentPagesEnd)) {
                    for (notLoadedPageNum = startPage; notLoadedPageNum != endPage; notLoadedPageNum += increment) {
                        if (!this.viewerViewModel.isPageVisible(notLoadedPageNum)) {
                            this.loadPagesOnOneLevel(notLoadedPageNum, searchForward, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact);
                            break;
                        }
                    }
                }
            }

            this.searchForward = searchForward;

            if (!closestArea && isCurrentHighlightAreaFound)
                closestArea = this.currentHighlightArea;
            this.closestArea = closestArea;
            this.newHighlightedAreaLeftRelative = newHighlightedAreaLeftRelative;

            var previousEnabled = this.isPreviousEnabled(scrollTop);
            this.previousEnabled(previousEnabled);
            var nextEnabled = this.isNextEnabled(scrollTop);
            this.nextEnabled(nextEnabled);
        },

        isPreviousEnabled: function (scrollTop) {
            var scrollTopWithHighlighted = this.getScrollTop(scrollTop);

            // HTML engine
            if (this.useHtmlBasedEngine) {
                if (!this.hitsOnAllPagesAreFound)
                    return true;

                return !this.searched || this.nextElementExists(false);
            } else {
                // Image-based engine
                var areaCheck = ((this.minAreaTopRelativeToBeginning != null) && (Math.floor(scrollTopWithHighlighted) > Math.ceil(this.minAreaTopRelativeToBeginning)
                    || (Math.abs(scrollTopWithHighlighted - this.minAreaTopRelativeToBeginning) < 1 && this.newHighlightedAreaLeftRelative !== null && this.newHighlightedAreaLeftRelative > this.minAreaLeftRelativeToBeginning)));
                return !this.searched || areaCheck;
            }
        },

        isNextEnabled: function (scrollTop) {
            var scrollTopWithHighlighted = this.getScrollTop(scrollTop);

            // HTML engine
            if (this.useHtmlBasedEngine) {
                if (!this.hitsOnAllPagesAreFound)
                    return true;

                // Get current highlited element index
                return !this.searched || this.nextElementExists(true);
            } else {
                // Not HTML engine
                var areaCheck = ((this.maxAreaTopRelativeToBeginning != null)
                && (Math.ceil(scrollTopWithHighlighted) < Math.floor(this.maxAreaTopRelativeToBeginning)
                    || (Math.abs(scrollTopWithHighlighted - this.maxAreaTopRelativeToBeginning) < 1 && this.newHighlightedAreaLeftRelative !== null && this.newHighlightedAreaLeftRelative < this.maxAreaLeftRelativeToBeginning)));
                return !this.searched || areaCheck;
            }
        },

        // Detects if there is next (or previous) element for highlight
        nextElementExists: function (isForward) {
            var result = false;
            var currentSearchElem = this.viewerElement.find(".current_search_highlight");

            if (currentSearchElem != null && currentSearchElem.attr('name')) {
                var elemIndex = parseInt(currentSearchElem.attr('name').replace('search_highlight', ''));
                var nextIndex = isForward ? elemIndex + 1 : elemIndex - 1;
                var nextName = 'search_highlight' + nextIndex.toString();

                if (!this.isExistsInHighlighted(nextName))
                    result = true;
            }
            return !result;
        },

        // Detects if highlightAreas collection contains element with name attribute equals spanName
        isExistsInHighlighted: function (spanName) {
            if (this.highlightAreas == null || this.highlightAreas.length <= 0)
                return false;

            var isExists = false;

            for (var i = 0; i < this.highlightAreas.length; i++) {
                if (this.highlightAreas[i].getAttribute("name") == spanName)
                    isExists = true;
            }
            return isExists;
        },
        findPreviousFromUI: function () {
            this.findPrevious(this.isCaseSensitive, this.searchForSeparateWords, this.treatPhrasesInDoubleQuotesAsExactPhrases, this.useAccentInsensitiveSearch);
        },

        findNextFromUI: function () {
            this.findNext(this.isCaseSensitive, this.searchForSeparateWords, this.treatPhrasesInDoubleQuotesAsExactPhrases, this.useAccentInsensitiveSearch);
        },

        findPrevious: function (isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExactPhrases, useAccentInsensitiveSearch) {
            if (this.searchValue() != "")
                this.findClosestArea(false, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExactPhrases, useAccentInsensitiveSearch);
        },

        findNext: function (isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExactPhrases, useAccentInsensitiveSearch) {
            if (this.searchValue() != "")
                this.findClosestArea(true, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExactPhrases, useAccentInsensitiveSearch);
        },

        clearValue: function () {
            this.searchValue("");
            this.resetButtons();
            this.triggerSearchEvent();
        },

        resetButtons: function () {
            this.previousEnabled(true);
            this.nextEnabled(true);
            this.searched = false;
            this.highlightAreas = null;
        },

        keyDown: function (viewModel, event) {
            if (event.keyCode == 8 || event.keyCode == 46) { // Backspace, Delete
                viewModel.keyHandler(event.keyCode);
            }
            return true;
        },

        keyPressed: function (viewModel, event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            return viewModel.keyHandler(keyCode);
        },

        keyHandler: function (keyCode) {
            if (keyCode === 13) { // Enter
                this.findNextFromUI();
                return false;
            }
            this.previousEnabled(true);
            this.nextEnabled(true);
            this.searched = false;
            return true;
        },

        scrollPositionChanged: function (scrollTop) {
            if (this.searched && !this.viewerIsScrolled) {
                this.previousEnabled(this.isPreviousEnabled(scrollTop));
                this.nextEnabled(this.isNextEnabled(scrollTop));
            }
        },

        showControls: function () {
            this.visible(this.searchIsVisible);
        },

        hideControls: function () {
            this.visible(false);
        },

        documentLoaded: function () {
            this.resetButtons();
            if (this.searched)
                this.element.trigger("onPerformSearch", "");
        },

        loadPagesOnOneLevel: function (notLoadedPageNum, searchForward, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact) {
            var self = this;
            var pagesToLoad = [];
            var pageLocations = this.viewerViewModel.getPageLocations();
            var pageWidth = this.viewerViewModel.pageWidth();
            var viewerViewModelPages = this.viewerViewModel.pages();
            var pageBottom = pageLocations[notLoadedPageNum].y + pageWidth * viewerViewModelPages[notLoadedPageNum].prop;
            var i;
            for (i = notLoadedPageNum + 1; i < pageLocations.length; i++) {
                if (Math.abs(pageLocations[i].y + pageWidth * viewerViewModelPages[i].prop - pageBottom) < 2)
                    pagesToLoad.push(i);
                else
                    break;
            }

            for (i = notLoadedPageNum - 1; i >= 0; i--) {
                if (Math.abs(pageLocations[i].y + pageWidth * viewerViewModelPages[i].prop - pageBottom) < 2)
                    pagesToLoad.push(i);
                else
                    break;
            }

            function loadPages() {
                if (pagesToLoad.length == 0)
                    self.findClosestArea(searchForward, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact);
                else
                    self.viewerViewModel.getDocumentPageHtml(pagesToLoad.pop(), loadPages);
            }
            this.viewerViewModel.getDocumentPageHtml(notLoadedPageNum, loadPages);
        },

        getScrollTop: function (scrollTop) {
            var isCurrentHighlightAreaFound = (this.closestArea != null);
            var currentlyHighlightedAreaTop;
            var currentlyHighlightedAreaHeight;

            if (!this.pagesContainerElement)
                this.pagesContainerElement = this.viewerElement.find(".pages_container");
            var pagesContainerTop = this.pagesContainerElement.offset().top;

            var viewerElementHeight = this.viewerElement.height();
            var visibleScreenTop = scrollTop;
            var visibleScreenBottom = scrollTop + viewerElementHeight;

            var currentlyHighlightedAreaTopRelative;
            if (isCurrentHighlightAreaFound) {
                currentlyHighlightedAreaTop = this.closestArea.offset().top;
                currentlyHighlightedAreaHeight = this.closestArea.height();

                currentlyHighlightedAreaTopRelative = currentlyHighlightedAreaTop - pagesContainerTop;
                if (Math.ceil(currentlyHighlightedAreaTopRelative) + currentlyHighlightedAreaHeight >= visibleScreenTop &&
                    Math.floor(currentlyHighlightedAreaTopRelative) <= visibleScreenBottom)
                    scrollTop = currentlyHighlightedAreaTopRelative;
            }
            return scrollTop;
        },

        //isCurrentlyHighlightedAreaVisible: function () {
        //    if (!this.pagesContainerElement)
        //        this.pagesContainerElement = this.viewerElement.find(".pages_container");
        //    var pagesContainerTop = this.pagesContainerElement.offset().top;

        //    var viewerElementHeight = this.viewerElement.height();
        //    var visibleScreenTop = scrollTop;
        //    var visibleScreenBottom = scrollTop + viewerElementHeight;

        //    var currentlyHighlightedAreaTopRelative;
        //    if (isCurrentHighlightAreaFound) {
        //        currentlyHighlightedAreaTop = this.closestArea.offset().top;
        //        currentlyHighlightedAreaHeight = this.closestArea.height();

        //        currentlyHighlightedAreaTopRelative = currentlyHighlightedAreaTop - pagesContainerTop;
        //        if (Math.ceil(currentlyHighlightedAreaTopRelative) + currentlyHighlightedAreaHeight >= visibleScreenTop &&
        //            Math.floor(currentlyHighlightedAreaTopRelative) <= visibleScreenBottom)
        //            scrollTop = currentlyHighlightedAreaTopRelative;
        //    }
        //},

        documentPageSetHandler: function () {
            if (this.useVirtualScrolling && this.searchPageAfterScrollingToIt) {
                var self = this;
                var searchForward = this.searchPageAfterScrollingToIt.searchForward;
                var pageNumber = this.searchPageAfterScrollingToIt.pageNumber;
                this.searchPageAfterScrollingToIt = null;
                this.isWaitingForPageOpening = true;
                window.setTimeout(function () {
                    self.findClosestArea(searchForward,
                        self.isCaseSensitive,
                        self.searchForSeparateWords,
                        self.treatPhrasesInDoubleQuotesAsExactPhrases,
                        self.useAccentInsensitiveSearch,
                        pageNumber);
                }, 1000);
            }
        },

        sortHighlightedAreas: function () {
            this.highlightAreas.sort(function (areaElement1, areaElement2) {
                var jqueryAreaElement2 = $(areaElement2), jqueryAreaElement1 = $(areaElement1);
                var verticalDifference = Math.floor(jqueryAreaElement1.offset().top) - Math.floor(jqueryAreaElement2.offset().top);
                if (Math.abs(verticalDifference) >= 1)
                    return verticalDifference;
                else
                    return jqueryAreaElement1.offset().left - jqueryAreaElement2.offset().left;
            });
        }
    });
})(jQuery);