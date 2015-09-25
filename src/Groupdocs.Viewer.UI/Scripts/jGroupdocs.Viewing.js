(function ($, undefined) {
    "use strict";

    $.groupdocsWidget("groupdocsDocumentComponent", {
        _viewModel: null,
        options: {
            fileId: 0
        },

        _create: function () {
            $.extend(this.options, {
                documentSpace: this.element
            });
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
            var vm = new window.groupdocs.documentComponentViewModel(this.options);
            return vm;
        },

        _createHtml: function () {
            var root = this.element;
            this.bindingProvider.createHtml("viewing", this.element, this.options);
            root.trigger("onHtmlCreated");
        }
    });

    window.groupdocs.documentComponentModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(window.groupdocs.documentComponentModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("ServerExchange");
        },
        
        reorderPage: function (fileId, oldPosition, newPosition, instanceIdToken, callback, errorCallback) {
            this._portalService.reorderPage(fileId, oldPosition, newPosition,
                instanceIdToken,
                function (response) {
                    callback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        rotatePage: function (path, pageNumber, rotationAmount, instanceIdToken, successCallback, errorCallback) {
            this._portalService.rotatePage(path, pageNumber, rotationAmount,
                instanceIdToken,
                function (response) {
                    successCallback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        }
    });

    window.groupdocs.documentComponentViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(window.groupdocs.documentComponentViewModel.prototype, {
        Layouts: { ScrollMode: 1, BookMode: 2, OnePageInRow: 3, TwoPagesInRow: 4, CoverThenTwoPagesInRow: 5 },
        _model: null,
        pageImageWidth: 0,
        defaultPageImageWidth: 852,
        imageHorizontalMargin: 34,
        pageWrapperHorizontalMargin: 7,
        imageVerticalMargin: 0,
        initialZoom: 100,
        zoom: null,
        scale: null,
        scrollPosition: [0, 0],
        inprogress: null,
        pages: null,
        pageIndex: null,
        pageWidth: null,
        pageHeight: null,
        pageCount: null,
        docType: null,
        fileId: null,
        _dvselectable: null,
        imageUrls: [],
        pagePrefix: "page-",
        documentName: null,
        unscaledPageHeight: null,
        pageLeft: null,
        preloadPagesCount: null,
        viewerLayout: 1,
        changedUrlHash: false,
        hashPagePrefix: "page",
        scrollbarWidth: null,
        password: null,
        fileDisplayName: null,
        hyperlinks: null,
        watermarkText: null,
        watermarkWidth: null,
        watermarkColor: null,
        watermarkLeft: null,
        watermarkTop: null,
        watermarkScreenWidth: null,
        searchText: null,
        htmlSearchHighlightClassName: "search_highlight_html",
        htmlSearchHighlightElement: "span",
        htmlSearchHighlightSvgElement: "tspan",
        currentWordCounter: 0,
        matchedNods: null,
        searchMatches: null,
        matchedNodsCount: 0,
        matchesCount: null,
        searchSeparatorsList: "\\-[\\]{}()*+?\\\\^|\\s.,:;+\"/",
        usePngImagesForHtmlBasedEngine: false,
        loadAllPagesOnSearch: false,
        serverPages: null,
        convertWordDocumentsCompletely: false,
        ignoreDocumentAbsence: false,
        tabs: null,
        useTabsForPages: null,
        tabPanelHeight: 30,
        supportPageRotation: false,
        fileType: null,
        activeTab: null,
        autoHeight: null,
        isHtmlDocument: null,
        rotatedWidth: null,
        alwaysShowLoadingSpinner: null,
        supportListOfContentControls: false,
        supportListOfBookmarks: false,
        isDocumentLoaded: false,

        options: {
            showHyperlinks: true
        },

        _create: function (options) {
            this._model = new window.groupdocs.documentComponentModel(options);
            this._init(options);
        },

        _init: function (options) {
            var self = this;

            if (this.viewerLeft != 0) {
                this.viewerWidth -= this.viewerLeft;
                this.documentSpace.css("width", this.viewerWidth + "px");
            }
            var defaultPageImageWidth = this.defaultPageImageWidth;
            var defaultPageImageHeight = 1100;
            this.pageImageWidth = defaultPageImageWidth;

            this.pages = this.bindingProvider.getObservableArray([]);
            this.scale = this.bindingProvider.getObservable(this.initialZoom / 100);
            this.inprogress = this.bindingProvider.getObservable(false),
            this.pageLeft = this.bindingProvider.getObservable(0);
            this.pageIndex = this.bindingProvider.getObservable(1);
            this.pageWidth = this.bindingProvider.getObservable(defaultPageImageWidth);
            this.pageHeight = this.bindingProvider.getObservable(defaultPageImageHeight);
            this.pageCount = this.bindingProvider.getObservable(0);
            this.docType = this.bindingProvider.getObservable(-1);
            this.documentName = this.bindingProvider.getObservable("");
            this.password = this.bindingProvider.getObservable("");
            this.preloadPagesCount = options.preloadPagesCount;
            this.browserIsChrome = this.bindingProvider.getObservable(false);
            this.hyperlinks = this.bindingProvider.getObservableArray();
            this.autoHeight = this.bindingProvider.getObservable(false);
            this.alwaysShowLoadingSpinner = this.bindingProvider.getObservable(false);
            this.layout = this.bindingProvider.getObservable(this.viewerLayout);
            this.firstVisiblePageForVirtualMode = this.bindingProvider.getObservable(0);
            if (this.firstVisiblePageForVirtualMode.extend)
                this.firstVisiblePageForVirtualMode.extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 400 } });;
            this.lastVisiblePageForVirtualMode = this.bindingProvider.getObservable(0);
            if (this.lastVisiblePageForVirtualMode.extend)
                this.lastVisiblePageForVirtualMode.extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 400 } });;
            this.documentHeight = this.bindingProvider.getObservable(0);

            this.pagePrefix = this.docViewerId + "-page-";

            if (this.zoomToFitWidth)
                this.initialWidth = this.pageImageWidth = this.getFitWidth();

            this.zoom = this.bindingProvider.getObservable(this.initialZoom);
            this.documentHeight = this.bindingProvider.getObservable(0);

            this.options.showHyperlinks = (options.showHyperlinks != false);
            this.options.highlightColor = options.highlightColor;
            this.matchedNods = [];
            this.searchMatches = [];
            this.serverPages = [{ w: this.initialWidth, h: 100 }];

            var pageDescription;
            pageDescription = {
                number: 1,
                visible: this.bindingProvider.getObservable(false),
                url: this.bindingProvider.getObservable(this.emptyImageUrl),
                htmlContent: this.bindingProvider.getObservable(""),
                searchText: this.bindingProvider.getObservable(null)
            };
            if (this.supportPageRotation)
                pageDescription.rotation = this.bindingProvider.getObservable(0);
            pageDescription.prop = this.bindingProvider.getObservable(1);
            pageDescription.heightRatio = this.bindingProvider.getObservable(1);
            pageDescription.left = 0;
            pageDescription.top = this.getPageTop(0);
            this.pages.push(pageDescription);
            this.pagesContainerElement = this.documentSpace.find(".pages_container");
            this.contentControlsFromHtml = new Array();
            this.getScrollbarWidth();

            if (options.fileId) {
                this.loadDocument();
            }
            else {
                pageDescription.visible(true);
            }
        },

        loadDocument: function (fileId) {
            this.inprogress(true);
            this.triggerEvent('onDocumentloadingStarted');
        },
        
        _onError: function (error) {
            this.inprogress(false);
            var errorFunction = (window.jGDError && window.jGDError[this.instanceId]);
            if (errorFunction)
                errorFunction(error.Reason || "The document couldn't be loaded...");
        },

        _onDocumentLoadFailed: function (error) {
            this.inprogress(false);

            if (error.code == 'Unauthorized')
                this.triggerEvent('onDocumentPasswordRequired');
            else {
                this._onError(error);
                this.triggerEvent("documentLoadFailed.groupdocs");
            }
        },

        _onDocumentLoadedBeforePdf2Xml: function (response) {
            var self = this;

            function callOnDocumentLoaded() {
                self._onDocumentLoaded(response);
            }

            var options = {
                documentDescription: response.documentDescription,
                callback: callOnDocumentLoaded,
                synchronousWork: this.textSelectionSynchronousCalculation
            };

            if (this._pdf2XmlWrapper)
                this._pdf2XmlWrapper.initWithOptions(options);
            else
                this._pdf2XmlWrapper = new groupdocs.JavaScriptDocumentDescriptionWrapper(options);
            this._onDocumentLoaded(response);
        },

        _onDocumentLoaded: function (response) {
            this.isDocumentLoaded = true;
            response.pageCount = this._pdf2XmlWrapper.getPageCount();
            response.documentDescription = this._pdf2XmlWrapper.documentDescription;

            if (!response.imageUrls)
                response.imageUrls = response.image_urls;

            this.triggerEvent('onDocumentLoaded', response);
            var self = this;

            this.pageCount(response.pageCount);
            this.documentName(response.name);
            this.docType(response.doc_type);
            this.password(response.password);
            this.matchesCount = 0;

            this.triggerEvent('getPagesCount', response.pageCount);
            
            if (this.supportListOfContentControls)
                this.contentControls = this._pdf2XmlWrapper.getContentControls();
            if (this.supportListOfBookmarks)
                this.bookmarks = this._pdf2XmlWrapper.getBookmarks();

            var pagesNotObservable = this.initPagesAfterDocumentLoad(response);
            this.pages(pagesNotObservable);
            this.calculatePagePositions();
            this.inprogress(false);

            var scale = this.scale();
            this._dvselectable = this.pagesContainerElement;
            if (this.getSelectableInstance() == null) {
                this.pagesContainerElement.groupdocsSelectable({
                    txtarea: this.selectionContent,
                    pdf2XmlWrapper: this._pdf2XmlWrapper,
                    startNumbers: this.getVisiblePagesNumbers(),
                    pagesCount: this.pageCount(),
                    proportion: scale,
                    pageHeight: this.getPageHeight(),
                    docSpace: this.documentSpace,
                    pagePrefix: this.pagePrefix,
                    searchPartialWords: this.searchPartialWords,
                    initializeStorageOnly: this.useHtmlBasedEngine,
                    preventTouchEventsBubbling: this.preventTouchEventsBubbling,
                    highlightColor: this.options.highlightColor,
                    useVirtualScrolling: this.useVirtualScrolling,
                    pageLocations: this.pages(),
                    documentSpaceLeft: this.viewerLeft
                });
            }
            else {
                this.reInitSelectable();
            }

            this.setPage(1);

            if (!this.zoomToFitHeight)
                this.loadImagesForVisiblePages(true);

            this.adjustInitialZoom();

            if (this.preloadPagesOnBrowserSide) {
                var preloadPagesCount = this.preloadPagesCount;
                if (preloadPagesCount === null || preloadPagesCount > this.pageCount())
                    preloadPagesCount = this.pageCount();

                this.loadImagesForPages(1, preloadPagesCount);
            }

            this.triggerEvent('onScrollDocView', { pi: 1, direction: "up", position: 0 });
            this.triggerEvent("documentLoadCompleted.groupdocs", [response, this._pdf2XmlWrapper]);
        },

        setContainerWidth: function (containerWidth) {
            this.viewerWidth = containerWidth;
        },

        setContainerHeight: function (containerHeight) {
            this.viewerHeight = containerHeight;
        },

        getFitWidth: function () {
            var viewerWidth;
            if (this.viewerWidth)
                viewerWidth = this.viewerWidth;
            else
                viewerWidth = this.documentSpace.width();
            var scrollbarWidth = this.getScrollbarWidth();

            return viewerWidth - scrollbarWidth - 2 * (this.imageHorizontalMargin + 1);
        },

        getFitWidthZoom: function () {
            return this.getFitWidth() / this.initialWidth * 100;
        },
        
        getViewerHeight: function () {
            var viewerHeight;
            if (this.viewerHeight)
                viewerHeight = this.viewerHeight;
            else
                viewerHeight = this.documentSpace.parent().height();
            return viewerHeight;
        },

        getFitHeightZoom: function () {
            var viewerHeight = this.getViewerHeight();
            return (viewerHeight - (this.imageVerticalMargin + 2)) / Math.round(this.initialWidth * this.heightWidthRatio) * 100;
        },

        getScrollbarWidth: function () {
            if (this.scrollbarWidth == null) {
                // Create the measurement node
                var scrollDivJquery = $("<div/>").css("width", "100px").css("height", "100px")
                    .css("overflow", "scroll").css("position", "absolute").css("top", "-9999px");
                var scrollDiv = scrollDivJquery[0];
                document.body.appendChild(scrollDiv);

                // Get the scrollbar width
                this.scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

                // Delete the DIV 
                document.body.removeChild(scrollDiv);
            }
            return this.scrollbarWidth;
        },

        getPageHeight: function () {
            return this.unscaledPageHeight * this.scale();
        },

        ScrollDocView: function (item, e) {
            var isSetCalled = this.isSetCalled;
            this.isSetCalled = false;
            if (isSetCalled)
                return;
            //var direction;
            var pageIndex = null;
            var st = $(e.target).scrollTop();

            this.triggerEvent('onBeforeScrollDocView', { position: st });
            var selectable = this.getSelectableInstance();
            if (selectable == null)
                return null;

            selectable.initStorage();

            var pageLocations = selectable.pageLocations;
            var pageImageTop, pageImageBottom;
            var pages = this.pages();

            var visiblePageNumbers;
            visiblePageNumbers = this.getVisiblePagesNumbers();

            var documentSpaceHeight = this.documentSpace.height();
            var nearestPageNumber = null, maxPartWhichIntersects = null;
            var topOfIntersection, bottomOfIntersection, lengthOfIntersection, partWhichIntersects;
            var pageHeight;
            for (var i = visiblePageNumbers.start - 1; i <= visiblePageNumbers.end - 1; i++) {
                if (this.useVirtualScrolling)
                    pageImageTop = pages[i].top();
                else
                    pageImageTop = pageLocations[i].y;
                pageHeight = pages[i].prop() * this.pageWidth();
                pageImageBottom = Math.floor(pageImageTop + pageHeight);
                topOfIntersection = Math.max(pageImageTop, st);
                bottomOfIntersection = Math.min(pageImageBottom, st + documentSpaceHeight);
                lengthOfIntersection = bottomOfIntersection - topOfIntersection;
                partWhichIntersects = lengthOfIntersection / pageHeight;

                if (maxPartWhichIntersects == null || partWhichIntersects > maxPartWhichIntersects) {
                    maxPartWhichIntersects = partWhichIntersects;
                    nearestPageNumber = i;
                }
            }
            pageIndex = nearestPageNumber + 1;
            
            if (pageIndex !== null) {
                this.pageIndex(pageIndex);
                this.triggerEvent('onScrollDocView', { pi: pageIndex, position: st });
                this.triggerEvent("documentScrolledToPage.groupdocs", [pageIndex]);
            }
        },

        ScrollDocViewEnd: function (item, e) {
            this.isSetCalled = false;
            this.scrollPosition = [$(e.target).scrollLeft(), $(e.target).scrollTop()];
            var numbers = this.loadImagesForVisiblePages();

            if (this._dvselectable) {
                $(this._dvselectable).groupdocsSelectable("setVisiblePagesNumbers", numbers);
            }
            this.triggerEvent('onDocumentPageSet', [this.pageIndex()]);
            this.triggerEvent("documentScrolledToPage.groupdocs", [this.pageIndex()]);
        },

        getVisiblePagesNumbers: function () {
            if (!this.isDocumentLoaded)
                return null;

            var start = null;
            var end = null;
            var scrollTop = this.documentSpace.scrollTop();
            var pageHeight;
            var documentSpaceHeight = this.documentSpace.height();

            var selectable = this.getSelectableInstance();
            if (selectable == null && !this.useVirtualScrolling)
                return null;
            var pages = this.pages();
            var pageLocations;
            var pageCount;
            pageCount = pages.length;

            var pageImageTop, pageImageBottom;
            for (var i = 0; i < pageCount; i++) {
                pageImageTop = pages[i].top();

                pageHeight = pages[i].prop() * this.pageWidth();

                pageImageBottom = pageImageTop + pageHeight;
                if ((pageImageTop >= scrollTop && pageImageTop <= scrollTop + documentSpaceHeight) ||
                    (pageImageBottom >= scrollTop && pageImageBottom <= scrollTop + documentSpaceHeight) ||
                    (pageImageTop <= scrollTop && pageImageBottom >= scrollTop + documentSpaceHeight)) {
                    if (start === null)
                        start = i + 1;
                    else
                        end = i + 1;
                }
            }
            if (end === null)
                end = start;

            return { start: start, end: end };
        },

        loadImagesForVisiblePages: function (forceLoading) {
            var numbers = this.getVisiblePagesNumbers();
            if (numbers != null) {
                var start = numbers.start;
                var end = numbers.end;
                if (start !== null && end !== null) {
                    this.loadImagesForPages(start, end, forceLoading);
                    if (this.useVirtualScrolling) {
                        this.firstVisiblePageForVirtualMode(numbers.start - 1);
                        this.lastVisiblePageForVirtualMode(numbers.end - 1);
                    }
                }
            }
            return numbers;
        },

        loadImagesForPages: function (start, end, forceLoading) {
            var pages = this.pages();
            var page;
            for (var i = start; i <= end; i++) {
                page = pages[i - 1];
                this.loadImageForPage(i - 1, page, forceLoading);
                page.visible(true);
            }
        },

        setPage: function (index) {
            this.isSetCalled = true;
            var newPageIndex = Number(index);

            if (isNaN(newPageIndex) || newPageIndex < 1)
                newPageIndex = 1;

            this.pageIndex(newPageIndex);

            var pageTop;
            if (this.useVirtualScrolling) {
                pageTop = this.pages()[newPageIndex - 1].top();
            }
            else {
                var selectable = this.getSelectableInstance();
                if (selectable != null) {
                    if (selectable.pageLocations && selectable.pageLocations.length > 0) {
                        var pageImageTop = selectable.pageLocations[newPageIndex - 1].y;
                        pageTop = pageImageTop;
                    }
                }
            }

            var oldScrollTop = this.documentSpace.scrollTop();
            this.documentSpace.scrollTop(pageTop);
            if (this.documentSpace.scrollTop() == oldScrollTop) {
                this.isSetCalled = false;
            }

            this.triggerEvent('onDocViewScrollPositionSet', { position: pageTop });
            var page = this.pages()[newPageIndex - 1];
            this.makePageVisible(newPageIndex - 1, page);

            this.triggerEvent("documentPageSet.groupdocs", newPageIndex);
        },

        setZoom: function (value) {
            this.zoom(value);
            this.loadPagesZoomed();
        },

        loadPagesZoomed: function () {
            var newWidth = Math.round(this.initialWidth * (this.zoom()) / 100);
            var newHeight = Math.round(newWidth * this.heightWidthRatio);
            var changed = false;
            if (newWidth != this.pageWidth() || newHeight != this.pageHeight()) {
                this.pageWidth(newWidth);
                this.pageHeight(newHeight);
                changed = true;
            }
            return changed ? newWidth : null;
        },

        getWords: function (phrase) {
            var separatorsRegexString = "[^" + this.searchSeparatorsList + "]+";
            var separatorsRegex = new RegExp(separatorsRegexString, "g");
            var matches = phrase.match(separatorsRegex);
            var words;
            if (matches == null) {
                words = null;
            }
            else {
                words = $.map(matches,
                function (val, index) {
                    if (val != '') {
                        return val;
                    }
                });
            }
            return words;
        },

        reInitSelectable: function () {
            var visiblePagesNumbers = this.getVisiblePagesNumbers();
            var selectable = this.getSelectableInstance();
            if (selectable != null) {
                selectable.reInitPages(this.scale(), visiblePagesNumbers,
                    this.scrollPosition, this.getPageHeight(), this.pageCount(), this.pages(),
                    this.viewerLeft);
            }
        },

        reInitCanvasOffset: function () {
            var selectable = this.getSelectableInstance();
            selectable.initCanvasOffset();
        },

        openCurrentPage: function () {
            this.setPage(this.pageIndex());
        },

        isScrollViewerVisible: function () {
            var isVisible = this.documentSpace.is(":visible");
            return isVisible;
        },

        getSelectableInstance: function () {
            if (this._dvselectable == null)
                return null;
            var selectable = this._dvselectable.data("groupdocsSelectable");
            return selectable;
        },

        resizeViewerElement: function (viewerLeft) {
            var parent = this.documentSpace.parent();
            var parentWidth = parent.width();
            if (typeof viewerLeft == "undefined")
                viewerLeft = 0;
            else
                this.viewerLeft = viewerLeft;
            this.documentSpace.width(parentWidth - viewerLeft);
            this.calculatePagePositions();
            this.reInitSelectable();
            this.loadImagesForVisiblePages();
        },

        onPageReordered: function (oldPosition, newPosition) {
            this._model.reorderPage(this.fileId, oldPosition, newPosition,
                this.instanceIdToken,
                function (response) {
                    if (!this.useHtmlBasedEngine) {
                        var pages = this.pages();
                        var pageImageUrl;
                        var minPosition = Math.min(oldPosition, newPosition);
                        var maxPosition = Math.max(oldPosition, newPosition);
                        for (var i = minPosition; i <= maxPosition; i++) {
                            pageImageUrl = pages[i].url();
                            pages[i].url(pageImageUrl + "#0"); // to avoid caching
                            pages[i].visible(true);
                        }
                    }
                    if (this._pdf2XmlWrapper)
                        this._pdf2XmlWrapper.reorderPage(oldPosition, newPosition);
                    this.reInitSelectable();
                    this.loadImagesForVisiblePages();
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this)
            );
        },

        rotatePage: function (rotationAmount) {
            var pageNumber = this.pageIndex() - 1;
            this._model.rotatePage(this.fileId, pageNumber, rotationAmount,
                this.instanceIdToken,
                function (response) {
                    var page = this.pages()[pageNumber];
                    this.applyPageRotationInBrowser(pageNumber, page, response.resultAngle);
                    this.reflowPagesInChrome();
                    this.setPage(pageNumber + 1);
                    this.loadImagesForVisiblePages(true);
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this));
        },

        applyPageRotationInBrowser: function (pageNumber, page, angle) {
            if (!this.supportPageRotation)
                return;
            var oldRotation = page.rotation();
            if (oldRotation == 0 && angle == 0)
                return;

            if (oldRotation != angle) {
                this.refreshPageContents(page);
            }

            page.rotation(angle);

            var pageWidth, pageHeight;
            if (this.calculatePageSize())
                return;

            var pagesFromServer = this._pdf2XmlWrapper.documentDescription.pages;
            var pageSize, pageFromServer;

            if (pagesFromServer) {
                pageSize = this.getPageSize();
                pageFromServer = pagesFromServer[pageNumber];
                pageFromServer.rotation = angle;
                pageWidth = pageFromServer.w;
                pageHeight = pageFromServer.h;
            }
            else
                return;

            var newAngle = page.rotation() % 180;

            if (newAngle > 0) {
                page.prop(pageWidth / pageHeight);
                this.setScaleRatioForPage(page, pageSize.width, pageSize.height, pageHeight, pageWidth);
            }
            else {
                page.prop(pageHeight / pageWidth);
                this.setScaleRatioForPage(page, pageSize.width, pageSize.height, pageWidth, pageHeight);
            }
            this.calculatePagePositions();
            this.reInitSelectable();
            var selectable = this.getSelectableInstance();
            if (selectable != null)
                selectable.clearSelectionOnPage(pageNumber);
            this.loadImagesForVisiblePages(true);
        },

        isPageVisible: function (pageNumber) {
            return this.pages()[pageNumber].visible();
        },

        getPageLocations: function () {
            return this.getSelectableInstance().pageLocations;
        },

        getPageSize: function () {
            var pageSize = this._pdf2XmlWrapper.getPageSize();
            return pageSize;
        },

        adjustInitialZoom: function () {
            if (this.zoomToFitHeight)
                this.setZoom(this.getFitHeightZoom());
        },

        intToColor: function (num) {
            if (num === null)
                num = 0xFFFF0000; // default is red
            else
                num >>>= 0;

            var b = num & 0xFF,
                g = (num & 0xFF00) >>> 8,
                r = (num & 0xFF0000) >>> 16,
                a = ((num & 0xFF000000) >>> 24) / 255;
            return "rgba(" + [r, g, b, a].join(",") + ")";
        },
        
        setLoadingState: function (set) {
            this.inprogress(set);
        },

        pageElementStyle: function (index) {
            var result = {};
            var pages = this.pages();
            if (this.useVirtualScrolling) {
                var firstVisiblePageNum = this.firstVisiblePageForVirtualMode();
                index += firstVisiblePageNum;
                if (firstVisiblePageNum < pages.length)
                    result.top = pages[firstVisiblePageNum].top() + 'px';
            }
            else
                result.top = '';

            if (this.layout() == this.Layouts.OnePageInRow) {
                result.display = 'block';
                result.marginLeft = 'auto';
                result.marginRight = 'auto';
            }
            else {
                result.display = '';
                result.marginLeft = '';
                result.marginRight = '';
            }

            var pageWidth = this.pageWidth();

            if (this.options.useEmScaling) {
                result.width = this.serverPages[index].w * this.pointToPixelRatio / 16. + 'em';
                result.height = this.serverPages[index].h * this.pointToPixelRatio / 16. + 'em';
            }
            else {
                if (this.autoHeight()) {
                    result.height = 'auto';
                    result.overflow = 'visible';
                    return result;
                }

                if (this.supportPageRotation && this.useTabsForPages && this.useTabsForPages()) {
                    var page = pages[index];
                    if (page.rotation() % 180 > 0) {
                        result.width = pageWidth * page.prop();
                        result.height = pageWidth;
                    }
                    else {
                        result.width = pageWidth;
                        result.height = pageWidth * page.prop();
                    }
                    return result;
                }
                else
                    result.width = pageWidth + (this.useHtmlBasedEngine ? this.imageHorizontalMargin : 0) + 'px';

                if (index < pages.length)
                    result.height = pageWidth * pages[index].prop() + 'px';
                result.overflow = 'hidden';
            }
            return result;
        },

        pagesContainerStyle: function () {
            var layout = this.layout();
            return {
                height: this.useVirtualScrolling  ? (this.documentHeight() + "px") : "auto",
                width: (layout == this.Layouts.TwoPagesInRow || layout == this.Layouts.CoverThenTwoPagesInRow) ?
                        (this.pageWidth() + this.pageWrapperHorizontalMargin) * 2 + "px" : "auto"
            };
        },

        loadingOverlayStyle: function (page) {
            return {
                display: ((this.alwaysShowLoadingSpinner() || this.inprogress() || !page.visible()) ? 'block' : 'none'), 
                zIndex: (this.inprogress() || !page.visible() ? 2 : 0),
                width: this.pageWidth() + 'px',
                height: this.autoHeight() ? '100%' : (this.pageWidth() * page.prop() + 'px'),
                backgroundColor: (this.inprogress() || !page.visible() ? '' : 'transparent')
            }
        },

        setLayout: function (layout) {
            this.layout(layout);
            this.calculatePagePositions();
            this.loadImagesForVisiblePages();
        },

        calculatePagePositions: function () {
            var pageVerticalMargin = 15; // pixels
            var pageHorizontalMargin = this.pageWrapperHorizontalMargin; // pixels from left
            var pages = this.pages();
            var width = this.pageWidth();
            var documentHeight = 0;
            var page, proportion, pageHeight;
            var pageLeft, pageTop;
            var rowHeight = 0;
            var pagesInRow;
            var scrollbarWidth = 0;
            var documentSpaceRect = this.documentSpace.get(0).getBoundingClientRect();
            var documentSpaceWidth = documentSpaceRect.width;
            var layout = this.layout();
            for (var pass = 0; pass <= 1; pass++) {
                pageLeft = pageHorizontalMargin;
                pageTop = 0;
                switch (layout) {
                case this.Layouts.ScrollMode:
                    var widthWithMargin = width + pageHorizontalMargin;
                    var pagesContainerWidth = documentSpaceWidth - scrollbarWidth;
                    pagesInRow = Math.floor(pagesContainerWidth / widthWithMargin);
                    if (pagesInRow == 0)
                        pagesInRow = 1;
                    break;
                case this.Layouts.OnePageInRow:
                    pagesInRow = 1;
                    break;
                case this.Layouts.TwoPagesInRow:
                case this.Layouts.CoverThenTwoPagesInRow:
                    pagesInRow = 2;
                    break;
                }

                var isFirstPageInRow, isLastPageInRow;
                var i;
                for (i = 0; i < pages.length; i++) {
                    page = pages[i];
                    proportion = page.prop();
                    pageHeight = width * proportion;
                    page.left = pageLeft;
                    page.top(pageTop);
                    isFirstPageInRow = (layout != this.Layouts.CoverThenTwoPagesInRow && i % pagesInRow == 0)
                        || (layout == this.Layouts.CoverThenTwoPagesInRow && (i == 0 || i % pagesInRow == 1));

                    isLastPageInRow = layout == this.Layouts.OnePageInRow
                        || (layout == this.Layouts.TwoPagesInRow && i % pagesInRow == 1)
                        || (layout == this.Layouts.CoverThenTwoPagesInRow && (i == 0 || i % pagesInRow == 0))
                        || (layout == this.Layouts.ScrollMode && i % pagesInRow == pagesInRow - 1);

                    if (isFirstPageInRow || (!isFirstPageInRow && pageHeight > rowHeight))
                        rowHeight = pageHeight;
                    documentHeight = pageTop + rowHeight + pageVerticalMargin;

                    if (isLastPageInRow) {
                        pageTop += rowHeight + pageVerticalMargin;
                        if (layout != this.Layouts.OnePageInRow)
                            pageLeft = pageHorizontalMargin;
                    }
                    else {
                        if (layout != this.Layouts.OnePageInRow)
                            pageLeft += width + pageHorizontalMargin;
                    }
                }
                this.documentHeight(documentHeight);

                var isScrollbarPresent = false;
                if (layout == this.Layouts.OnePageInRow || layout == this.Layouts.ScrollMode) {
                    isScrollbarPresent = documentHeight > documentSpaceRect.height;
                    if (isScrollbarPresent)
                        scrollbarWidth = this.getScrollbarWidth();
                }
                if (layout != this.Layouts.ScrollMode || !isScrollbarPresent)
                    break;
            }

            if (layout == this.Layouts.OnePageInRow) {
                pageLeft = (documentSpaceWidth - width - scrollbarWidth) / 2;
                for (i = 0; i < pages.length; i++) {
                    page = pages[i];
                    page.left = pageLeft;
                }
            }
        },
        
        getPageTop: function (initialValue) {
            if (this.useVirtualScrolling)
                return this.bindingProvider.getObservable(initialValue);
            else
                return this.getAccessor(initialValue);
        },

        getAccessor: function (initialValue) {
            var value = initialValue;
            return function (param) {
                if (typeof param == "undefined")
                    return value;
                else
                    value = param;
            };
        },

        triggerEvent: function (name, params) {
            this.documentSpace.trigger(name, params);
        },

        // protected interface - overriden in children
        refreshPageContents: function () {
        },

        setScaleRatioForPage: function (page, widthForMaxHeight, maxPageHiegt, pageWidth) {
        },

        calculatePageSize: function () {
        },

        reflowPagesInChrome: function () {
        },
        // end of protected interface

        highlightSearch: function () {
            if (this.useVirtualScrolling) {
                var selectable = this.getSelectableInstance();
                if (selectable) {
                    selectable.highlightSearch(this.firstVisiblePageForVirtualMode(),
                                                this.lastVisiblePageForVirtualMode());
                }
            }
        }
    });
})(jQuery);