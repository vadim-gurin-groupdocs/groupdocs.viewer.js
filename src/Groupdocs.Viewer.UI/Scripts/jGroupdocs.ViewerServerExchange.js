(function ($) {
    "use strict";

    if (!window.groupdocs)
        window.groupdocs = {};

    groupdocs.ServerExchange = function (applicationPath, useHttpHandlers, isWorkingCrossDomain) {
        this._init(applicationPath, useHttpHandlers, isWorkingCrossDomain);
    };

    $.extend(groupdocs.ServerExchange.prototype, {
        _urlSuffix: "",
        _lastError: null,
        _service: null,
        _cacheTimeout: 300,
        applicationPath: null,
        useJSONP: false,
        _useHttpHandlers: false,
        urlPrefix: "document-viewer",

        _init: function (applicationPath, useHttpHandlers, isWorkingCrossDomain) {
            this.applicationPath = applicationPath;
            this._useHttpHandlers = useHttpHandlers;
            if (useHttpHandlers)
                this._urlSuffix = "Handler";
            if ($.browser.msie && $.browser.version == 8 && isWorkingCrossDomain)
                this.useJSONP = true;
        },

        viewDocumentAsHtml: function (path, preloadPagesCount, fileDisplayName, usePngImagesForHtmlBasedEngine,
                                      convertWordDocumentsCompletely,
                                      watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                      ignoreDocumentAbsence, supportPageRotation,
                                      supportListOfContentControls, supportListOfBookmarks,
                                      embedImagesIntoHtmlForWordFiles,
                                      instanceIdToken, locale,
                                      successCallback, errorCallback) {
            var data = {
                path: path, useHtmlBasedEngine: true,
                preloadPagesCount: preloadPagesCount,
                fileDisplayName: fileDisplayName,
                usePngImagesForHtmlBasedEngine: usePngImagesForHtmlBasedEngine,
                convertWordDocumentsCompletely: convertWordDocumentsCompletely,
                ignoreDocumentAbsence: ignoreDocumentAbsence,
                supportPageRotation: supportPageRotation,
                supportListOfContentControls: supportListOfContentControls, supportListOfBookmarks: supportListOfBookmarks,
                watermarkText: watermarkText, watermarkColor: watermarkColor, watermarkPosition: watermarkPosition, watermarkWidth: watermarkWidth,
                embedImagesIntoHtmlForWordFiles: embedImagesIntoHtmlForWordFiles,
                instanceIdToken: instanceIdToken,
                locale: locale
            };
            this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ViewDocument' + this._urlSuffix, data, successCallback, errorCallback);
        },

        getDocumentPageHtml: function (path, pageIndex, usePngImages,
                                       embedImagesIntoHtmlForWordFiles,
                                       instanceIdToken, locale,
                                       successCallback, errorCallback) {
            var data = {
                path: path, pageIndex: pageIndex, usePngImages: usePngImages,
                embedImagesIntoHtmlForWordFiles: embedImagesIntoHtmlForWordFiles,
                instanceIdToken: instanceIdToken,
                locale: locale
            };
            this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetDocumentPageHtml' + this._urlSuffix, data, successCallback, errorCallback);
        },

        viewDocument: function (path, width, quality, usePdf, preloadPagesCount, password, fileDisplayName,
                                watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                ignoreDocumentAbsence, supportPageRotation,
                                supportListOfContentControls, supportListOfBookmarks,
                                instanceIdToken, locale,
                                successCallback, errorCallback) {
            var data = {
                path: path, width: width, quality: quality, usePdf: usePdf, preloadPagesCount: preloadPagesCount, password: password, fileDisplayName: fileDisplayName,
                watermarkText: watermarkText, watermarkColor: watermarkColor, watermarkPosition: watermarkPosition, watermarkWidth: watermarkWidth,
                ignoreDocumentAbsence: ignoreDocumentAbsence, supportPageRotation: supportPageRotation,
                supportListOfContentControls: supportListOfContentControls, supportListOfBookmarks: supportListOfBookmarks,
                instanceIdToken: instanceIdToken,
                locale: locale
            };
            this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ViewDocument' + this._urlSuffix, data, successCallback, errorCallback);
        },
    
        getImageUrlsAsync: function (path, width, firstPage, pageCount, quality, usePdf,
                                     watermarkText, watermarkColor, watermarkPosition, watermarkFontSize,
                                     ignoreDocumentAbsence,
                                     useHtmlBasedEngine, supportPageRotation,
                                     instanceIdToken, locale,
                                     successCallback, errorCallback) {
            var data = {
                path: path,
                width: width,
                firstPage: firstPage,
                pageCount: pageCount,
                quality: quality,
                usePdf: usePdf,
                watermarkText: watermarkText,
                watermarkColor: watermarkColor,
                watermarkPosition: watermarkPosition,
                watermarkFontSize: watermarkFontSize,
                ignoreDocumentAbsence: ignoreDocumentAbsence,
                useHtmlBasedEngine: useHtmlBasedEngine,
                supportPageRotation: supportPageRotation,
                instanceIdToken: instanceIdToken,
                locale: locale
            };
            return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetImageUrls' + this._urlSuffix, data, successCallback, errorCallback);
        },

        loadFileBrowserTreeData: function (path, pageIndex, pageSize, orderBy, orderAsc, filter, fileTypes, extended, instanceIdToken, successCallback, errorCallback) {
            var data = { path: path, pageIndex: pageIndex, pageSize: pageSize, orderBy: orderBy, orderAsc: orderAsc, filter: filter, fileTypes: fileTypes, extended: extended, instanceIdToken: instanceIdToken };
            return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/LoadFileBrowserTreeData' + this._urlSuffix, data, successCallback, errorCallback);
        },

        getPrintableHtml: function (path, useHtmlBasedEngine, fileDisplayName,
                                    watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                    ignoreDocumentAbsence,
                                    successCallback, errorCallback,
                                    instanceIdToken, locale) {
            var data = {
                path: path, useHtmlBasedEngine: useHtmlBasedEngine, displayName: fileDisplayName,
                watermarkText: watermarkText, watermarkColor: watermarkColor,
                watermarkPosition: watermarkPosition, watermarkWidth: watermarkWidth,
                ignoreDocumentAbsence: ignoreDocumentAbsence,
                instanceIdToken: instanceIdToken,
                locale: locale
            };
            return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetPrintableHtml' + this._urlSuffix, data, successCallback, errorCallback);
        },

        reorderPage: function (path, oldPosition, newPosition, instanceIdToken, successCallback, errorCallback) {
            var data = { path: path, oldPosition: oldPosition, newPosition: newPosition, instanceIdToken: instanceIdToken };
            return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ReorderPage' + this._urlSuffix, data, successCallback, errorCallback);
        },

        rotatePage: function (path, pageNumber, rotationAmount, instanceIdToken, successCallback, errorCallback) {
            var data = { path: path, pageNumber: pageNumber, rotationAmount: rotationAmount, instanceIdToken: instanceIdToken };
            return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/RotatePage' + this._urlSuffix, data, successCallback, errorCallback);
        },

        _runServiceSync: function (url, data) {
            var r = null;
            var serviceCallEnded = false;
            var successCallback = function (response) {
                serviceCallEnded = true;
                r = response.data;
            };
            this._runService(url, data, false, successCallback, null);
            return r;
        },

        _runServiceAsync: function (url, data, successCallback, errorCallback, convertToXml) {
            return this._runService(url, data, true, successCallback, errorCallback, convertToXml);
        },


        _runService: function (url, data, mode, successCallback, errorCallback, convertToXml) {
            var stringData = JSON.stringify(data);
            var dataToSend;
            if (this.useJSONP) {
                if (this._useHttpHandlers)
                    dataToSend = "data=" + stringData.toString();
                else
                    dataToSend = data;
            }
            else {
                dataToSend = stringData;
            }

            var requestObservable = Container.Resolve("RequestObservable")({
                url: url,
                type: this.useJSONP ? "GET" : "POST",
                contentType: "application/json; charset=utf-8",
                dataType: this.useJSONP ? "jsonp" + (convertToXml ? " xml" : "") : null,
                data: dataToSend,
                async: mode
            });
            var finalHandler = Container.Resolve("AsyncSubject");
            requestObservable.Finally = function (method) {
                finalHandler.Subscribe(method);
            };
            requestObservable.Subscribe(
                function (response) {
                    if (response) {
                        if (response.data.success === false) {
                            var error = { code: response.data.code, Reason: (response.data ? response.data.Reason : null) };
                            if (errorCallback) {
                                errorCallback(error);
                            }
                        }
                        else {
                            this._successHandler(response, successCallback);
                        }
                    }

                    finalHandler.OnNext();
                    finalHandler.OnCompleted();
                }.bind(this),
                function (ex) {
                    this._errorHandler(ex, errorCallback);
                    finalHandler.OnNext();
                    finalHandler.OnCompleted();
                }.bind(this));

            return requestObservable;
        },

        _errorHandler: function (ex, errorCallback) {
            var error = null;
            if (ex.xmlHttpRequest.readyState == 0) {
                if (ex.xmlHttpRequest.status === 0) {
                    error = { Reason: "Can't connect to server" };
                }
                else
                    return;
            }

            var errorCode = ex.xmlHttpRequest.status;
            if (!error)
                error = { Reason: ex.xmlHttpRequest.responseText };

            try {
                if (errorCallback) {
                    errorCallback(error);
                }
            }
            catch (e) { }
        },

        _successHandler: function (response, successCallback) {
            if (successCallback) {
                if (response.xmlHttpRequest.responseText == '') {
                    response.data = null;
                }

                successCallback(response);
            }
        }
    });

})(jQuery);