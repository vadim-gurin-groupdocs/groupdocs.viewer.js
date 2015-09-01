(function ($, undefined) {
    $.groupdocsWidget("groupdocsDocumentImageRendering", {
        _viewModel: null,
        options: {
            fileId: 0,
            _mode: 'webComponent',
            quality: null,
            use_pdf: "true",
            showHyperlinks: true
        },

        _create: function () {
            $.extend(this.options, {
                documentSpace: this.element,
                emptyImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
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
            var vm = new window.groupdocs.documentImageRenderingComponentViewModel(this.options);
            return vm;
        },

        _createHtml: function () {
            var root = this.element;
            this.bindingProvider.createHtml("viewing", this.element, this.options);
            root.trigger("onHtmlCreated");
        }
    });

    window.groupdocs.documentImageRenderingComponentModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(window.groupdocs.documentImageRenderingComponentModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("ServerExchange");
        },

        loadDocument: function (fileId, pagesCountToShow, imageWidth, password, fileDisplayName,
                                watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                ignoreDocumentAbsence,
                                supportPageRotation,
                                supportListOfContentControls, supportListOfBookmarks,
                                instanceIdToken,
                                locale,
                                callback, errorCallback) {
            var onSucceded = function (response) {
                if (response.data != null) {
                    callback.apply(this, [response.data]);
                }
                else {
                    errorCallback.apply(this, [{ code: response.data.code, Reason: (response.data ? response.data.Reason : null) }]);
                }
            };

            this._portalService.viewDocument(fileId, imageWidth, this.quality, this.usePdf, this.preloadPagesCount, password, fileDisplayName,
                watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                ignoreDocumentAbsence, supportPageRotation,
                supportListOfContentControls, supportListOfBookmarks,
                instanceIdToken,
                locale,
                onSucceded, errorCallback);
        },

        loadHyperlinks: function (fileId, callback, errorCallback) {
            this._portalService.getDocumentHyperlinks(fileId,
                function (response) {
                    callback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        retrieveImageUrls: function (fileId, imageCount, pagesDimension,
                                         watermarkText, watermarkColor,
                                         watermarkPosition, watermarkWidth,
                                         ignoreDocumentAbsence,
                                         useHtmlBasedEngine,
                                         supportPageRotation,
                                         instanceIdToken,
                                         locale,
                                         callback, errorCallback) {
            this._portalService.getImageUrlsAsync(fileId, pagesDimension, 0, imageCount, this.quality == null ? '' : this.quality, this.use_pdf,
                                              watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                              ignoreDocumentAbsence,
                                              useHtmlBasedEngine, supportPageRotation,
                                              instanceIdToken,
                                              locale,
            function (response) {
                callback.apply(this, [response.data]);
            },
            function (error) {
                errorCallback.apply(this, [error]);
            });
        }
    });

    window.groupdocs.documentImageRenderingComponentViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(window.groupdocs.documentImageRenderingComponentViewModel.prototype, window.groupdocs.documentComponentViewModel.prototype, {
        Layouts: { ScrollMode: 1, BookMode: 2, OnePageInRow: 3, TwoPagesInRow: 4, CoverThenTwoPagesInRow: 5 },
        _model: null,
        pagesDimension: null,
        pageImageWidth: 0,
        imageHorizontalMargin: 34,
        imageVerticalMargin: 0,
        initialZoom: 100,
        zoom: null,
        scale: null,
        docWasLoadedInViewer: false,
        scrollPosition: [0, 0],
        inprogress: null,
        pages: null,
        pageInd: null,
        pageWidth: null,
        pageHeight: null,
        pageCount: null,
        docType: null,
        fileId: null,
        _dvselectable: null,
        _thumbnailHeight: 140,
        _sessionToken: '',
        imageUrls: [],
        pagePrefix: "page-",
        documentName: null,
        _pageBounds: null,
        unscaledPageHeight: null,
        unscaledPageWidth: null,
        pageLeft: null,
        preloadPagesCount: null,
        viewerLayout: 1,
        changedUrlHash: false,
        hashPagePrefix: "page",
        pageContentType: "image",
        scrollbarWidth: null,
        password: null,
        useJavaScriptDocumentDescription: false,
        minimumImageWidth: null,
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
            this._model = new window.groupdocs.documentImageRenderingComponentModel(options);
            this._init(options);
        },

        _init: function (options) {
            window.groupdocs.documentComponentViewModel.prototype._init.call(this, options);
            return;

            var self = this;

            if (this.viewerLeft != 0) {
                this.viewerWidth -= this.viewerLeft;
                this.documentSpace.css("width", this.viewerWidth + "px");
            }
            var defaultPageImageWidth = 852;
            var defaultPageImageHeight = 1100;
            this.pageImageWidth = defaultPageImageWidth;

            this.pages = this.bindingProvider.getObservableArray([]);
            this.scale = this.bindingProvider.getObservable(this.initialZoom / 100);
            this.inprogress = this.bindingProvider.getObservable(false),
            this.pageLeft = this.bindingProvider.getObservable(0);
            this.pageInd = this.bindingProvider.getObservable(1);
            this.pageWidth = this.bindingProvider.getObservable(defaultPageImageWidth);
            this.pageHeight = this.bindingProvider.getObservable(defaultPageImageHeight);
            this.pageCount = this.bindingProvider.getObservable(0);
            this.docType = this.bindingProvider.getObservable(-1);
            this.documentName = this.bindingProvider.getObservable("");
            this.password = this.bindingProvider.getObservable("");
            this.preloadPagesCount = options.preloadPagesCount;
            this.browserIsChrome = this.bindingProvider.getObservable(false);
            this.hyperlinks = this.bindingProvider.getObservableArray();
            this.useTabsForPages = this.bindingProvider.getObservable(null); // it's undefined 
            this.tabs = this.bindingProvider.getObservableArray([]);
            this.activeTab = this.bindingProvider.getObservable(0);
            this.autoHeight = this.bindingProvider.getObservable(false);
            this.isHtmlDocument = this.bindingProvider.getObservable(false);
            this.alwaysShowLoadingSpinner = this.bindingProvider.getObservable(false);
            this.rotatedWidth = this.bindingProvider.getComputedObservable(function () {
                if (self.useTabsForPages()) {
                    var width = self.pageWidth();
                    return width / self.zoom() * 100.0 + "px";
                }
                else
                    return "auto";
            });

            this.layout = this.bindingProvider.getObservable(this.viewerLayout);
            this.firstVisiblePageForVirtualMode = this.bindingProvider.getObservable(0);
            if (this.firstVisiblePageForVirtualMode.extend)
                this.firstVisiblePageForVirtualMode.extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 400 } });;
            this.lastVisiblePageForVirtualMode = this.bindingProvider.getObservable(0);
            if (this.lastVisiblePageForVirtualMode.extend)
                this.lastVisiblePageForVirtualMode.extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 400 } });;
            this.documentHeight = this.bindingProvider.getObservable(0);

            if (this.pageContentType == "html") {
                this.imageHorizontalMargin = 0;
                this.calculatePointToPixelRatio();
            }

            this.pagePrefix = this.docViewerId + "-page-";

            if (this.pageContentType == "image")
                this.initialWidth = this.pageImageWidth;

            if (this.zoomToFitWidth) {
                this.initialWidth = this.pageImageWidth = this.getFitWidth();
            }

            this.zoom = this.bindingProvider.getObservable(this.initialZoom);
            this.documentHeight = this.bindingProvider.getObservable(0);

            this.options.showHyperlinks = (options.showHyperlinks != false && this.use_pdf != 'false');
            this.options.highlightColor = options.highlightColor;
            this.matchedNods = [];
            this.searchMatches = [];
            this.serverPages = [{ w: this.initialWidth, h: 100 }];

            var pageDescription;
            pageDescription = { number: 1, visible: this.bindingProvider.getObservable(false), url: this.bindingProvider.getObservable(this.emptyImageUrl), htmlContent: this.bindingProvider.getObservable(""), searchText: this.bindingProvider.getObservable(null) };
            if (this.supportPageRotation)
                pageDescription.rotation = this.bindingProvider.getObservable(0);
            if (this.variablePageSizeSupport) {
                pageDescription.prop = this.bindingProvider.getObservable(1);
                pageDescription.heightRatio = this.bindingProvider.getObservable(1);
            }
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

            var pageCountToShow = 1;
            var pageWidth;
            if (this.shouldMinimumWidthBeUsed(this.pageImageWidth * this.initialZoom / 100, false))
                pageWidth = this.minimumImageWidth;
            else
                pageWidth = Math.round(this.pageImageWidth * this.initialZoom / 100);

            this._model.loadDocument(fileId || this.fileId, pageCountToShow, pageWidth, this.password(), this.fileDisplayName,
                this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                this.ignoreDocumentAbsence, this.supportPageRotation,
                this.supportListOfContentControls, this.supportListOfBookmarks,
                this.instanceIdToken,
                this.locale,
                function (response) {
                    //this._onDocumentLoaded(response);
                    if (typeof (fileId) !== 'undefined')
                        this.fileId = fileId;
                    this.pageWidth(this.pageImageWidth * (this.initialZoom / 100));
                    this.zoom(this.initialZoom);
                    if (this.docWasLoadedInViewer)
                        this.setPageNumerInUrlHash(1);

                    this._onDocumentLoadedBeforePdf2Xml(response);
                    //this.preloadImages(response, this.preloadPagesCount);
                }.bind(this),
                function (error) {
                    this._onDocumentLoadFailed(error);
                }.bind(this));

            if (typeof viewModelPathOnlineDoc !== 'undefined')
                viewModelPathOnlineDoc.pathOnlineDoc('');
        },

        retrieveImageUrls: function (imageCount) {
            var i;
            var pageDimension, pageWidth;
            if (this.shouldMinimumWidthBeUsed(this.pageWidth(), true))
                pageWidth = this.minimumImageWidth;
            else
                pageWidth = this.pageWidth();

            pageDimension = Math.floor(pageWidth) + "x";

            this._model.retrieveImageUrls(this.fileId, imageCount, pageDimension,
                this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                this.ignoreDocumentAbsence,
                this.useHtmlBasedEngine, this.supportPageRotation,
                this.instanceIdToken,
                this.locale,
                function (response) {
                    for (i = 0; i < imageCount; i++) {
                        this.pages()[i].url(response.image_urls[i]);
                        this.loadImagesForVisiblePages();
                    }
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this));
        },

        
        _onDocumentLoaded: function (response) {
            this.isDocumentLoaded = true;
            if (this.useJavaScriptDocumentDescription) {
                response.pageCount = this._pdf2XmlWrapper.getPageCount();
            }
            if (!response.imageUrls)
                response.imageUrls = response.image_urls;

            this.triggerEvent('onDocumentLoaded', response);
            var self = this;

            this._sessionToken = response.token;
            this.pageCount(response.pageCount);
            this.documentName(response.name);
            this.docType(response.doc_type);
            this.password(response.password);
            this.matchesCount = 0;

            this.triggerEvent('getPagesCount', response.pageCount);

            if (this.variablePageSizeSupport) {
                response.documentDescription = this._pdf2XmlWrapper.documentDescription;
            }

            var pages = null;
            var pageSize = null;
            var i;
            var rotationFromServer;
            var isTextDocument;
            var scaleRatio;
            if (this.supportListOfContentControls)
                this.contentControls = this._pdf2XmlWrapper.getContentControls();
            if (this.supportListOfBookmarks)
                this.bookmarks = this._pdf2XmlWrapper.getBookmarks();

            if (this.pageContentType == "image") {
                pageSize = this._pdf2XmlWrapper.getPageSize();

                this.scale(this.pageImageWidth * (this.initialZoom / 100) / pageSize.width);
                this.unscaledPageHeight = Number(pageSize.height);
                this.unscaledPageWidth = Number(pageSize.width);

                this.heightWidthRatio = parseFloat(pageSize.Height / pageSize.Width);
                this.pageHeight(Math.round(this.pageImageWidth * this.heightWidthRatio * (this.initialZoom / 100)));

                this.triggerEvent('_onProcessPages', response);
            }
            else if (this.pageContentType == "html") {
                this.watermarkScreenWidth = null;
                this.zoom(100);
                this.fileType = response.fileType;
                this.urlForResourcesInHtml = response.urlForResourcesInHtml;
                isTextDocument = (this.fileType == "Txt" || this.fileType == "Xml");
                this.isHtmlDocument(this.fileType == "Html" || this.fileType == "Htm" || isTextDocument);
                var isDocumentSinglePaged = (response.doc_type == "Cells" || this.isHtmlDocument());
                this.useTabsForPages(isDocumentSinglePaged);
                isDocumentSinglePaged |= (response.doc_type == "Image");
                this.triggerEvent("isDocumentSinglePaged.groupdocs", isDocumentSinglePaged);
                this.alwaysShowLoadingSpinner(!isDocumentSinglePaged);

                var browserIsChrome = $.browser.webkit && !!window.chrome;
                var isChromium = window.chrome;
                var vendorName = window.navigator.vendor;
                var isOpera = window.navigator.userAgent.indexOf("OPR") > -1;
                if (!!isChromium && vendorName === "Google Inc." && isOpera == false)
                    browserIsChrome = true;

                this.browserIsChrome(browserIsChrome);
                var pageCss = response.pageCss[0];
                if (!pageCss)
                    pageCss = "";

                if (this.pageCssElement)
                    this.pageCssElement.remove();

                this.urlForImagesInHtml = response.urlForImagesInHtml;
                this.urlForFontsInHtml = response.urlForFontsInHtml;
                this.pageCssElement = $([]);
                this.preloadedPages = { html: response.pageHtml, css: response.pageCss };
                var firstPageHtml = response.pageHtml[0];
                var firstPage = this.pages()[0];

                pages = this._pdf2XmlWrapper.documentDescription.pages;
                this.autoHeight(this.useTabsForPages());

                var element;
                if (this.useTabsForPages()) {
                    this.pageCount(1);
                    if (this.isHtmlDocument()) {
                        var bodyContents;
                        if (isTextDocument) {
                            bodyContents = "<div class='text_document_wrapper'>" + firstPageHtml + "</div>";
                        }
                        else {
                            var headContents = this.getHtmlElementContents(firstPageHtml, "head");
                            if (headContents) {
                                var styleElementContents = this.getHtmlElements(headContents, "style");
                                var linkElementContents = this.getHtmlElementAttributess(headContents, "link");

                                if (linkElementContents != null) {
                                    for (i = 0; i < linkElementContents.length; i++) {
                                        element = $(linkElementContents[i]);
                                        var rel = element.attr("rel");
                                        if (rel == "stylesheet") {
                                            var uri = element.attr("href");

                                            if (document.createStyleSheet) {
                                                document.createStyleSheet(uri);
                                            }
                                            else {
                                                element = $("<link rel='stylesheet' href='" + uri + "' type='text/css' />");
                                                this.pageCssElement = this.pageCssElement.add(element);
                                                element.appendTo("head");
                                            }
                                        }
                                    }
                                }

                                if (styleElementContents) {
                                    for (i = 0; i < styleElementContents.length; i++) {
                                        var css = styleElementContents[i];
                                        pageCss += css;
                                    }
                                }
                            }

                            bodyContents = this.getPageBodyContentsWithReplace(firstPageHtml);
                        }
                        var bodyContentsElement = $(bodyContents);
                        bodyContentsElement.find("script").remove();
                        bodyContentsElement.addClass('html_document_wrapper');
                        firstPageHtml = bodyContentsElement[0].outerHTML;

                        var fontSizeStyle = ".grpdx .ie .doc-page .html_page_contents > div {font-size:1em;}";
                        pageCss += fontSizeStyle;
                    }
                }
                else {
                    pageSize = this._pdf2XmlWrapper.getPageSize();
                    firstPage.prop(pages[0].h / pages[0].w);
                    scaleRatio = this.getScaleRatioForPage(pageSize.width, pageSize.height, pages[0].w, pages[0].h);
                    firstPage.heightRatio(scaleRatio);
                    this.documentSpace.css("background-color", "inherit");
                }

                element = $("<style>" + pageCss + "</style>");
                this.pageCssElement = this.pageCssElement.add(element);
                element.appendTo("head");

                var sharedCss = response.sharedCss;
                if (sharedCss) {
                    var sharedElement = $("<style>" + sharedCss + "</style>");
                    this.pageCssElement = this.pageCssElement.add(sharedElement);
                    sharedElement.appendTo("head");
                }

                this.calculatePointToPixelRatio();

                var htmlPageContents = this.documentSpace.find(".html_page_contents:first");
                firstPage.htmlContent(firstPageHtml);
                firstPage.visible(true);

                this.clearContentControls();
                this.markContentControls(0);

                this.tabs.removeAll();
                if (this.useTabsForPages()) {
                    var sheets = this._pdf2XmlWrapper.documentDescription.sheets;
                    if (sheets) {
                        for (i = 0; i < sheets.length; i++) {
                            this.tabs.push({
                                name: sheets[i].name,
                                visible: this.bindingProvider.getObservable(false),
                                htmlContent: this.bindingProvider.getObservable(""),
                                searchText: this.bindingProvider.getObservable(null)
                            });
                        }
                    }
                    this.activeTab(0);
                    this.documentSpace.css("background-color", "white");
                    if (this.tabs().length > 0)
                        this.documentSpace.addClass("doc_viewer_tabs");
                    else
                        this.documentSpace.removeClass("doc_viewer_tabs");
                }

                var pageElement = htmlPageContents.children("div,table,img");
                var pageElementWidth;
                if (this.useTabsForPages()) {
                    pageElementWidth = pageElement.width();
                    var pageElementHeight = pageElement.height();
                    firstPage.prop(pageElementHeight / pageElementWidth);
                    pageSize = { width: pageElementWidth, height: pageElementHeight };
                    firstPage.heightRatio(1);
                }

                if (this.supportPageRotation) {
                    if (pages)
                        rotationFromServer = pages[0].rotation;
                    else
                        rotationFromServer = 0;

                    if (typeof rotationFromServer == "undefined")
                        rotationFromServer = 0;
                    this.applyPageRotationInBrowser(0, firstPage, rotationFromServer);
                }

                this.imageHorizontalMargin = 7;

                var pageWidthFromServer = pageSize.width;
                var onlyImageInHtml = false;
                var pageElementChildren = pageElement.children();
                if (pageElementChildren.length == 1 && pageElementChildren.filter("img").length == 1)
                    onlyImageInHtml = true;


                if (this.isHtmlDocument())
                    pageElementWidth = this.getFitWidth();
                else
                    pageElementWidth = pageElement.width();

                this.heightWidthRatio = parseFloat(pageSize.Height / pageSize.Width);

                if (!this.useTabsForPages() || !this.supportPageRotation || firstPage.rotation % 180 == 0)
                    this.pageWidth(pageWidthFromServer * this.pointToPixelRatio);

                this.pageHeight(Math.round(this.pageWidth() * this.heightWidthRatio));
                this.initialWidth = this.pageWidth();
            }

            var pageCount = this.pageCount();
            var pagesNotObservable = [];
            var pageDescription;

            this.serverPages = pages = this._pdf2XmlWrapper.documentDescription.pages;
            if (this.pageContentType == "image") {
                //this.pages.removeAll();
                var pageImageUrl, pageDescriptionCount;
                pageDescriptionCount = this._pdf2XmlWrapper.getPageCount();

                for (i = 0; i < pageCount; i++) {
                    if (i < response.imageUrls.length)
                        pageImageUrl = response.imageUrls[i];
                    else
                        pageImageUrl = "";

                    pageDescription = {
                        number: i + 1,
                        visible: this.bindingProvider.getObservable(false),
                        url: this.bindingProvider.getObservable(pageImageUrl)
                    };
                    if (i < pageDescriptionCount && pages)
                        pageDescription.prop = this.bindingProvider.getObservable(pages[i].h / pages[i].w);
                    else
                        pageDescription.prop = this.bindingProvider.getObservable(this.bindingProvider.getValue(this.pageHeight) / this.bindingProvider.getValue(this.pageWidth));

                    if (this.supportPageRotation) {
                        rotationFromServer = this.serverPages[i].rotation;
                        if (typeof rotationFromServer == "undefined")
                            rotationFromServer = 0;
                        pageDescription.rotation = this.bindingProvider.getObservable(rotationFromServer);
                        this.applyPageRotationInBrowser(i, pageDescription, rotationFromServer);
                    }
                    pageDescription.left = 0;
                    pageDescription.top = this.getPageTop(0);

                    pagesNotObservable.push(pageDescription);
                }
            }
            else if (this.pageContentType == "html") {
                pageDescription = this.pages()[0];
                pagesNotObservable.push(pageDescription);
                var proportion;
                for (i = 1; i < pageCount; i++) {
                    scaleRatio = this.getScaleRatioForPage(pageSize.width, pageSize.height, pages[i].w, pages[i].h);
                    proportion = pages[i].h / pages[i].w;

                    pageDescription = {
                        number: i + 1,
                        visible: this.bindingProvider.getObservable(false),
                        htmlContent: this.bindingProvider.getObservable(""),
                        prop: this.bindingProvider.getObservable(proportion),
                        heightRatio: this.bindingProvider.getObservable(scaleRatio),
                        searchText: this.bindingProvider.getObservable(null)
                    };

                    if (this.supportPageRotation) {
                        rotationFromServer = this.serverPages[i].rotation;
                        if (typeof rotationFromServer == "undefined")
                            rotationFromServer = 0;
                        pageDescription.rotation = this.bindingProvider.getObservable(rotationFromServer);
                        this.applyPageRotationInBrowser(i, pageDescription, rotationFromServer);
                    }
                    pageDescription.left = 0;
                    pageDescription.top = this.getPageTop(0);
                    pagesNotObservable.push(pageDescription);
                }
                
                if (isDocumentSinglePaged)
                    response.pageCount = 0; // for thumbnails after rotation
                this.triggerEvent('_onProcessPages', [response, pagesNotObservable, this.getDocumentPageHtml, this, this.pointToPixelRatio, this.docViewerId]);
            }

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
                    initializeStorageOnly: this.pageContentType == "html",
                    preventTouchEventsBubbling: this.preventTouchEventsBubbling,
                    highlightColor: this.options.highlightColor,
                    useVirtualScrolling: this.useVirtualScrolling,
                    pageLocations: this.pages()
                });
            }
            else {
                this.reInitSelectable();
            }

            if (!this.docWasLoadedInViewer && (this.usePageNumberInUrlHash === undefined || this.usePageNumberInUrlHash == true)) {
                var firstPageLocation = location.pathname;
                if (location.hash.substring(1, this.hashPagePrefix.length + 1) != this.hashPagePrefix)
                    this.setPage(1);

                Sammy(function () {
                    this.get(/\#page(.*)/i, openPath);
                    this.get(firstPageLocation, openFirstPage);

                    function openFirstPage() {
                        if (self.pageInd() != 1)
                            self.setPage(1);
                    }

                    function openPath() {
                        if (!self.changedUrlHash) {
                            if (this.params.splat.length == 0 || this.params.splat[0].length == 0) {
                            }
                            else {
                                var hashString = this.params.splat[0];
                                //hashString = hashString.substring(1);
                                var newPageIndex = Number(hashString);
                                if (isNaN(newPageIndex))
                                    newPageIndex = 1;
                                if (newPageIndex > self.pageCount())
                                    newPageIndex = self.pageCount();
                                if (newPageIndex < 1)
                                    newPageIndex = 1;
                                self.setPage(newPageIndex);
                            }
                        }
                    }
                }).run();
            }
            else {
                this.setPage(1);
            }

            if (!this.zoomToFitHeight)
                this.loadImagesForVisiblePages(true);

            this.adjustInitialZoom();
            this.docWasLoadedInViewer = true;

            // get a list of document hyperlinks from the server
            if (this.pageContentType == "image" && this._mode != "webComponent") {
                this._loadHyperlinks();
            }

            if (this.preloadPagesOnBrowserSide) {
                var preloadPagesCount = this.preloadPagesCount;
                if (preloadPagesCount === null || preloadPagesCount > this.pageCount())
                    preloadPagesCount = this.pageCount();

                this.loadImagesForPages(1, preloadPagesCount);
            }

            this.triggerEvent('onScrollDocView', { pi: 1, direction: "up", position: 0 });
            this.triggerEvent("onDocumentLoadComplete", [response, this._pdf2XmlWrapper]);
            this.triggerEvent("documentLoadCompleted.groupdocs");
        },

        _onDocumentHyperlinksLoaded: function (response) {
            if (!response || !response.links) {
                this.hyperlinks.removeAll();
                return;
            }

            var links = [];
            var self = this;
            var selectable = this.getSelectableInstance();

            $.each(response.links, function () {
                var l = {
                    url: this.Url,
                    pageNumber: this.PageNumber,
                    targetPage: this.TargetPage,
                    rect: new groupdocs.Rect(this.Bounds.X, this.Bounds.Y, this.Bounds.X + this.Bounds.Width, this.Bounds.Y + this.Bounds.Height)
                };
                l.frame = this.bindingProvider.getObservable(selectable != null ? selectable.convertPageAndRectToScreenCoordinates(l.pageNumber, l.rect) : l.rect);
                links.push(l);
            });

            this.hyperlinks(links);
        },

        _loadHyperlinks: function () {
            if (this.options.showHyperlinks == true) {
                this._model.loadHyperlinks(
                    this.fileId,
                    this._onDocumentHyperlinksLoaded.bind(this),
                    function (error) {
                    });
            }
        },

        _refreshHyperlinkFrames: function () {
            var selectable = this.getSelectableInstance();

            $.each(this.hyperlinks(), function () {
                this.frame(selectable != null ? selectable.convertPageAndRectToScreenCoordinates(this.pageNumber, this.rect) : this.rect);
            });
        },

        ScrollDocView: function (item, e) {
            var isSetCalled = this.isSetCalled;
            this.isSetCalled = false;
            if (isSetCalled)
                return;
            if (this.useTabsForPages())
                return;
            //var direction;
            var pageIndex = null;
            var panelHeight = this.documentSpace.height();
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
                this.pageInd(pageIndex);
                this.setPageNumerInUrlHash(pageIndex);
                this.triggerEvent('onScrollDocView', { pi: pageIndex, position: st });
                this.triggerEvent("documentScrolledToPage.groupdocs", [pageIndex]);
            }
        },

        ScrollDocViewEnd: function (item, e) {
            if (this.useTabsForPages())
                return;

            this.isSetCalled = false;
            this.scrollPosition = [$(e.target).scrollLeft(), $(e.target).scrollTop()];
            var numbers = this.loadImagesForVisiblePages();

            if (this._dvselectable) {
                $(this._dvselectable).groupdocsSelectable("setVisiblePagesNumbers", numbers);
            }
            this.triggerEvent('onDocumentPageSet', [this.pageInd()]);
            this.triggerEvent("documentScrolledToPage.groupdocs", [this.pageInd()]);
        },

        loadImagesForPages: function (start, end, forceLoading) {
            var pages = this.pages();
            var cssForAllPages = "";
            var page;
            var isPageVisible;
            for (var i = start; i <= end; i++) {
                page = pages[i - 1];
                isPageVisible = page.visible();

                if (this.pageContentType == "image") {
                    this.triggerImageLoadedEvent(i);

                    if (this.supportPageRotation && forceLoading) {
                        this.addSuffixToImageUrl(page);
                    }
                }
                else if (this.pageContentType == "html") {
                    if (isPageVisible)
                        this.markContentControls(i - 1);

                    if (!isPageVisible) {
                        this.getDocumentPageHtml(i - 1);
                    }
                }
                page.visible(true);
            }
        },

        triggerImageLoadedEvent: function (pageIndex) {
            if ($.browser.msie) {
                if (!this.pages()[pageIndex - 1].visible()) {
                    $("img#img-" + pageIndex).load(function () {
                        this.triggerEvent("onPageImageLoaded");
                    });
                }
            }
        },

        setZoom: function (value) {
            this.zoom(value);
            this.loadPagesZoomed();
            this.clearContentControls();

            if (this.pageContentType == "image") {
                if (this._pdf2XmlWrapper) {
                    var pageSize = this._pdf2XmlWrapper.getPageSize();
                    this.scale(this.pageImageWidth / pageSize.width * value / 100);
                }

                var selectable = this.getSelectableInstance();
                selectable.changeSelectedRowsStyle(this.scale());
                this.reInitSelectable();
                if (this.useVirtualScrolling) {
                    selectable.recalculateSearchPositions(this.scale());
                    this.highlightSearch();
                }
                this.setPage(this.pageInd());

                if (this.shouldMinimumWidthBeUsed(this.pageWidth(), true))
                    this.loadImagesForVisiblePages();

                if (this.options.showHyperlinks) {
                    this._refreshHyperlinkFrames();
                }
            }
            else if (this.pageContentType == "html") {
                this.reInitSelectable();
                this.setPage(this.pageInd());
                this.loadImagesForVisiblePages();
            }

            this.reflowPagesInChrome(true);
            
        },

        loadPagesZoomed: function () {
            var newWidth = Math.round(this.initialWidth * (this.zoom()) / 100);
            var newHeight = Math.round(newWidth * this.heightWidthRatio);
            var pages = this.pages();

            if (newWidth != this.pageWidth() || newHeight != this.pageHeight()) {
                this.pagesDimension = Math.floor(newWidth) + 'x';

                this.pageWidth(newWidth);
                this.pageHeight(newHeight);
                if (this.useTabsForPages()) {
                    var htmlPageContents = this.documentSpace.find(".html_page_contents:first");
                    var pageElement = htmlPageContents.children("div,table,img");
                    var dimensions = pageElement[0].getBoundingClientRect();
                    var reserveHeight = 20;
                    var autoHeight = this.autoHeight();
                    this.autoHeight(true);
                    pages[0].prop((dimensions.height + reserveHeight) / newWidth);
                    this.autoHeight(autoHeight);
                }
                else {
                    this.calculatePagePositions();
                }

                if (this.pageContentType == "image") {
                    var pageCount = this.pageCount();
                    if (!this.shouldMinimumWidthBeUsed(newWidth, true))
                        this.retrieveImageUrls(pageCount);
                }
            }
        },

        performSearch: function (value, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch) {
            var selectable = this.getSelectableInstance();
            if (selectable != null) {
                var searchCountItem = selectable.performSearch(value, this.scale(), isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch);
                this.triggerEvent('onSearchPerformed', [searchCountItem]);
            }
        },

        selectTextInRect: function (rect, clickHandler, pageNumber, selectionCounter, color, hoverHandlers) {
            if (this._dvselectable) {
                return $(this._dvselectable).groupdocsSelectable('highlightPredefinedArea', rect, clickHandler, pageNumber, selectionCounter, color, hoverHandlers);
            }
            return null;
        },

        deselectTextInRect: function (rect, deleteStatic, pageNumber, selectionCounter) {
            if (this._dvselectable) {
                $(this._dvselectable).groupdocsSelectable('unhighlightPredefinedArea', rect, deleteStatic, pageNumber, selectionCounter);
            }
        },

        shouldMinimumWidthBeUsed: function (width, checkOriginalDocumentWidth) {
            var originalDocumentWidth = null;
            if (this.use_pdf != 'false' && checkOriginalDocumentWidth) {
                var pageSize = this._pdf2XmlWrapper.getPageSize();
                originalDocumentWidth = pageSize.width;
            }
            return this.minimumImageWidth != null &&
                (width <= this.minimumImageWidth || (originalDocumentWidth !== null && originalDocumentWidth < this.minimumImageWidth));
        },

        applyPageRotationInBrowser: function (pageNumber, page, angle) {
            if (!this.supportPageRotation)
                return;
            var oldRotation = page.rotation();
            if (oldRotation == 0 && angle == 0)
                return;

            if (this.pageContentType == "image" && oldRotation != angle) {
                page.visible(false);
                this.addSuffixToImageUrl(page);
                page.visible(true);
            }

            page.rotation(angle);
            var newAngle = page.rotation() % 180;

            var pagesFromServer = this._pdf2XmlWrapper.documentDescription.pages;
            var pageSize, pageFromServer;

            var pageWidth, pageHeight, maxPageHeight;
            if (this.useTabsForPages()) {
                var htmlPageContents = this.documentSpace.find(".html_page_contents:first");
                var pageElement = htmlPageContents.children("div,table");
                pageWidth = pageElement.width();
                pageHeight = pageElement.height();
                this.initialWidth = pageWidth;

                if (newAngle > 0) {
                    maxPageHeight = pageWidth;
                }
                else {
                    maxPageHeight = pageHeight;
                }
                this.pageWidth(pageWidth * this.zoom() / 100);
                return;
            }
            else {
                if (pagesFromServer) {
                    pageSize = this.getPageSize();
                    pageFromServer = pagesFromServer[pageNumber];
                    pageFromServer.rotation = angle;
                    pageWidth = pageFromServer.w;
                    pageHeight = pageFromServer.h;
                    maxPageHeight = pageSize.height;
                }
                else
                    return;
            }

            var scaleRatio;

            if (newAngle > 0) {
                page.prop(pageWidth / pageHeight);
                if (this.pageContentType == "html") {
                    scaleRatio = this.getScaleRatioForPage(pageSize.width, pageSize.height, pageHeight, pageWidth);
                    page.heightRatio(scaleRatio);
                }
            }
            else {
                page.prop(pageHeight / pageWidth);
                if (this.pageContentType == "html") {
                    scaleRatio = this.getScaleRatioForPage(pageSize.width, pageSize.height, pageWidth, pageHeight);
                    page.heightRatio(scaleRatio);
                }
            }
            this.calculatePagePositions();
            this.reInitSelectable();
            var selectable = this.getSelectableInstance();
            if (selectable != null)
                selectable.clearSelectionOnPage(pageNumber);
            this.loadImagesForVisiblePages(true);
        },

        adjustInitialZoom: function () {
            if (this.zoomToFitHeight)
                this.setZoom(this.getFitHeightZoom());

            if (this.pageContentType == "html" && this.zoomToFitWidth) {
                var fittingWidth = this.getFitWidth();
                var originalPageWidth = this.pageWidth();
                if (!this.onlyShrinkLargePages || originalPageWidth > fittingWidth) {
                    var zoom = fittingWidth / originalPageWidth * 100;
                    this.setZoom(zoom);
                }
            }
        },

        addSuffixToImageUrl: function (page) {
            var src = page.url();
            var prefixChar = "?";
            var dummyIndex = src.indexOf('dummy=');
            if (dummyIndex != -1) {
                src = src.substring(0, dummyIndex - 1);
            }

            var paramsIndex = src.indexOf('?');
            if (paramsIndex != -1)
                prefixChar = "&";
            page.url(src + prefixChar + 'dummy=' + new Date().getTime());
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
                result.width = pageWidth + (this.useHtmlBasedEngine ? this.imageHorizontalMargin : 0) + 'px';
                if (this.autoHeight()) {
                    result.height = 'auto';
                    result.overflow = 'visible';
                }
                else {
                    if (index < pages.length)
                        result.height = pageWidth * pages[index].prop() + 'px';
                    result.overflow = 'hidden';
                }
            }
            return result;
        },

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