(function ($, undefined) {
    $.groupdocsWidget("groupdocsViewingComponent", {
        _viewModel: null,
        options: {
            fileId: 0,
            fileVersion: 1,
            userId: 0,
            userKey: null,
            baseUrl: null,
            _mode: 'full',
            _docGuid: '',
            quality: null,
            use_pdf: "true",
            showHyperlinks: true
        },

        _create: function () {
            $.extend(this.options, {
                documentSpace: this.element,
                emptyImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            });
            if (this.options.createHtml) {
                this._createHtml();
            }
            this._viewModel = this.getViewModel();
            window.groupdocs.bindingProvider.prototype.applyBindings(this._viewModel, this.element);
            //ko.applyBindings(this._viewModel, this.element.get(0));
        },

        _init: function () {
            $(this._viewModel).bind('getPagesCount', function (e, pagesCount) {
                $(this.element).trigger('getPagesCount', [pagesCount]);
            }.bind(this));

            $(this._viewModel).bind('onDocumentLoaded', function (e, response) {
                this.element.trigger('onDocumentLoaded', response);
            }.bind(this));

            $(this._viewModel).bind('onDocumentPasswordRequired', function (e) {
                $(this.element).trigger('onDocumentPasswordRequired');
            }.bind(this));

            $(this._viewModel).bind('_onProcessPages', function (e, data) {
                $(this.element).trigger('_onProcessPages', [data]);
            }.bind(this));

            $(this._viewModel).bind('onProcessPages', function (e, path) {
                $(this.element).trigger('onProcessPages', [path]);
            }.bind(this));

            $(this._viewModel).bind('onScrollDocView', function (e, data) {
                $(this.element).trigger('onScrollDocView', [data]);
            }.bind(this));

            $(this._viewModel).bind('onBeforeScrollDocView', function (e, data) {
                $(this.element).trigger('onBeforeScrollDocView', [data]);
            }.bind(this));

            $(this._viewModel).bind('onDocumentLoadComplete', function (e, data, pdf2XmlWrapper) {
                $(this.element).trigger('onDocumentLoadComplete', [data, pdf2XmlWrapper]);
            }.bind(this));

            $(this._viewModel).bind('onSearchPerformed', function (e, searchCountItem) {
                $(this.element).trigger('onSearchPerformed', [searchCountItem]);
            }.bind(this));

            $(this._viewModel).bind('onPageImageLoaded', function (e) {
                $(this.element).trigger('onPageImageLoaded');
            }.bind(this));

            $(this._viewModel).bind('onDocViewScrollPositionSet', function (e, data) {
                $(this.element).trigger('onDocViewScrollPositionSet', [data]);
            }.bind(this));

            $(this._viewModel).bind('onDocumentPageSet', function (e, newPageIndex) {
                $(this.element).trigger('onDocumentPageSet', [newPageIndex]);
            }.bind(this));
        },

        getViewModel: function () {
            if (this._viewModel == null) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        _createViewModel: function () {
            var vm = new docViewerViewModel(this.options);
            return vm;
        },

        _createHtml: function () {
            var root = this.element;
            //window.groupdocs.bindingProvider.createHtmlAndApplyBindings("viewing", this._viewModel, this.element, this.options);
            //var viewerHtml = window.groupdocs.bindingProvider.componentHtml["viewing"](this.options);
            window.groupdocs.bindingProvider.prototype.createHtml("viewing", this.element, this.options);
            //$(viewerHtml).appendTo(root);
            root.trigger("onHtmlCreated");
        }
    });

    // Doc Viewer Model
    docViewerModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(docViewerModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("PortalService");
        },

        loadDocument: function (fileId, pagesCountToShow, imageWidth, password, fileDisplayName,
                                watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                ignoreDocumentAbsence,
                                supportPageRotation,
                                supportListOfContentControls, supportListOfBookmarks,
                                instanceIdToken,
                                callback, errorCallback,
                                locale) {
            var onSucceded = function (response) {
                if (response.data != null && typeof (response.data.path) !== "undefined") {
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
                onSucceded, errorCallback,
                false,
                instanceIdToken,
                locale);
        },

        loadDocumentAsHtml: function (fileId, pagesCountToShow, fileDisplayName, usePngImages, convertWordDocumentsCompletely,
                                      watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                      ignoreDocumentAbsence, supportPageRotation,
                                      supportListOfContentControls, supportListOfBookmarks,
                                      embedImagesIntoHtmlForWordFiles,
                                      instanceIdToken,
                                      callback, errorCallback, locale) {
            this._portalService.viewDocumentAsHtml(this.userId, this.userKey, fileId, this.preloadPagesCount, fileDisplayName, usePngImages,
                                                   convertWordDocumentsCompletely,
                                                   watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                                   ignoreDocumentAbsence, supportPageRotation,
                                                   supportListOfContentControls, supportListOfBookmarks,
                                                   embedImagesIntoHtmlForWordFiles,
                function (response) {
                    if (response.data && typeof (response.data.path) !== "undefined") {
                        callback.apply(this, [response.data]);
                    }
                    else {
                        errorCallback.apply(this);
                    }
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                },
                false,
                instanceIdToken,
                locale
            );
        },

        loadProperties: function (fileId, callback) {
            this._portalService.getDocInfoAsync(this.userId, this.userKey, fileId,
                function (response) {
                    callback.apply(this, [response.data]);
                });
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

        retrieveImageUrls: function (fileId, token, imageCount, pagesDimension,
                                         watermarkText, watermarkColor,
                                         watermarkPosition, watermarkWidth,
                                         ignoreDocumentAbsence,
                                         useHtmlBasedEngine,
                                         supportPageRotation,
                                         instanceIdToken,
                                         callback, errorCallback,
                                         locale) {
            this._portalService.getImageUrlsAsync(this.userId, this.userKey, fileId, pagesDimension, token, 0, imageCount, this.quality == null ? '' : this.quality, this.use_pdf, this.fileVersion,
                                              watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                              ignoreDocumentAbsence,
                                              useHtmlBasedEngine, supportPageRotation,
            function (response) {
                callback.apply(this, [response.data]);
            },
            function (error) {
                errorCallback.apply(this, [error]);
            },
            instanceIdToken,
            locale
        );
        },

        getDocumentPageHtml: function (fileId, pageNumber, usePngImages,
                                       embedImagesIntoHtmlForWordFiles,
                                       instanceIdToken,
                                       callback, errorCallback, locale) {
            this._portalService.getDocumentPageHtml(fileId, pageNumber, usePngImages,
                embedImagesIntoHtmlForWordFiles,
                function (response) {
                    callback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                },
                instanceIdToken,
                locale
            );
        },

        reorderPage: function (fileId, oldPosition, newPosition, instanceIdToken, callback, errorCallback) {
            this._portalService.reorderPage(fileId, oldPosition, newPosition,
                function (response) {
                    callback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                },
                instanceIdToken
            );
        },

        rotatePage: function (path, pageNumber, rotationAmount, instanceIdToken, successCallback, errorCallback) {
            this._portalService.rotatePage(path, pageNumber, rotationAmount,
                function (response) {
                    successCallback.apply(this, [response.data]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                },
                instanceIdToken
            );
        }
    });

    // Doc Viewer View Model
    docViewerViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };
    $.extend(docViewerViewModel.prototype, {
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
        _firstPage: null,
        _sessionToken: '',
        imageUrls: [],
        pagePrefix: "page-",
        documentName: null,
        fit90PercentWidth: false,
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
            this._model = new docViewerModel(options);
            this._init(options);
        },

        _init: function (options) {
            var self = this;
            this.initCustomBindings();

            if (this.viewerLeft != 0) {
                this.viewerWidth -= this.viewerLeft;
                this.documentSpace.css("width", this.viewerWidth + "px");
            }
            var defaultPageImageWidth = 852;
            var defaultPageImageHeight = 1100;
            this.pageImageWidth = defaultPageImageWidth;

            this.bindingProvider = new window.groupdocs.bindingProvider();
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
            this.rotatedWidth = ko.computed(function () {
                if (this.useTabsForPages()) {
                    var width;
                    //if (this.supportPageRotation && this.pages) {
                    //var page = this.pages()[0];
                    //if (page && page.rotation() % 180 > 0)
                    //    width = this.pageWidth() * page.prop();
                    //else
                    //    width = this.pageWidth();
                    //}
                    //else
                    width = this.pageWidth();

                    return width / this.zoom() * 100.0 + "px";
                }
                else
                    return "auto";
            }, this);

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

            if (!this.docViewerId)
                this.docViewerId = this.documentSpace.attr('id');
            this.pagePrefix = this.docViewerId + "-page-";

            if (options.fit90PercentWidth)
                this.pageImageWidth = this.documentSpace.width() * 0.9 - 2 * this.imageHorizontalMargin;

            if (this.pageContentType == "image")
                this.initialWidth = this.pageImageWidth;

            if (this.zoomToFitWidth) {
                this.initialWidth = this.pageImageWidth = this.getFitWidth();
                //this.initialZoom = this.getFitWidthZoom();
            }

            this.zoom = this.bindingProvider.getObservable(this.initialZoom);
            this.documentHeight = this.bindingProvider.getObservable(0);

            this.options.showHyperlinks = (options.showHyperlinks != false && this.use_pdf != 'false');
            this.options.highlightColor = options.highlightColor;
            this.matchedNods = [];
            this.searchMatches = [];
            this.serverPages = [{ w: this.initialWidth, h: 100 }];

            var pageDescription;
            if (this.pages().length == 0) {
                pageDescription = { number: 1, visible: this.bindingProvider.getObservable(false), url: this.bindingProvider.getObservable(this.emptyImageUrl), htmlContent: this.bindingProvider.getObservable(""), searchText: this.bindingProvider.getObservable(null) };
                if (this.supportPageRotation)
                    pageDescription.rotation = this.bindingProvider.getObservable(0);
                if (this.variableHeightPageSupport) {
                    pageDescription.prop = this.bindingProvider.getObservable(1);
                    pageDescription.heightRatio = this.bindingProvider.getObservable(1);
                }
                if (this.useVirtualScrolling) {
                    pageDescription.left = 0;
                    pageDescription.top = this.bindingProvider.getObservable(0);
                }
                this.pages.push(pageDescription);
            }
            this.pagesContainerElement = this.documentSpace.find(".pages_container");
            this.contentControlsFromHtml = new Array();

            if (options.fileId) {
                this.loadDocument();
            }
            else {
                pageDescription.visible(true);
            }
        },

        loadDocument: function (fileId) {
            this.inprogress(true);
            this.documentSpace.trigger('onDocumentloadingStarted');

            var pageCountToShow = 1;
            if (this.pageContentType == "image") {
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
                    }.bind(this),
                    this.locale);
            }
            else if (this.pageContentType == "html") {
                this._model.loadDocumentAsHtml(fileId || this.fileId, pageCountToShow, this.fileDisplayName, this.usePngImagesForHtmlBasedEngine,
                    this.convertWordDocumentsCompletely,
                    this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                    this.ignoreDocumentAbsence, this.supportPageRotation,
                    this.supportListOfContentControls, this.supportListOfBookmarks,
                    this.embedImagesIntoHtmlForWordFiles,
                    this.instanceIdToken,
                    function (response) {
                        if (typeof (fileId) !== 'undefined')
                            this.fileId = fileId;
                        this.pageWidth(this.pageImageWidth * (this.initialZoom / 100));
                        this._onDocumentLoadedBeforePdf2Xml(response);
                        //this._onDocumentLoaded(response);
                    }.bind(this),
                    function (error) {
                        this._onDocumentLoadFailed(error);
                    }.bind(this),
                    this.locale
                );
            }

            if (typeof viewModelPathOnlineDoc !== 'undefined')
                viewModelPathOnlineDoc.pathOnlineDoc('');
        },

        getDocumentPageHtml: function (pageNumber, successCallback) {
            var page;
            if (this.useTabsForPages()) {
                page = this.tabs()[pageNumber];
            }
            else {
                page = this.pages()[pageNumber];
            }

            if (!page.visible() && !page.startedDownloadingPage) {
                var pageHtml = this.preloadedPages && this.preloadedPages.html[pageNumber];
                if (pageHtml) {
                    page.htmlContent(pageHtml);
                    var pageCss = this.preloadedPages.css[pageNumber];
                    this.setPageHtml(page, pageNumber, pageHtml, pageCss);
                    if (successCallback)
                        successCallback.call();
                    return;
                }

                page.startedDownloadingPage = true;
                this._model.getDocumentPageHtml(this.fileId, pageNumber, this.usePngImagesForHtmlBasedEngine,
                    this.embedImagesIntoHtmlForWordFiles,
                    this.instanceIdToken,
                    function (response) {
                        this.setPageHtml(page, pageNumber, response.pageHtml, response.pageCss);
                        if (successCallback)
                            successCallback.call();
                    }.bind(this),
                    function (error) {
                        page.startedDownloadingPage = false;
                        this._onError(error);
                    }.bind(this),
                    this.locale
                );
            }
        },


        setPageHtml: function (page, pageNumber, pageHtml, pageCss) {
            var css = pageCss;

            if (!this.pageCssElement)
                this.pageCssElement = $([]);

            if (this.browserIsIE9OrLess) {
                var firstStyle = this.pageCssElement.filter("style:first");
                css = firstStyle.html();
                firstStyle.remove();
                css += pageCss;
            }

            var styleElement = $("<style type='text/css'>" + css + "</style>");
            this.pageCssElement = this.pageCssElement.add(styleElement);
            styleElement.appendTo("head");

            var useTabsForPages = this.useTabsForPages();
            if (useTabsForPages || useTabsForPages === null) { // null means no document loaded
                pageHtml = pageHtml.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");
            }

            page.htmlContent(pageHtml);

            var searchParameters = {
                text: this.searchText,
                isCaseSensitive: false,
                searchForSeparateWords: this.searchForSeparateWords,
                treatPhrasesInDoubleQuotesAsExact: this.treatPhrasesInDoubleQuotesAsExact,
                pageNumber: pageNumber
            };

            if (this.useVirtualScrolling) {
                page.parsedHtmlElement = $(pageHtml);
                page.currentValue = pageHtml;
                this.parseSearchParameters(page.parsedHtmlElement.not("style")[0], searchParameters);
            }
            page.searchText(searchParameters);

            //                        if (this.preloadPagesOnBrowserSide) {
            //                            var preloadPagesCount = this.preloadPagesCount;
            //                            if (preloadPagesCount === null)
            //                                preloadPagesCount = this.pageCount();
            //                            var pages = this.pages();
            //                            var areAllLoaded = true;
            //                            var pageNum;
            //                            for (pageNum = 0; pageNum < preloadPagesCount; pageNum++) {
            //                                if (pages[pageNum].htmlContent() == null) {
            //                                    areAllLoaded = false;
            //                                    break;
            //                                }
            //                            }
            //                            if (areAllLoaded) {
            //                                for (pageNum = 0; pageNum < preloadPagesCount; pageNum++) {
            //                                    pages[pageNum].visible(true);
            //                                }
            //                            }
            //                        }
            //                        else
            page.visible(true);
            page.startedDownloadingPage = false;
            this.markContentControls(pageNumber);
        },

        addPageCss: function (pageCss) {
            var css = pageCss;

            if (!this.pageCssElement)
                this.pageCssElement = $([]);

            if (this.browserIsIE9OrLess) {
                var firstStyle = this.pageCssElement.filter("style:first");
                css = firstStyle.html();
                firstStyle.remove();
                css += pageCss;
            }

            var styleElement = $("<style type='text/css'>" + css + "</style>");
            this.pageCssElement = this.pageCssElement.add(styleElement);
            styleElement.appendTo("head");
        },

        retrieveImageUrls: function (imageCount) {
            var i;
            var pageDimension, pageWidth;
            if (this.shouldMinimumWidthBeUsed(this.pageWidth(), true))
                pageWidth = this.minimumImageWidth;
            else
                pageWidth = this.pageWidth();

            pageDimension = Math.floor(pageWidth) + "x";

            this._model.retrieveImageUrls(this.fileId, this._sessionToken, imageCount, pageDimension,
                this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                this.ignoreDocumentAbsence,
                this.useHtmlBasedEngine, this.supportPageRotation,
                this.instanceIdToken,
                function (response) {
                    for (i = 0; i < imageCount; i++) {
                        this.pages()[i].url(response.image_urls[i]);
                        this.loadImagesForVisiblePages();
                    }
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this),
                this.locale);
        },

        _onError: function (error) {
            this.inprogress(false);
            var errorFunction = window.jerror || (window.jGDError && window.jGDError[this.instanceId]);
            if (errorFunction)
                errorFunction(error.Reason || "The document couldn't be loaded...");
        },

        _onDocumentLoadFailed: function (error) {
            this.inprogress(false);

            if (error.code == 'Unauthorized')
                $(this).trigger('onDocumentPasswordRequired');
            else {
                this._onError(error);
                this.documentSpace.trigger("documentLoadFailed.groupdocs");
            }
        },

        _onDocumentLoadedBeforePdf2Xml: function (response) {
            var self = this;

            function callOnDocumentLoaded() {
                self._onDocumentLoaded(response);
            }

            var options = {
                userId: this.userId,
                privateKey: this.userKey,
                fileId: this.fileId,
                path: response.path,
                documentDescription: response.documentDescription,
                callback: callOnDocumentLoaded
            };

            if (this.useJavaScriptDocumentDescription) {
                options.synchronousWork = this.textSelectionSynchronousCalculation;
                options.descForHtmlBasedEngine = (this.pageContentType == "html"
                    || this.use_pdf == 'false');
                this._pdf2XmlWrapper = new groupdocs.Pdf2JavaScriptWrapper(options);
                this._onDocumentLoaded(response);
            }
        },

        _onDocumentLoaded: function (response) {
            this.isDocumentLoaded = true;
            if (this.useJavaScriptDocumentDescription) {
                response.pageCount = this._pdf2XmlWrapper.getPageCount();
            }

            if (!response.page_size)
                response.page_size = {};

            $(this).trigger('onDocumentLoaded', response);
            var self = this;

            this._sessionToken = response.token;
            this.docGuid = response.path;
            this.pageCount(response.pageCount);
            this.documentName(response.name);
            this.docType(response.doc_type);
            this.password(response.password);
            this.matchesCount = 0;

            $(this).trigger('getPagesCount', response.pageCount);

            if (this.variableHeightPageSupport) {
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
                if (this.use_pdf != 'false' || this.variableHeightPageSupport) {
                    pageSize = this._pdf2XmlWrapper.getPageSize();
                    //if (typeof pageSize.height === "undefined")
                    //    jerror("The page size of this document can't be determined");
                    if (this.variableHeightPageSupport) {
                        response.page_size.Width = pageSize.width;
                        response.page_size.Height = pageSize.height;
                    }

                    this.scale(this.pageImageWidth * (this.initialZoom / 100) / pageSize.width);
                    this.unscaledPageHeight = Number(pageSize.height);
                    this.unscaledPageWidth = Number(pageSize.width);
                }

                this.heightWidthRatio = parseFloat(response.page_size.Height / response.page_size.Width);
                this.pageHeight(Math.round(this.pageImageWidth * this.heightWidthRatio * (this.initialZoom / 100)));

                $(this).trigger('_onProcessPages', response);
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
                this.documentSpace.trigger("isDocumentSinglePaged.groupdocs", isDocumentSinglePaged);
                this.alwaysShowLoadingSpinner(!isDocumentSinglePaged);

                //this.useTabsForPages(response.doc_type == "Cells");
                var browserIsChrome = $.browser.webkit && !!window.chrome;
                this.browserIsChrome(browserIsChrome);
                var pageCss = response.pageCss[0];
                if (!pageCss)
                    pageCss = "";

                if (this.pageCssElement)
                    this.pageCssElement.remove();

                this.urlForImagesInHtml = response.urlForImagesInHtml;
                this.urlForFontsInHtml = response.urlForFontsInHtml;
                //pageCss = this.replaceFontUrls(pageCss);
                this.pageCssElement = $([]);
                this.preloadedPages = { html: response.pageHtml, css: response.pageCss };
                var firstPageHtml = response.pageHtml[0];
                //var pageElementFromHtml = $(firstPageHtml);
                var firstPage = this.pages()[0];

                //var pageElement = this.documentSpace.find(".html_page_contents:first > div");

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

                                //var styleElements = documentElement.find("style");
                                if (styleElementContents) {
                                    for (i = 0; i < styleElementContents.length; i++) {
                                        var css = styleElementContents[i];
                                        pageCss += css;
                                        //element = $("<style>" + css + "</style>");
                                        //this.pageCssElement = this.pageCssElement.add(element);
                                        //element.appendTo("head");
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

                //var bodyContentsFromHtml = this.fixImageReferencesInHtml(firstPageHtml);
                this.calculatePointToPixelRatio();

                var htmlPageContents = this.documentSpace.find(".html_page_contents:first");
                firstPage.htmlContent(firstPageHtml);
                firstPage.visible(true);

                this.clearContentControls();
                this.markContentControls(0);

                //var viewerHeight = this.getViewerHeight();
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
                }

                if (this.useTabsForPages() && this.tabs().length > 0)
                    this.documentSpace.addClass("doc_viewer_tabs");
                else
                    this.documentSpace.removeClass("doc_viewer_tabs");

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

                response.page_size.Width = pageSize.width;
                response.page_size.Height = pageSize.height;
                var pageWidthFromServer = pageSize.width;
                var onlyImageInHtml = false;
                var pageElementChildren = pageElement.children();
                if (pageElementChildren.length == 1 && pageElementChildren.filter("img").length == 1)
                    onlyImageInHtml = true;

                var oldWidth = null;
                if (!onlyImageInHtml && !this.useTabsForPages()) {
                    oldWidth = pageElement.css("width");
                    pageElement.css("width", pageWidthFromServer + "pt");
                }

                if (this.isHtmlDocument())
                    pageElementWidth = this.getFitWidth();
                else
                    pageElementWidth = pageElement.width();

                this.heightWidthRatio = parseFloat(response.page_size.Height / response.page_size.Width);

                if (!this.useTabsForPages() || !this.supportPageRotation || firstPage.rotation % 180 == 0)
                    this.pageWidth(pageElementWidth);

                if (oldWidth !== null && typeof oldWidth != "undefined")
                    pageElement.css("width", oldWidth);
                this.pageHeight(Math.round(this.pageWidth() * this.heightWidthRatio));
                this.initialWidth = this.pageWidth();
            }

            var pageCount = this.pageCount();
            var pagesNotObservable = [];
            var pageDescription;

            if (this.pageContentType == "image") {
                //this.pages.removeAll();
                var pageImageUrl, pageDescriptionCount;
                if (this.variableHeightPageSupport) {
                    this.serverPages = pages = this._pdf2XmlWrapper.documentDescription.pages;
                    pageDescriptionCount = this._pdf2XmlWrapper.getPageCount();
                    //pageDescriptionCount = pages.length;
                }

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
                    if (this.variableHeightPageSupport) {
                        if (i < pageDescriptionCount && pages)
                            pageDescription.prop = this.bindingProvider.getObservable(pages[i].h / pages[i].w);
                        else
                            pageDescription.prop = this.bindingProvider.getObservable(this.bindingProvider.getValue(this.pageHeight) / this.bindingProvider.getValue(this.pageWidth));
                    }

                    if (this.supportPageRotation) {
                        rotationFromServer = this.serverPages[i].rotation;
                        if (typeof rotationFromServer == "undefined")
                            rotationFromServer = 0;
                        pageDescription.rotation = this.bindingProvider.getObservable(rotationFromServer);
                        this.applyPageRotationInBrowser(i, pageDescription, rotationFromServer);
                    }
                    if (this.useVirtualScrolling) {
                        pageDescription.left = 0;
                        pageDescription.top = this.bindingProvider.getObservable(0);
                    }

                    pagesNotObservable.push(pageDescription);
                }
            }
            else if (this.pageContentType == "html") {
                this.serverPages = pages = this._pdf2XmlWrapper.documentDescription.pages;
                //this.pages.splice(1, this.pages().length - 1);
                //var documentHeight = 0;
                //var pageTop = 0;

                pageWidth = this.pageWidth();
                pageDescription = this.pages()[0];
                //var layout = this.layout();
                //if (layout != this.Layouts.TwoPagesInRow)
                //    pageTop += pageWidth * pageDescription.prop();
                //documentHeight += pageWidth * pageDescription.prop();
                pagesNotObservable.push(pageDescription);
                var proportion;
                //var cssForAllPages = "";
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

                    //var pageHtml = this.preloadedPages && this.preloadedPages.html[i];
                    //if (pageHtml) {
                    //    pageDescription.htmlContent(pageHtml);
                    //    if (this.preloadedPages.css[i])
                    //        cssForAllPages += this.preloadedPages.css[i];
                    //    pageDescription.visible(true);
                    //}

                    if (this.supportPageRotation) {
                        rotationFromServer = this.serverPages[i].rotation;
                        if (typeof rotationFromServer == "undefined")
                            rotationFromServer = 0;
                        pageDescription.rotation = this.bindingProvider.getObservable(rotationFromServer);
                        this.applyPageRotationInBrowser(i, pageDescription, rotationFromServer);
                    }
                    if (this.useVirtualScrolling) {
                        pageDescription.left = 0;
                        pageDescription.top = this.bindingProvider.getObservable(0);
                    }
                    //    if (layout == this.Layouts.OnePageInRow
                    //        || (layout == this.Layouts.TwoPagesInRow && i % 2 == 1)
                    //        || (layout == this.Layouts.CoverThenTwoPagesInRow && i % 2 == 0)) {
                    //        pageTop += pageWidth * proportion;
                    //        documentHeight = pageTop;
                    //    }
                    //    else
                    //        documentHeight = pageTop + pageHeight;

                    //    //pageTop += pageWidth * proportion * scaleRatio;
                    //}
                    pagesNotObservable.push(pageDescription);
                }

                //if (this.useVirtualScrolling)
                //    this.documentHeight(documentHeight);
                if (isDocumentSinglePaged)
                    response.pageCount = 0; // for thumbnails after rotation
                this.documentSpace.trigger('_onProcessPages', [response, pagesNotObservable, this.getDocumentPageHtml, this, this.pointToPixelRatio, this.docViewerId]);

                //if (cssForAllPages != "")
                //    this.addPageCss(cssForAllPages);
            }

            this.pages(pagesNotObservable);
            this.calculatePagePositionsForVirtualMode();

            this._firstPage = this.documentSpace.find("#" + this.pagePrefix + "1");
            if (this.pages().length > 0 && this._firstPage.length == 0 && !this.useVirtualScrolling) // viewer destroyed while loading document
                return;

            $(this).trigger('onProcessPages', [this.docGuid]);
            this.inprogress(false);

            if (this.pageContentType == "image") {
                this.recalculatePageLeft();
            }

            //var hCount = Math.floor(this.pagesContainerElement.width() / this._firstPage.width());
            var hCount = Math.floor(this.pagesContainerElement.width() / this.pageWidth());
            if (hCount == 0)
                hCount = 1;
            if (this.layout() == this.Layouts.OnePageInRow)
                hCount = 1;

            var scale = this.scale();

            this._dvselectable = this.pagesContainerElement.groupdocsSelectable({
                txtarea: this.selectionContent,
                pdf2XmlWrapper: this._pdf2XmlWrapper,
                startNumbers: this.getVisiblePagesNumbers(),
                pagesCount: this.pageCount(),
                proportion: scale,
                pageHeight: this.getPageHeight(),
                horizontalPageCount: hCount,
                docSpace: this.documentSpace,
                pagePrefix: this.pagePrefix,
                searchPartialWords: this.searchPartialWords,
                storeAnnotationCoordinatesRelativeToPages: this.storeAnnotationCoordinatesRelativeToPages,
                initializeStorageOnly: this.pageContentType == "html",
                preventTouchEventsBubbling: this.preventTouchEventsBubbling,
                highlightColor: this.options.highlightColor,
                useVirtualScrolling: this.useVirtualScrolling,
                pageLocations: (this.useVirtualScrolling ? this.pages() : null)
            });
            this._dvselectable.groupdocsSelectable("setVisiblePagesNumbers", this.getVisiblePagesNumbers());

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
            if (this.pageContentType == "image" && this._mode != "webComponent" && this._mode != "annotatedDocument") {
                this._loadHyperlinks();
            }

            if (this.preloadPagesOnBrowserSide) {
                var preloadPagesCount = this.preloadPagesCount;
                if (preloadPagesCount === null || preloadPagesCount > this.pageCount())
                    preloadPagesCount = this.pageCount();

                this.loadImagesForPages(1, preloadPagesCount);
            }

            $(this).trigger('onScrollDocView', { pi: 1, direction: "up", position: 0 });
            $(this).trigger("onDocumentLoadComplete", [response, this._pdf2XmlWrapper]);
            this.documentSpace.trigger("documentLoadCompleted.groupdocs");
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
                /*var frame = l.rect.clone().scale(self.scale());
                if (frame.top() < 0)
                frame.setTop(0);
                frame.add(selectable.pages[l.pageNumber].rect.topLeft);

                return frame;
                }, self);*/

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

        setPageWidth: function (val) {
            this.pageImageWidth = val;
        },

        setContainerWidth: function (containerWidth) {
            this.viewerWidth = containerWidth;
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
            //return viewerWidth / (this.pageImageWidth + 2 * this.imageHorizontalMargin) * 100;
        },

        setContainerHeight: function (containerHeight) {
            this.viewerHeight = containerHeight;
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
            //return viewerHeight / Math.round(this.pageImageWidth * this.heightWidthRatio) * 100;
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
            //return (this.use_pdf == 'false' ? this.pageWidth() * this.heightWidthRatio : this.unscaledPageHeight * this.scale());
            //return this.pageWidth() * this.heightWidthRatio;
            return this.unscaledPageHeight * this.scale();
        },

        getSelectable: function () {
            return this._dvselectable;
        },

        _onPropertiesLoaded: function (response) {
            $(this).trigger('onDocumentLoaded', { fileId: this.fileId, response: response });
        },

        getFileId: function () {
            return this.fileId;
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

            $(this).trigger('onBeforeScrollDocView', { position: st });
            if (this.variableHeightPageSupport) {
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
            }
            else {
                if (this._firstPage != null) {
                    pageIndex = (st + panelHeight / 2) / (this._firstPage.outerHeight(true));
                    var hCount = Math.floor(this.pagesContainerElement.width() / this._firstPage.width());
                    if (hCount == 0)
                        hCount = 1;
                    if (this.layout() == this.Layouts.OnePageInRow)
                        hCount = 1;
                    pageIndex = (pageIndex >> 0);

                    var totalPageCount = this.pageCount();
                    if (pageIndex != totalPageCount)
                        pageIndex = pageIndex + 1;
                    pageIndex = (pageIndex - 1) * hCount + 1;
                    if (pageIndex > totalPageCount)
                        pageIndex = totalPageCount;
                }
            }
            if (pageIndex !== null) {
                this.pageInd(pageIndex);
                this.setPageNumerInUrlHash(pageIndex);
                $(this).trigger('onScrollDocView', { pi: pageIndex, position: st });
                this.documentSpace.trigger("documentScrolledToPage.groupdocs", [pageIndex]);
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
            $(this).trigger('onDocumentPageSet', [this.pageInd()]);
            this.documentSpace.trigger("documentScrolledToPage.groupdocs", [this.pageInd()]);
        },

        getVisiblePagesNumbers: function () {
            if (!this.isDocumentLoaded)
                return null;
            if (this.useTabsForPages()) {
                return { start: 1, end: 1 };
            }

            var start = null;
            var end = null;
            var scrollTop = this.documentSpace.scrollTop();
            var pageHeight;
            var startIndex = null;
            var documentSpaceHeight = this.documentSpace.height();

            if (this.variableHeightPageSupport) {
                var selectable = this.getSelectableInstance();
                if (selectable == null && !this.useVirtualScrolling)
                    return null;
                var pages = this.pages();
                var pageLocations;
                var pageCount;
                if (this.useVirtualScrolling)
                    pageCount = pages.length;
                else {
                    pageLocations = selectable.pageLocations;
                    if (pageLocations.length != pages.length)
                        return null;
                    pageCount = pageLocations.length;
                }

                var pageImageTop, pageImageBottom;
                for (var i = 0; i < pageCount; i++) {
                    if (this.useVirtualScrolling)
                        pageImageTop = pages[i].top();
                    else
                        pageImageTop = pageLocations[i].y;

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

            }
            else {
                if (this._firstPage != null) {
                    pageHeight = this._firstPage.outerHeight(true); // div height
                    var pageWidth = this._firstPage.outerWidth(true); // div width
                    //var scrollTop = this.scrollPosition[1], //scroll top
                    var dsW = this.pagesContainerElement.width();
                    startIndex = Math.floor(scrollTop / pageHeight) + 1;
                    var endIndex = Math.floor((scrollTop + documentSpaceHeight) / pageHeight) + 1;

                    var hCountToShow = Math.floor(dsW / pageWidth);

                    if (hCountToShow == 0)
                        hCountToShow = 1;
                    if (this.layout() == this.Layouts.OnePageInRow)
                        hCountToShow = 1;

                    start = startIndex != 1 ? (startIndex - 1) * hCountToShow + 1 : 1;
                    end = endIndex * hCountToShow <= this.pageCount() ? endIndex * hCountToShow : this.pageCount();
                }
            }
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
            var cssForAllPages = "";
            var page;
            var isPageVisible;
            for (var i = start; i <= end; i++) {
                page = pages[i - 1];
                isPageVisible = page.visible();
                if (isPageVisible)
                    this.markContentControls(i - 1);

                if (this.pageContentType == "image") {
                    this.triggerImageLoadedEvent(i);

                    if (this.supportPageRotation && forceLoading) {
                        this.addSuffixToImageUrl(page);
                    }
                }
                else if (this.pageContentType == "html") {
                    if (!isPageVisible) {
                        var pageHtml = this.preloadedPages && this.preloadedPages.html[i - 1];
                        if (pageHtml) {
                            page.htmlContent(pageHtml);
                            if (this.preloadedPages.css[i - 1])
                                cssForAllPages += this.preloadedPages.css[i - 1];
                            page.visible(true);
                            continue;
                        }
                        else
                            this.getDocumentPageHtml(i - 1);
                    }
                }
                page.visible(true);
            }

            if (this.pageContentType == "html" && cssForAllPages != "")
                this.addPageCss(cssForAllPages);

            //for (var i = start; i <= end; i++) {
            //    page = pages[i - 1];
            //    page.visible(true);
            //}
        },

        setPage: function (index) {
            this.isSetCalled = true;
            var newPageIndex = Number(index);

            if (isNaN(newPageIndex) || newPageIndex < 1)
                newPageIndex = 1;

            this.pageInd(newPageIndex);

            var pageTop;
            if (this.variableHeightPageSupport) {
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
            }
            else {
                var hCount = Math.floor(this.pagesContainerElement.width() / this._firstPage.width());
                if (hCount == 0)
                    hCount = 1;
                if (this.layout() == this.Layouts.OnePageInRow)
                    hCount = 1;
                var selIndex = Math.ceil(newPageIndex / hCount) - 1;
                pageTop = selIndex * this._firstPage.outerHeight(true);
            }

            var oldScrollTop = this.documentSpace.scrollTop();
            this.documentSpace.scrollTop(pageTop);
            if (this.documentSpace.scrollTop() == oldScrollTop) {
                this.isSetCalled = false;
            }

            $(this).trigger('onDocViewScrollPositionSet', { position: pageTop });
            var page = this.pages()[newPageIndex - 1];

            if (this.pageContentType == "image") {
                this.triggerImageLoadedEvent(newPageIndex);
                page.visible(true);
            }
            else if (this.pageContentType == "html") {
                if (!page.visible()) {
                    this.getDocumentPageHtml(newPageIndex - 1);
                }
            }

            //this.isSetCalled = false;

            this.setPageNumerInUrlHash(newPageIndex);
            $(this).trigger('onDocumentPageSet', [newPageIndex]);
            this.documentSpace.trigger("documentPageSet.groupdocs", newPageIndex);
        },

        triggerImageLoadedEvent: function (pageIndex) {
            if ($.browser.msie) {
                if (!this.pages()[pageIndex - 1].visible()) {
                    $("img#img-" + pageIndex).load(function () {
                        $(this).trigger("onPageImageLoaded");
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

                this._dvselectable.groupdocsSelectable("changeSelectedRowsStyle", this.scale());
                this.reInitSelectable();
                if (this.useVirtualScrolling) {
                    this.getSelectableInstance().recalculateSearchPositions(this.scale());
                    this.highlightSearch();
                }
                this.recalculatePageLeft();
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
                    this.calculatePagePositionsForVirtualMode();
                }

                if (this.pageContentType == "image") {
                    var pageCount = this.pageCount();
                    if (!this.shouldMinimumWidthBeUsed(newWidth, true))
                        this.retrieveImageUrls(pageCount);
                }
            }
        },

        performSearch: function (value, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch) {
            if (this.pageContentType == "image") {
                var selectable = this.getSelectableInstance();
                if (selectable != null) {
                    var searchCountItem = selectable.performSearch(value, this.scale(), isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact, useAccentInsensitiveSearch);
                    $(this).trigger('onSearchPerformed', [searchCountItem]);
                }
            }
            else {
                this.searchText = value;
                this.searchForSeparateWords = searchForSeparateWords;
                this.treatPhrasesInDoubleQuotesAsExact = treatPhrasesInDoubleQuotesAsExact;
                var pages = this.pages();
                var page;

                if (this.loadAllPagesOnSearch)
                    this.loadImagesForPages(1, pages.length);

                for (var i = 0; i < pages.length; i++) {
                    page = pages[i];
                    if (page.visible()) {
                        var searchParameters = {
                            text: value,
                            isCaseSensitive: isCaseSensitive,
                            searchForSeparateWords: searchForSeparateWords,
                            treatPhrasesInDoubleQuotesAsExact: treatPhrasesInDoubleQuotesAsExact,
                            pageNumber: i
                        };

                        page.searchText(searchParameters);
                    }
                }
            }
        },

        searchHtmlElement: function (node, nodeName, className, words, wordsWithAccentedChars,
            searchForSeparateWords, isCaseSensitive, fullWordsOnly, pageNumber) {

            nodeName = nodeName || this.htmlSearchHighlightElement;
            var totalWordCount;
            var pattern, currentNodeMatchCount = 0;
            var match = null;
            var nodeText = null;
            var regexp;

            if (node.nodeType === 3) {
                if (words) {
                    totalWordCount = words.length;

                    var trimmedText = node.data.replace(/[\r\n\s]+$/g, "");
                    var separatorsRegexString = "[" + this.searchSeparatorsList + "]";
                    var wordStartSeparatorsRegexString;
                    var wordEndSeparatorsRegexString;
                    var reservedSymbolsInEndRegExp = /[\-[\]{}()*+?\\^|\s.,:;+"]+$/g;
                    var currentWord, currentWordWithAccentedChars;
                    var index, length;
                    var highlightElementName;
                    var matchNum;
                    var previousMatchPosition = -1, matchLength = 0, previousMatchEndPosition = 0;
                    trimmedText = trimmedText.replace(reservedSymbolsInEndRegExp, "");
                    if (trimmedText.length == 0)
                        return 0;

                    if (searchForSeparateWords && !fullWordsOnly) {
                        var searchMatches = new Array();
                        for (var wordNum = 0; wordNum < words.length; wordNum++) {
                            currentWord = words[wordNum];
                            currentWordWithAccentedChars = wordsWithAccentedChars[wordNum];

                            pattern = currentWordWithAccentedChars;
                            length = pattern.length;
                            nodeText = node.data;

                            if (!isCaseSensitive) {
                                pattern = pattern.toLocaleLowerCase();
                                nodeText = nodeText.toLocaleLowerCase();
                            }
                            previousMatchEndPosition = 0;
                            do {
                                index = nodeText.indexOf(pattern, previousMatchEndPosition);
                                if (index != -1) {
                                    searchMatches.push({ index: index, length: length });
                                    previousMatchEndPosition = index + length;
                                }
                            } while (index != -1);
                        }

                        searchMatches.sort(function (match1, match2) {
                            return match2.index - match1.index;
                        });

                        var containingMatches = new Array();
                        // remove overlapping search hits but keep one of two hits overlapping each other
                        searchMatches = searchMatches.filter(function (match, index) {
                            return !searchMatches.some(function (innerMatch, innerIndex) {
                                var isContainedInAnother = innerIndex != index &&
                                       (match.index >= innerMatch.index && match.index < innerMatch.index + innerMatch.length)
                                    || (match.index + match.length > innerMatch.index && match.index + match.length < innerMatch.index + innerMatch.length);
                                if (isContainedInAnother) {
                                    if (containingMatches.indexOf(match) != -1)
                                        return false;
                                    containingMatches.push(innerMatch);
                                }
                                return isContainedInAnother;
                            });
                        });
                        for (matchNum = 0; matchNum < searchMatches.length; matchNum++) {
                            highlightElementName = "search_highlight" + this.matchesCount.toString();
                            this.matchesCount++;
                            this.highlightOneNode(node, searchMatches[matchNum].index, searchMatches[matchNum].length, highlightElementName, className, pageNumber);
                        }

                        return searchMatches.length;
                    }

                    var isFirstWord, isLastWord;
                    var foundFirstWordsButDidNotFindOthers;

                    do {
                        currentWord = words[this.currentWordCounter];
                        currentWordWithAccentedChars = wordsWithAccentedChars[this.currentWordCounter];
                        isFirstWord = (this.currentWordCounter == 0);
                        isLastWord = (this.currentWordCounter == totalWordCount - 1);

                        if (isFirstWord && !fullWordsOnly) {
                            wordStartSeparatorsRegexString = "";
                        }
                        else {
                            wordStartSeparatorsRegexString = "(?:" + separatorsRegexString + "|^)+";
                        }

                        if (isLastWord && !fullWordsOnly) {
                            wordEndSeparatorsRegexString = "";
                        }
                        else {
                            wordEndSeparatorsRegexString = "(?:" + separatorsRegexString + "|$)+";
                        }

                        pattern = wordStartSeparatorsRegexString + "(" + currentWordWithAccentedChars + wordEndSeparatorsRegexString + ")";
                        nodeText = node.data;
                        nodeText = nodeText.substr(previousMatchEndPosition, nodeText.length - previousMatchEndPosition);
                        if ((this.matchedNodsCount > 0 && previousMatchPosition == -1) || previousMatchPosition != -1) // if searching a new <span> or not first word inside first span then search from beginning of string
                            pattern = "^" + pattern;
                        regexp = new RegExp(pattern, isCaseSensitive ? "" : "i");
                        foundFirstWordsButDidNotFindOthers = false;

                        match = nodeText.match(regexp);
                        if (match) {
                            if (previousMatchPosition == -1)
                                this.matchedNodsCount++;
                            currentNodeMatchCount++;
                            this.matchedNods.push(node);
                            index = previousMatchEndPosition + match.index;
                            length = match[0].length;

                            if (isFirstWord) {
                                index = previousMatchEndPosition + nodeText.indexOf(match[1], match.index);
                                length = match[1].length;
                            }

                            if (isLastWord && !this.useAccentInsensitiveSearch) {
                                var word = words[this.currentWordCounter];
                                var nodeTextToSearchIn = nodeText;
                                if (!isCaseSensitive) {
                                    word = word.toLowerCase();
                                    nodeTextToSearchIn = nodeTextToSearchIn.toLowerCase();
                                }
                                var wordIndex = previousMatchEndPosition + nodeTextToSearchIn.indexOf(word, match.index);
                                length = word.length + wordIndex - index;
                            }
                            this.searchMatches.push({ index: index, length: length });

                            previousMatchPosition = previousMatchEndPosition + match.index;
                            matchLength = match[0].length;
                            previousMatchEndPosition = previousMatchPosition + matchLength;

                            this.currentWordCounter++;
                            if (this.currentWordCounter >= totalWordCount) {
                                highlightElementName = "search_highlight" + this.matchesCount.toString();
                                for (matchNum = totalWordCount - 1; matchNum >= 0; matchNum--)
                                    this.highlightOneNode(this.matchedNods[matchNum], this.searchMatches[matchNum].index, this.searchMatches[matchNum].length, highlightElementName, className, pageNumber);
                                this.currentWordCounter = 0;
                                this.matchedNods = [];
                                this.searchMatches = [];
                                this.matchedNodsCount = 0;
                                this.matchesCount++;
                                return currentNodeMatchCount;
                            }
                        }
                        else {
                            this.matchedNods = [];
                            this.searchMatches = [];
                            if (this.currentWordCounter > 0) {
                                // found first word or words (on previous step) inside this <span/> but failed to find others
                                previousMatchPosition = -1;
                                this.matchedNodsCount = 0;
                                foundFirstWordsButDidNotFindOthers = true;
                            }
                            this.currentWordCounter = 0;
                        }
                    } while ((match && previousMatchEndPosition < trimmedText.length) || foundFirstWordsButDidNotFindOthers);

                    if (!match)
                        this.matchedNodsCount = 0;
                    return 0;
                }
            }
            else if ((node.nodeType === 1 && node.childNodes) && // only element nodes that have children
                !/(script|style)/i.test(node.tagName) && // ignore script and style nodes
                !(node.tagName === nodeName.toUpperCase() && node.className === className)) { // skip if already highlighted
                var startNodeNum = 0;
                //var endNodeNum = node.childNodes.length;
                var i;

                for (i = startNodeNum; i < node.childNodes.length; i++) {
                    //i += jQuery.highlight(node.childNodes[i], regexp, nodeName, className);
                    i += this.searchHtmlElement(node.childNodes[i], nodeName, className, words, wordsWithAccentedChars,
                        searchForSeparateWords, isCaseSensitive, fullWordsOnly, pageNumber);
                }
            }
            return 0;
        },

        highlightOneNode: function (node, matchIndex, matchLength, highlightElementName, className, pageNumber) {
            var isSvg = false;
            var nodeJquery = $(node);
            var highlight, nodeName;
            if (nodeJquery.is("tspan") || nodeJquery.parent().is("tspan")) {
                isSvg = true;
                nodeName = this.htmlSearchHighlightSvgElement;
                var xmlns = "http://www.w3.org/2000/svg";
                highlight = document.createElementNS(xmlns, nodeName);
                highlight.setAttribute("class", className || this.htmlSearchHighlightClassName);
            }
            else {
                nodeName = this.htmlSearchHighlightElement;
                highlight = document.createElement(nodeName);
                highlight.className = className || this.htmlSearchHighlightClassName;
            }
            var highlightJquery = $(highlight);
            if (highlightElementName)
                highlightJquery.attr("name", highlightElementName);
            highlightJquery.attr("data-page-num", pageNumber.toString());
            //var wordNode = node.splitText(match.index);
            //wordNode.splitText(match[0].length);

            var wordNode = node.splitText(matchIndex);
            wordNode.splitText(matchLength);
            var wordClone = wordNode.cloneNode(true);
            highlight.appendChild(wordClone);
            wordNode.parentNode.replaceChild(highlight, wordNode);
        },

        removeSearchHighlight: function (element) {
            var htmlHighlightQuery = this.htmlSearchHighlightElement + "." + this.htmlSearchHighlightClassName;
            var svgHighlightQuery = this.htmlSearchHighlightSvgElement + "." + this.htmlSearchHighlightClassName;
            $(element).find(htmlHighlightQuery + "," + svgHighlightQuery).each(function () {
                var parent = this.parentNode;
                parent.replaceChild(this.firstChild, this);
                parent.normalize();
            });
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

        recalculatePageLeft: function () {
            if (this._firstPage != null && this.pagesContainerElement != null) {
                var pageLeft = this._firstPage.offset().left - this.pagesContainerElement.offset().left;
                this.pageLeft(pageLeft);
            }
        },

        reInitSelectable: function () {
            var visiblePagesNumbers = this.getVisiblePagesNumbers();
            if (this._dvselectable != null) {
                this._dvselectable.groupdocsSelectable("reInitPages", this.scale(), visiblePagesNumbers,
                    this.scrollPosition, this.getPageHeight(), this.pages());
            }
        },

        reInitCanvasOffset: function () {
            var selectable = this.getSelectableInstance();
            selectable.initCanvasOffset();
        },

        openCurrentPage: function () {
            this.setPage(this.pageInd());
        },

        setPageNumerInUrlHash: function (pageIndex) {
            if (this.usePageNumberInUrlHash === undefined || this.usePageNumberInUrlHash == true) {
                if (location.hash != "" || pageIndex > 1) {
                    this.changedUrlHash = true;
                    location.hash = this.hashPagePrefix + pageIndex.toString();
                    this.changedUrlHash = false;
                }
            }
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

        shouldMinimumWidthBeUsed: function (width, checkOriginalDocumentWidth) {
            var originalDocumentWidth = null;
            if (this.use_pdf != 'false' && checkOriginalDocumentWidth) {
                var pageSize = this._pdf2XmlWrapper.getPageSize();
                originalDocumentWidth = pageSize.width;
            }
            return this.minimumImageWidth != null &&
                (width <= this.minimumImageWidth || (originalDocumentWidth !== null && originalDocumentWidth < this.minimumImageWidth));
        },

        resizeViewerElement: function (viewerLeft) {
            var parent = this.documentSpace.parent();
            var parentWidth = parent.width();
            if (typeof viewerLeft == "undefined")
                viewerLeft = 0;
            else
                this.viewerLeft = viewerLeft;
            this.documentSpace.width(parentWidth - viewerLeft);
            this.reInitSelectable();
            this.loadImagesForVisiblePages();
        },

        onPageReordered: function (oldPosition, newPosition) {
            this._model.reorderPage(this.fileId, oldPosition, newPosition,
                this.instanceIdToken,
                function (response) {
                    if (this.pageContentType == "image") {
                        var pages = this.pages();
                        //var page = pages()[oldPosition];
                        //pages.remove(page);
                        //pages.splice(newPosition, 0, page);
                        var pageImageUrl;
                        var minPosition = Math.min(oldPosition, newPosition);
                        var maxPosition = Math.max(oldPosition, newPosition);
                        for (var i = minPosition; i <= maxPosition; i++) {
                            //pages[i].visible(false);
                            pageImageUrl = pages[i].url();
                            pages[i].url(pageImageUrl + "#0"); // to avoid caching
                            pages[i].visible(true);
                            //pages[i].url(pageImageUrl);
                            //pages[i].visible(true);
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
            var pageNumber = this.pageInd() - 1;
            this._model.rotatePage(this.fileId, pageNumber, rotationAmount,
                this.instanceIdToken,
                function (response) {
                    var page = this.pages()[pageNumber];
                    this.applyPageRotationInBrowser(pageNumber, page, response.resultAngle);
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
                    //this.pageWidth(pageHeight * this.zoom() / 100);
                }
                else {
                    maxPageHeight = pageHeight;
                    //this.pageWidth(pageWidth * this.zoom() / 100);
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
            this.calculatePagePositionsForVirtualMode();
            this.reInitSelectable();
            var selectable = this.getSelectableInstance();
            if (selectable != null)
                selectable.clearSelectionOnPage(pageNumber);
            this.loadImagesForVisiblePages(true);
        },

        getHtmlElements: function (pageHtml, tagName) {
            var contentsRegex = new RegExp("<" + tagName + "[^>]*>(?:.|\\r?\\n)*?<\\/" + tagName + ">", "gi");
            var contentsFromHtml = pageHtml.match(contentsRegex);
            return contentsFromHtml;
        },

        getHtmlElementContents: function (pageHtml, tagName) {
            var contentsRegex = new RegExp("<" + tagName + "[^>]*>((?:.|\\r?\\n)*?)<\\/" + tagName + ">", "i");
            var match = pageHtml.match(contentsRegex);
            var contentsFromHtml = null;
            if (match)
                contentsFromHtml = match[1];
            return contentsFromHtml;
        },

        getHtmlElementAttributess: function (pageHtml, tagName) {
            var contentsRegex = new RegExp("<" + tagName + "[^>]*/?>", "gi");
            var contentsFromHtml = pageHtml.match(contentsRegex);
            return contentsFromHtml;
        },

        getPageBodyContents: function (pageHtml) {
            var bodyContentsFromHtml = pageHtml.match(/<body[^>]*>((?:.|\r?\n)*?)<\/body>/)[1];
            return bodyContentsFromHtml;
        },

        getPageBodyContentsWithReplace: function (pageHtml) {
            var bodStartTag = "<body";
            var bodyTagStartPos = pageHtml.indexOf(bodStartTag);
            var bodyStartPos = bodyTagStartPos + bodStartTag.length;
            var bodyEndPos = pageHtml.indexOf("/body>");
            var bodyContentsFromHtml = "<div" + pageHtml.substr(bodyStartPos, bodyEndPos - bodyStartPos) + "/div>";
            return bodyContentsFromHtml;
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

        fixImageReferencesInHtml: function (pageHtml) {
            var bodyContentsFromHtml = this.getPageBodyContents(pageHtml);
            return bodyContentsFromHtml;
        },

        calculatePointToPixelRatio: function () {
            var pointWidth = 100;
            var testElement = $("<div/>").css("width", pointWidth + "pt").css("height", "0");
            testElement.appendTo(this.documentSpace);
            var pixelWidth = testElement.width();
            this.pointToPixelRatio = pixelWidth / pointWidth;
            testElement.remove();
        },

        activateTab: function (number) {
            var tab = this.tabs()[number];
            var self = this;

            function activateLoadedTab() {
                var pages = self.pages();
                var page = pages[0];
                page.htmlContent(tab.htmlContent());
                var htmlPageContents = self.documentSpace.find(".html_page_contents:first");
                var pageElement = htmlPageContents.children("div,table");
                var pageWidth = pageElement.width();
                self.initialWidth = pageWidth;
                page.prop(pageElement.height() / pageWidth);
                self.pageWidth(pageWidth * self.zoom() / 100);
                self.activeTab(number);
                if (self.supportPageRotation)
                    self.applyPageRotationInBrowser(0, page, page.rotation());
            }

            if (tab.visible()) {
                activateLoadedTab();
            }
            else {
                this.getDocumentPageHtml(number, function () {
                    activateLoadedTab();
                });
            }
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

        watermarkTransform: function (page, element) {
            var rotation = 0;
            if (page.rotation)
                rotation = page.rotation();

            var pageProportion = page.prop();
            var top = "Top", bottom = "Bottom", diagonal = "Diagonal";
            var left = "Left", center = "Center", right = "Right";
            var vertical = "", horizontal = center;
            if (this.watermarkPosition.indexOf(top) == 0)
                vertical = top;
            else if (this.watermarkPosition.indexOf(bottom) == 0)
                vertical = bottom;
            else if (this.watermarkPosition.indexOf(diagonal) == 0) {
                vertical = diagonal;
                horizontal = center;
            }

            if (vertical != diagonal) {
                if (this.watermarkPosition.indexOf(left) != -1)
                    horizontal = left;
                else if (this.watermarkPosition.indexOf(center) != -1)
                    horizontal = center;
                else if (this.watermarkPosition.indexOf(right) != -1)
                    horizontal = right;
            }
            var returnValue = "translate(";
            //var widthWithoutMargin = this.pageWidth();
            //var pageWidth = widthWithoutMargin + this.imageHorizontalMargin;
            //var pageHeight = widthWithoutMargin * pageProportion;
            var fontHeight = 10;
            var pageWidth = 100;
            var pageHeight = pageWidth * pageProportion;
            var textWidth;
            if (this.watermarkScreenWidth == null) {
                var textSize = element.getBBox();
                this.watermarkScreenWidth = textSize.width;
            }
            textWidth = this.watermarkScreenWidth;

            var scale;
            if (this.watermarkWidth == 0)
                scale = 1;
            else
                scale = this.watermarkWidth / 100.;

            var smallerSide = pageWidth;
            if (vertical == diagonal && pageHeight < pageWidth) {
                smallerSide = pageHeight;
            }
            var watermarkWidth = smallerSide * scale;
            var scaleToFitIntoPageWidth = smallerSide / textWidth;
            if (rotation % 180 != 0 && vertical != diagonal) {
                watermarkWidth = pageHeight * scale;
                scaleToFitIntoPageWidth = pageHeight / textWidth;
            }
            scale *= scaleToFitIntoPageWidth;
            var horizontalCenter = pageWidth / 2;
            var verticalCenter = pageHeight / 2;

            var horizontalShift = 0;
            switch (horizontal) {
                case center:
                    horizontalShift = ((pageWidth - watermarkWidth) / 2);
                    break;
                case left:
                    horizontalShift = 0;
                    break;
                case right:
                    horizontalShift = pageWidth - watermarkWidth;
                    break;
            }

            returnValue += horizontalShift + "," +
                (vertical == top ? 0 : (pageHeight - pageHeight * scale)) + ')' +
                'scale(' + scale + ')';

            if (vertical == diagonal)
                returnValue += 'translate(0,' + (-verticalCenter / scale) + ') rotate(' + (-50 + rotation) + ',' + (horizontalCenter - horizontalShift) / scale + ',' + pageHeight + ') ';

            if (!page.rotation || vertical == diagonal)
                return returnValue;

            //var screenCenterMinusFontHeight = screenCenter - 10;
            var firstShift = 0, secondShift = 0, secondHorizontalShift = 0;
            var rotationCenterX, rotationCenterY = 0;
            if (horizontal == center) {
                rotationCenterX = (horizontalCenter - horizontalShift) / scale;
                if (vertical == top) {
                    rotationCenterY = 0;
                }
                else {
                    rotationCenterY = pageHeight;
                }
            }
            else if (horizontal == left) {
                rotationCenterX = horizontalCenter / scale;
                if (rotation % 180 != 0)
                    secondHorizontalShift = (horizontalCenter - verticalCenter) / scale;
                if (vertical == top) {
                    rotationCenterY = 0;
                }
                else {
                    rotationCenterY = pageHeight;
                }
            }
            else if (horizontal == right) {
                rotationCenterX = -(horizontalShift - horizontalCenter) / scale;
                if (rotation % 180 != 0)
                    secondHorizontalShift = -(horizontalCenter - verticalCenter) / scale;

                if (vertical == top) {
                    rotationCenterY = 0;
                }
                else {
                    rotationCenterY = pageHeight;
                }
            }

            switch (rotation) {
                case 90:
                    if (vertical == top) {
                        firstShift = verticalCenter / scale;
                        secondShift = -horizontalCenter / scale;
                    }
                    else {
                        firstShift = -verticalCenter / scale;
                        secondShift = horizontalCenter / scale;
                    }
                    break;
                case 180:
                    if (vertical == top) {
                        firstShift = verticalCenter / scale;
                        secondShift = -verticalCenter / scale;
                    }
                    else {
                        firstShift = -verticalCenter / scale;
                        secondShift = verticalCenter / scale;
                    }
                    break;
                case 270:
                    if (vertical == top) {
                        firstShift = verticalCenter / scale;
                        secondShift = -horizontalCenter / scale;
                    }
                    else {
                        firstShift = -verticalCenter / scale;
                        secondShift = horizontalCenter / scale;
                    }
                    break;
            }
            if (vertical == top || vertical == bottom)
                returnValue += 'translate(0,' + firstShift + ') rotate(' + rotation + ',' + rotationCenterX + ',' + rotationCenterY + ') translate(' + secondHorizontalShift + ',' + secondShift + ')';
            return returnValue;
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

        isRTL: function (s) {
            return false; // Aspose.Words 15.3 fixes RTL text
        },

        setLoadingState: function (set) {
            this.inprogress(set);
        },

        getScaleRatioForPage: function (widthForMaxHeight, maxPageHiegt, pageWidth, pageHeight) {
            var widthRatio, scaleRatio;
            if (widthForMaxHeight === undefined)
                widthRatio = 1;
            else
                widthRatio = widthForMaxHeight / pageWidth;
            scaleRatio = widthRatio;
            return scaleRatio;
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

        setLayout: function (layout) {
            this.layout(layout);
            this.calculatePagePositionsForVirtualMode();
            this.loadImagesForVisiblePages();
        },

        calculatePagePositionsForVirtualMode: function () {
            if (this.useVirtualScrolling) {
                var pageVerticalMargin = 15; // pixels
                var pageHorizontalMargin = 2 * 7; // pixels
                var pages = this.pages();
                var width = this.pageWidth();
                var documentHeight = 0;
                var page, proportion, pageHeight;
                var pageLeft = 0, pageTop = 0;
                var rowHeight = 0;
                var pagesInRow;
                var layout = this.layout();
                switch (layout) {
                    case this.Layouts.ScrollMode:
                        pagesInRow = Math.floor(this.pagesContainerElement.width() / this.pageWidth());
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
                for (var i = 0; i < pages.length; i++) {
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
                        pageLeft = 0;
                    }
                    else
                        pageLeft += width + pageHorizontalMargin;
                }
                this.documentHeight(documentHeight);
            }
        },

        clearContentControls: function () {
            if (!this.supportListOfContentControls || !this.contentControlsFromHtml)
                return;
            var contentControlFromHtml;
            for (var i = 0; i < this.contentControlsFromHtml.length; i++) {
                contentControlFromHtml = this.contentControlsFromHtml[i];
                if (typeof contentControlFromHtml != "undefined" && contentControlFromHtml.visualWrapper) {
                    contentControlFromHtml.visualWrapper.remove();
                }
            }
            this.contentControlsFromHtml.length = 0;
        },

        markContentControls: function (pageNumber) {
            if (!this.supportListOfContentControls || !this.contentControls)
                return;

            var i, contentControlFromHtml;
            for (i = 0; i < this.contentControlsFromHtml.length; i++) {
                contentControlFromHtml = this.contentControlsFromHtml[i];
                if (typeof contentControlFromHtml != "undefined" && contentControlFromHtml.pageNumber == pageNumber) {
                    return;
                }
            }
            //"2D5FABC2_1start1=Document_-_Document_"
            var contentControlGuid = "2D5FABC2";
            var startType = "start";
            var endType = "end";
            var separator = "=";

            var spaceToSearchIn = this.documentSpace;
            if (typeof pageNumber != "undefined")
                spaceToSearchIn = this.documentSpace.find("#" + this.pagePrefix + (pageNumber + 1).toString());

            spaceToSearchIn.find(".content_control_visual_wrapper").remove();

            var contentControlMarkers = spaceToSearchIn.find("a[name^='" + contentControlGuid + "']");
            var contentControlsFromHtml = new Array();
            var wrappersRemain = 0;
            var contentControlNumber;
            var self = this;
            contentControlMarkers.each(function () {
                var that = $(this);
                var name = that.attr("name");
                var typePositionRegex = new RegExp("(" + startType + ")|(" + endType + ")");
                var typePosition = name.search(typePositionRegex);

                var contentControlNumberText = name.substring(contentControlGuid.length + 1, typePosition);
                contentControlNumber = parseInt(contentControlNumberText);

                if (pageNumber >= self.contentControls[contentControlNumber].startPage
                       && pageNumber <= self.contentControls[contentControlNumber].endPage) {

                    if (name.indexOf(startType) == typePosition) {
                        var contentControlTitlePosition = name.indexOf(separator, typePosition) + 1;
                        var contentControlTitle = name.substring(contentControlTitlePosition, name.length);
                        var moveUpInDom = name[typePosition + startType.length] == "1";
                        var startElement = that;
                        if (typeof contentControlsFromHtml[contentControlNumber] == "undefined") {
                            if (moveUpInDom || startElement.parent().children(":not([name^='" + contentControlGuid + "'])").length == 0)
                                startElement = startElement.parent();
                            contentControlsFromHtml[contentControlNumber] = {
                                title: contentControlTitle,
                                number: contentControlNumber
                            };
                        }
                        contentControlsFromHtml[contentControlNumber].startElement = startElement;
                        contentControlsFromHtml[contentControlNumber].moveUpInDom = moveUpInDom;
                    }
                    else {
                        if (that.parent().children(":not([name^='" + contentControlGuid + "'])").length == 0)
                            that = that.parent();

                        if (typeof contentControlsFromHtml[contentControlNumber] == "undefined") {
                            contentControlsFromHtml[contentControlNumber] = { endElement: that, number: contentControlNumber };
                        }
                        contentControlsFromHtml[contentControlNumber].endElement = that;
                    }
                }
            });

            for (i = 0; i < this.contentControls.length; i++) {
                if (pageNumber >= this.contentControls[i].startPage
                    && pageNumber <= this.contentControls[i].endPage) {
                    if (!contentControlsFromHtml[i]) {
                        contentControlsFromHtml[i] = {
                            number: i, title: this.contentControls[i].title
                        };
                    }
                }
            }

            for (i = 0; i < contentControlsFromHtml.length; i++) {
                contentControlFromHtml = contentControlsFromHtml[i];
                if (contentControlFromHtml) {
                    if (!contentControlFromHtml.startElement) {
                        contentControlFromHtml.startElement = spaceToSearchIn
                            .children(".html_page_contents").children(".pageWordToHtml").children(":first");
                    }

                    if (!contentControlFromHtml.endElement) {
                        contentControlFromHtml.endElement = spaceToSearchIn
                            .children(".html_page_contents").children(".pageWordToHtml").children(":last");
                    }

                    contentControlFromHtml.title = this.contentControls[i].title;
                    contentControlFromHtml.pageNumber = pageNumber;

                    wrappersRemain++;

                    (function (contentControlNumberInner) {
                        window.setTimeout(function () {
                            wrappersRemain--;
                            self.createContentControlWrappers(spaceToSearchIn, contentControlsFromHtml, contentControlNumberInner, contentControlGuid, wrappersRemain);
                        }, 2000);
                    })(i);
                }
            }
        },


        createContentControlWrappers: function (spaceToSearchIn, contentControlsFromHtml, contentControlNumber, contentControlGuid, wrappersRemain) {
            var contentControlFromHtml = contentControlsFromHtml[contentControlNumber];
            var startElement = contentControlFromHtml.startElement;
            var endElement = contentControlFromHtml.endElement;

            var top = startElement.offset().top;
            top -= this.pagesContainerElement.offset().top;
            var contentControlVisualWrapper = $("<div/>").appendTo(spaceToSearchIn);
            contentControlFromHtml.visualWrapper = contentControlVisualWrapper;
            contentControlVisualWrapper.addClass("content_control_visual_wrapper");

            var elementsBetween = startElement.nextUntil(endElement, ":not([name^='" + contentControlGuid + "'])").add(endElement);
            if (contentControlFromHtml.moveUpInDom)
                elementsBetween = elementsBetween.add(startElement);
            var childrenBetween = elementsBetween.find("*");
            elementsBetween = elementsBetween.add(childrenBetween);
            var minLeft = null, maxRight = null, minTop = null, maxBottom = null;
            var innerElementLeft, innerElementWidth, innerElementTop, innerElementHeight;
            var currentZoom = this.zoom() / 100;
            elementsBetween.each(function () {
                var innerElement = $(this);
                if (innerElement.width() == 0 || innerElement.height() == 0)
                    return;
                innerElementLeft = innerElement.offset().left;

                if (minLeft === null || innerElementLeft < minLeft)
                    minLeft = innerElementLeft;

                innerElementWidth = innerElement.width() * currentZoom;
                if (maxRight === null || innerElementLeft + innerElementWidth > maxRight)
                    maxRight = innerElementLeft + innerElementWidth;

                innerElementTop = innerElement.offset().top;
                if (minTop === null || innerElementTop < minTop)
                    minTop = innerElementTop;

                innerElementHeight = innerElement.height() * currentZoom;
                if (maxBottom === null || innerElementTop + innerElementHeight > maxBottom)
                    maxBottom = innerElementTop + innerElementHeight;
            });
            //var containerOffsetLeft = self.pagesContainerElement.offset().left;
            //var containerOffsetTop = self.pagesContainerElement.offset().top;

            var containerOffsetLeft = spaceToSearchIn.offset().left;
            var containerOffsetTop = spaceToSearchIn.offset().top;

            contentControlVisualWrapper.css("left", (minLeft - containerOffsetLeft) + "px");
            contentControlVisualWrapper.css("width", maxRight - minLeft + "px");
            contentControlVisualWrapper.css("top", (minTop - containerOffsetTop) + "px");
            contentControlVisualWrapper.css("height", maxBottom - minTop + "px");

            contentControlVisualWrapper.attr("data-title", contentControlFromHtml.title);
            if (wrappersRemain == 0) {
                contentControlsFromHtml.sort(function (a, b) {
                    if (a.visualWrapper && b.visualWrapper)
                        return b.visualWrapper.width() * b.visualWrapper.height() - a.visualWrapper.width() * a.visualWrapper.height();
                    else
                        return 0;
                });
                var startZIndex = 1;
                for (var i = 0; i < contentControlsFromHtml.length; i++) {
                    contentControlFromHtml = contentControlsFromHtml[i];
                    if (typeof contentControlFromHtml != "undefined" && contentControlFromHtml.visualWrapper) {
                        contentControlFromHtml.visualWrapper.css("z-index", i + startZIndex);
                        if (this.contentControlToBeOpened !== null && this.contentControlToBeOpened == contentControlFromHtml.number) {
                            this.visuallySelectContentControl(contentControlFromHtml);
                            this.contentControlToBeOpened = null;
                        }
                    }
                    this.contentControlsFromHtml.push(contentControlsFromHtml[i]);
                }
            }
        },

        getContentControlDescriptions: function () {
            return this.contentControls;
        },

        navigateToContentControl: function (number) {
            number = parseInt(number);
            var pageNumber = this.contentControls[number].startPage;
            var found = false;
            if (this.pages()[pageNumber].visible()) {
                var contentControlFromHtml;
                for (var i = 0; i < this.contentControlsFromHtml.length; i++) {
                    contentControlFromHtml = this.contentControlsFromHtml[i];
                    if (typeof contentControlFromHtml != "undefined" && contentControlFromHtml.number == number) {
                        this.visuallySelectContentControl(contentControlFromHtml);
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                this.contentControlToBeOpened = number;
                this.setPage(pageNumber + 1);
            }
        },

        visuallySelectContentControl: function (contentControlFromHtml) {
            var contentControlHeaderHeight = 20;
            this.documentSpace[0].scrollTop = contentControlFromHtml.visualWrapper.offset().top -
                 this.pagesContainerElement.offset().top -
                 contentControlHeaderHeight;

            var hoverClass = "hover";
            var allWrappers = this.documentSpace.find(".doc-page .content_control_visual_wrapper");
            allWrappers.removeClass(hoverClass);
            allWrappers.unbind("mouseleave");
            contentControlFromHtml.visualWrapper.addClass(hoverClass);
            allWrappers.bind("mouseleave", function () {
                contentControlFromHtml.visualWrapper.removeClass(hoverClass);
                allWrappers.unbind("mouseleave");
            });
            this.documentSpace.trigger("ScrollDocView", [null, { target: this.documentSpace[0] }]);
            this.documentSpace.trigger("ScrollDocViewEnd", [null, { target: this.documentSpace[0] }]);
        },

        initCustomBindings: function () {
            if (!ko.bindingHandlers.searchText) {
                ko.bindingHandlers.searchText = {
                    update: function (element, valueAccessor, allBindings, viewModelParam, bindingContext) {
                        var viewModel = bindingContext.$root;
                        var page = bindingContext.$data;
                        if (!page.searched) {
                            var value = ko.utils.unwrapObservable(valueAccessor());
                            viewModel.parseSearchParameters(element, value);
                        }
                        page.searched = false;
                    }
                };
            }

            if (!ko.bindingHandlers.parsedHtml) {
                ko.bindingHandlers.parsedHtml = {
                    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                        var modelValue = valueAccessor();
                        var jqueryElement = $(element);
                        var elementValue = jqueryElement.html();

                        if (ko.isWriteableObservable(modelValue)) {
                            modelValue(elementValue);
                        }
                        else { //handle non-observable one-way binding
                            var allBindings = allBindingsAccessor();
                            if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers'].parsedHtml)
                                allBindings['_ko_property_writers'].parsedHtml(elementValue);
                        }
                    },
                    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                        var value = ko.unwrap(valueAccessor()) || "";
                        var page = bindingContext.$data;
                        var jqueryElement = $(element);
                        jqueryElement.empty();
                        if (value) {
                            if (typeof page.currentValue == "undefined"
                                || page.currentValue === null
                                || page.currentValue != value) {
                                var trimmedValue = value.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");
                                page.parsedHtmlElement = $(trimmedValue);
                                page.currentValue = value;
                            }
                            jqueryElement.append(page.parsedHtmlElement);
                        }
                        else {
                            page.parsedHtmlElement = null;
                            page.currentValue = null;
                        }
                    }
                };
            }
        },

        parseSearchParameters: function (element, value) {
            var viewModel = this;
            viewModel.removeSearchHighlight(element);
            if (value) {
                var text = value.text;
                if (text) {
                    var words;
                    var isCaseSensitive = value.isCaseSensitive;
                    var treatTextAsExact = false;
                    if (value.treatPhrasesInDoubleQuotesAsExact) {
                        var trimmedText = text.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");
                        if (trimmedText.length >= 2 && trimmedText[0] == '"' && trimmedText[trimmedText.length - 1] == '"') {
                            text = text.substr(1, trimmedText.length - 2);
                            text = text.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "");

                            viewModel.currentWordCounter = 0;
                            viewModel.matchedNods = [];
                            viewModel.searchMatches = [];
                            viewModel.matchedNodsCount = 0;
                            treatTextAsExact = true;
                        }
                    }
                    var reservedSymbolsRegExp = /[-[\]{}()*+?.,\\^$|#\s]/g;

                    words = viewModel.getWords(text);
                    if (words == null)
                        return;
                    words = jQuery.map(words, function (word, i) {
                        return word.replace(reservedSymbolsRegExp, "\\$&");
                    });

                    var wordsWithAccentedChars = words;
                    var processedWord;
                    if (viewModel.useAccentInsensitiveSearch || viewModel.useRtl) {
                        wordsWithAccentedChars = new Array();

                        for (wordNum = 0; wordNum < words.length; wordNum++) {
                            processedWord = words[wordNum];
                            if (viewModel.useAccentInsensitiveSearch)
                                processedWord = window.jGroupdocs.stringExtensions.getAccentInsensitiveRegexFromString(processedWord);
                            //if (viewModel.useRtl)
                            //    processedWord = window.jGroupdocs.stringExtensions.unicodeEscape(processedWord);

                            wordsWithAccentedChars.push(processedWord);
                        }
                    }

                    viewModel.searchHtmlElement(element, null, null, words, wordsWithAccentedChars,
                                                value.searchForSeparateWords, isCaseSensitive, treatTextAsExact, value.pageNumber);
                    return;
                }
            }
        },

        highlightSearch: function () {
            if (this.pageContentType == "image" && this.useVirtualScrolling) {
                var selectable = this.getSelectableInstance();
                if (selectable) {
                    selectable.highlightSearch(
                        this.firstVisiblePageForVirtualMode(),
                        this.lastVisiblePageForVirtualMode());
                }
            }
        }
    });
})(jQuery);