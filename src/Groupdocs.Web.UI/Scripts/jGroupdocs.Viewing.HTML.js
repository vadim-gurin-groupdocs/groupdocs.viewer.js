(function ($, undefined) {
    "use strict";

    $.groupdocsWidget("groupdocsDocumentHtmlRendering", {
        _viewModel: null,
        options: {
            fileId: 0,
            quality: null,
            use_pdf: "true",
            showHyperlinks: true
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
            var vm = new window.groupdocs.documentHtmRenderingComponentViewModel(this.options);
            return vm;
        },

        _createHtml: function () {
            var root = this.element;
            this.bindingProvider.createHtml("viewing", this.element, this.options);
            root.trigger("onHtmlCreated");
        }
    });

    window.groupdocs.documentHtmRenderingComponentModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(window.groupdocs.documentHtmRenderingComponentModel.prototype, window.groupdocs.documentComponentModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("ServerExchange");
        },

        loadDocumentAsHtml: function (fileId, pagesCountToShow, fileDisplayName, usePngImages, convertWordDocumentsCompletely,
                                      watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                      ignoreDocumentAbsence, supportPageRotation,
                                      supportListOfContentControls, supportListOfBookmarks,
                                      embedImagesIntoHtmlForWordFiles,
                                      instanceIdToken,
                                      locale,
                                      callback, errorCallback) {
            this._portalService.viewDocumentAsHtml(fileId, this.preloadPagesCount, fileDisplayName, usePngImages,
                                                   convertWordDocumentsCompletely,
                                                   watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                                   ignoreDocumentAbsence, supportPageRotation,
                                                   supportListOfContentControls, supportListOfBookmarks,
                                                   embedImagesIntoHtmlForWordFiles,
                                                   instanceIdToken,
                                                   locale,
                function (response) {
                    if (response.data) {
                        callback.apply(this, [response.data]);
                    }
                    else {
                        errorCallback.apply(this);
                    }
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                },
                false
            );
        },

        getDocumentPageHtml: function (fileId, pageNumber, usePngImages,
                                       embedImagesIntoHtmlForWordFiles,
                                       locale, instanceIdToken,
                                       callback, errorCallback) {
            this._portalService.getDocumentPageHtml(fileId, pageNumber, usePngImages,
                embedImagesIntoHtmlForWordFiles,
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

    window.groupdocs.documentHtmRenderingComponentViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(window.groupdocs.documentHtmRenderingComponentViewModel.prototype, window.groupdocs.documentComponentViewModel.prototype, {
        imageHorizontalMargin: 0,

        options: {
            showHyperlinks: true
        },

        _create: function (options) {
            this._model = new window.groupdocs.documentHtmRenderingComponentModel(options);
            this._init(options);
        },

        _init: function (options) {
            this.calculatePointToPixelRatio();
            var self = this;
            this.useTabsForPages = this.bindingProvider.getObservable(null);
            this.tabs = this.bindingProvider.getObservableArray([]);
            this.activeTab = this.bindingProvider.getObservable(0);
            this.isHtmlDocument = this.bindingProvider.getObservable(false);
            this.rotatedWidth = this.bindingProvider.getComputedObservable(function () {
                if (self.useTabsForPages()) {
                    var width = self.pageWidth();
                    return width / self.zoom() * 100.0 + "px";
                }
                else
                    return "auto";
            });
            window.groupdocs.documentComponentViewModel.prototype._init.call(this, options);
        },

        loadDocument: function (fileId) {
            window.groupdocs.documentComponentViewModel.prototype.loadDocument.call(this, fileId);

            var pageCountToShow = 1;
            this._model.loadDocumentAsHtml(fileId || this.fileId, pageCountToShow, this.fileDisplayName, this.usePngImagesForHtmlBasedEngine,
                this.convertWordDocumentsCompletely,
                this.watermarkText, this.watermarkColor, this.watermarkPosition, this.watermarkWidth,
                this.ignoreDocumentAbsence, this.supportPageRotation,
                this.supportListOfContentControls, this.supportListOfBookmarks,
                this.embedImagesIntoHtmlForWordFiles,
                this.instanceIdToken,
                this.locale,
                function (response) {
                    if (typeof (fileId) !== 'undefined')
                        this.fileId = fileId;
                    this.pageWidth(this.pageImageWidth * (this.initialZoom / 100));
                    this._onDocumentLoadedBeforePdf2Xml(response);
                }.bind(this),
                function (error) {
                    this._onDocumentLoadFailed(error);
                }.bind(this)
            );
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
                    this.locale,
                    function (response) {
                        this.setPageHtml(page, pageNumber, response.pageHtml, response.pageCss);
                        if (successCallback)
                            successCallback.call();
                    }.bind(this),
                    function (error) {
                        page.startedDownloadingPage = false;
                        this._onError(error);
                    }.bind(this)
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

        _onError: function (error) {
            this.inprogress(false);
            var errorFunction = window.jerror || (window.jGDError && window.jGDError[this.instanceId]);
            if (errorFunction)
                errorFunction(error.Reason || "The document couldn't be loaded...");
        },

        initPagesAfterDocumentLoad: function (response) {
            this.watermarkScreenWidth = null;
            this.zoom(100);
            this.fileType = response.fileType;
            this.urlForResourcesInHtml = response.urlForResourcesInHtml;
            var pages = null;
            var pageSize = null;
            var i;
            var rotationFromServer;
            var isTextDocument;
            var scaleRatio;

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


            var pageCount = this.pageCount();
            var pagesNotObservable = [];
            var pageDescription;

            this.serverPages = pages = this._pdf2XmlWrapper.documentDescription.pages;
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
            return pagesNotObservable;
        },

        ScrollDocView: function (item, e) {
            if (!this.useTabsForPages())
                window.groupdocs.documentComponentViewModel.prototype.ScrollDocView.call(this, item, e);
        },

        ScrollDocViewEnd: function(item, e) {
            if (!this.useTabsForPages())
                window.groupdocs.documentComponentViewModel.prototype.ScrollDocViewEnd.call(this, item, e);
        },

        getVisiblePagesNumbers: function() {
            if (this.useTabsForPages())
                return { start: 1, end: 1 };
            else
                return window.groupdocs.documentComponentViewModel.prototype.getVisiblePagesNumbers.call(this);
        },

        loadImageForPage: function (number, page, forceLoading) {
            var isPageVisible = page.visible();
            if (isPageVisible)
                this.markContentControls(number);
                
            if (!isPageVisible) {
                this.getDocumentPageHtml(number);
            }
        },

        makePageVisible: function (pageNumber, page) {
            if (!page.visible()) {
                this.getDocumentPageHtml(pageNumber);
            }
        },
        
        setZoom: function (value) {
            window.groupdocs.documentComponentViewModel.prototype.setZoom.call(this, value);
            this.clearContentControls();
            this.reInitSelectable();
            this.setPage(this.pageIndex());
            this.loadImagesForVisiblePages();
            this.reflowPagesInChrome(true);
        },

        loadPagesZoomed: function () {
            var newWidth = window.groupdocs.documentComponentViewModel.prototype.loadPagesZoomed.call(this);
            if (newWidth !== null) {
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
            }
        },

        performSearch: function (value, isCaseSensitive, searchForSeparateWords, treatPhrasesInDoubleQuotesAsExact) {
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

        calculatePageSize: function () {
            if (this.useTabsForPages()) {
                var htmlPageContents = this.documentSpace.find(".html_page_contents:first");
                var pageElement = htmlPageContents.children("div,table");
                var pageWidth = pageElement.width();
                this.initialWidth = pageWidth;
                this.pageWidth(pageWidth * this.zoom() / 100);
                return true;
            }
            return false;
        },

        reflowPagesInChrome: function (async) {
            /* a hack to make Chrome reflow pages after changing their size 
            when SVG watermarks are enabled */
            if (this.browserIsChrome() && this.watermarkText && !this.useVirtualScrolling) {
                var self = this;
                var internalReflow = function () {
                    self.pagesContainerElement.children().each(function () {
                        $(this).css("top", 0).css("left", 0);
                    });
                };

                if (async)
                    window.setTimeout(internalReflow, 10);
                else
                    internalReflow();
            }
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
            window.groupdocs.documentComponentViewModel.prototype.adjustInitialZoom.call(this);

            if (this.zoomToFitWidth) {
                var fittingWidth = this.getFitWidth();
                var originalPageWidth = this.pageWidth();
                if (!this.onlyShrinkLargePages || originalPageWidth > fittingWidth) {
                    var zoom = fittingWidth / originalPageWidth * 100;
                    this.setZoom(zoom);
                }
            }
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
            var fontHeight = 10;
            var pageWidth = 100;
            var pageHeight = pageWidth * pageProportion;
            var textWidth;
            if (this.watermarkScreenWidth == null) {
                var textSize;
                if (!element)
                    element = page.scopeElement[0];
                textSize = element.getBBox();
                this.watermarkScreenWidth = textSize.width;
            }
            textWidth = this.watermarkScreenWidth;

            var scale;
            if (this.watermarkWidth == null)
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

        getScaleRatioForPage: function (widthForMaxHeight, maxPageHiegt, pageWidth) {
            var widthRatio, scaleRatio;
            if (widthForMaxHeight === undefined)
                widthRatio = 1;
            else
                widthRatio = widthForMaxHeight / pageWidth;
            scaleRatio = widthRatio;
            return scaleRatio;
        },

        setScaleRatioForPage: function (page, widthForMaxHeight, maxPageHiegt, pageWidth) {
            var scaleRatio = this.getScaleRatioForPage(widthForMaxHeight, maxPageHiegt, pageWidth);
            page.heightRatio(scaleRatio);
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
            this.triggerEvent("ScrollDocView", [null, { target: this.documentSpace[0] }]);
            this.triggerEvent("ScrollDocViewEnd", [null, { target: this.documentSpace[0] }]);
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

                            wordsWithAccentedChars.push(processedWord);
                        }
                    }

                    viewModel.searchHtmlElement(element, null, null, words, wordsWithAccentedChars,
                                                value.searchForSeparateWords, isCaseSensitive, treatTextAsExact, value.pageNumber);
                    return;
                }
            }
        }
    });
})(jQuery);