if (!window.groupdocs)
    window.groupdocs = {};

groupdocs.PortalService = function (applicationPath, useHttpHandlers, isWorkingCrossDomain) {
    this._init(applicationPath, useHttpHandlers, isWorkingCrossDomain);
};

$.extend(groupdocs.PortalService.prototype, {
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

    viewDocumentAsHtml: function (userId, privateKey, guid, preloadPagesCount, fileDisplayName, usePngImagesForHtmlBasedEngine,
                                  convertWordDocumentsCompletely,
                                  watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                                  ignoreDocumentAbsence, supportPageRotation,
                                  supportListOfContentControls, supportListOfBookmarks,
                                  embedImagesIntoHtmlForWordFiles,
                                  successCallback, errorCallback, useCache, instanceIdToken, locale) {
        var data = {
            userId: userId, privateKey: privateKey, guid: guid, useHtmlBasedEngine: true,
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
        this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ViewDocument' + this._urlSuffix, data, successCallback, errorCallback, useCache != null ? useCache : false);
    },

    getDocumentPageHtml: function (path, pageIndex, usePngImages,
                                   embedImagesIntoHtmlForWordFiles,
                                   successCallback, errorCallback,
                                   instanceIdToken, locale) {
        var data = {
            path: path, pageIndex: pageIndex, usePngImages: usePngImages,
            embedImagesIntoHtmlForWordFiles: embedImagesIntoHtmlForWordFiles,
            instanceIdToken: instanceIdToken,
            locale: locale
        };
        this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetDocumentPageHtml' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    viewDocument: function (guid, width, quality, usePdf, preloadPagesCount, password, fileDisplayName,
                            watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                            ignoreDocumentAbsence, supportPageRotation,
                            supportListOfContentControls, supportListOfBookmarks,
                            successCallback, errorCallback, useCache, instanceIdToken, locale) {
        var data = {
            guid: guid, width: width, quality: quality, usePdf: usePdf, preloadPagesCount: preloadPagesCount, password: password, fileDisplayName: fileDisplayName,
            watermarkText: watermarkText, watermarkColor: watermarkColor, watermarkPosition: watermarkPosition, watermarkWidth: watermarkWidth,
            ignoreDocumentAbsence: ignoreDocumentAbsence, supportPageRotation: supportPageRotation,
            supportListOfContentControls: supportListOfContentControls, supportListOfBookmarks: supportListOfBookmarks,
            instanceIdToken: instanceIdToken,
            locale: locale
        };
        this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ViewDocument' + this._urlSuffix, data, successCallback, errorCallback, useCache != null ? useCache : false);
    },


    getPdf2JavaScript: function (userId, privateKey, guid, descForHtmlBasedEngine, successCallback, errorCallback) {
        var data = { guid: guid, descForHtmlBasedEngine: descForHtmlBasedEngine };
        return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetPdf2JavaScript' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    getImageUrlsAsync: function (userId, privateKey, guid, dimension, token, firstPage, pageCount, quality, usePdf, docVersion,
                                 watermarkText, watermarkColor, watermarkPosition, watermarkFontSize,
                                 ignoreDocumentAbsence,
                                 useHtmlBasedEngine, supportPageRotation,
                                 successCallback, errorCallback,
                                 instanceIdToken, locale) {
        var data = {
            userId: userId,
            privateKey: privateKey,
            guid: guid,
            dimension: dimension,
            token: token,
            firstPage: firstPage,
            pageCount: pageCount,
            quality: quality,
            usePdf: usePdf,
            docVersion: docVersion,
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
        return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetImageUrls' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    loadFileBrowserTreeData: function (userId, privateKey, path, pageIndex, pageSize, orderBy, orderAsc, filter, fileTypes, extended, successCallback, errorCallback, useCache, instanceIdToken) {
        var data = { userId: userId, privateKey: privateKey, path: path, pageIndex: pageIndex, pageSize: pageSize, orderBy: orderBy, orderAsc: orderAsc, filter: filter, fileTypes: fileTypes, extended: extended, instanceIdToken: instanceIdToken };
        return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/LoadFileBrowserTreeData' + this._urlSuffix, data, successCallback, errorCallback, useCache != null ? useCache : true);
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
        return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/GetPrintableHtml' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    reorderPage: function (path, oldPosition, newPosition, successCallback, errorCallback, instanceIdToken) {
        var data = { path: path, oldPosition: oldPosition, newPosition: newPosition, instanceIdToken: instanceIdToken };
        return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ReorderPage' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    rotatePage: function (path, pageNumber, rotationAmount, successCallback, errorCallback, instanceIdToken) {
        var data = { path: path, pageNumber: pageNumber, rotationAmount: rotationAmount, instanceIdToken: instanceIdToken };
        return this._runServiceAsync(this.applicationPath + this.urlPrefix + '/RotatePage' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    _runServiceSync: function (url, data, useCache) {
        var r = null;
        var serviceCallEnded = false;
        var successCallback = function (response) {
            serviceCallEnded = true;
            r = response.data;
        };
        this._runService(url, data, false, successCallback, null, useCache);
        return r;
    },

    _runServiceAsync: function (url, data, successCallback, errorCallback, useCache, convertToXml) {
        return this._runService(url, data, true, successCallback, errorCallback, useCache, convertToXml);
    },


    _runService: function (url, data, mode, successCallback, errorCallback, useCache, convertToXml) {
        var stringData = JSON.stringify(data);
        var cacher = null;
        if (useCache) {
            cacher = Container.Resolve("Cacher");
            var cacheItem = cacher.get(url + stringData);
            if (cacheItem) {
                cacheItem.value.Subscribe(function (response) {
                    this._successHandler(response, successCallback);
                }.bind(this), function (ex) { this._errorHandler(ex, errorCallback); }.bind(this));
                return cacheItem.value;
            }
        }

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
            //data: (this.useJSONP && this._useHttpHandlers) ? ("data=" + stringData.toString()) : stringData,
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

        if (useCache) {
            cacher.add(url + stringData, requestObservable, this._cacheTimeout);
        }
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