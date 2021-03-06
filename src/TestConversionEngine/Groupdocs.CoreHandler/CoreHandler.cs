﻿using Groupdocs.Common;
using Groupdocs.Engine.Viewing;
using Groupdocs.Engine.Viewing.InstallableViewer;
using Groupdocs.Storage;
using Groupdocs.Threading;
using Groupdocs.Web.Helpers.JSON;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using Groupdocs.Web.Helpers;
using Groupdocs.Web.UI.Core;
using Groupdocs.Common.InstallableViewer;

namespace Groupdocs.Web.UI.Core
{
    public class CoreHandler : ICoreHandler
    {
        protected IEditingService _viewingService;
        protected readonly string _rootStoragePath;

        //private readonly IApplicationPathFinder _applicationPathFinder;
        protected readonly IHelper _helper;
        //private readonly IUrlsCreator _urlsCreator;
        protected readonly Logger _logger;
        protected IRootPathFinder _rootPathFinder;

        public CoreHandler(string productName = null)
        {
            _viewingService = new EditingService(null, null);
        }

        public object ViewDocument(IUrlsCreator urlsCreator, IPrintableHtmlCreator printableHtmlCreator,
                                        string path, bool useHtmlBasedEngine = false, bool usePngImagesForHtmlBasedEngine = false,
                                         int? count = null, int? width = null,
                                         int? quality = null, bool usePdf = true,
                                         int? preloadPagesCount = null, bool convertWordDocumentsCompletely = false,
                                         string fileDisplayName = null,
                                         string watermarkText = null, int? watermarkColor = null,
                                         WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                         bool ignoreDocumentAbsence = false,
                                         bool supportPageRotation = false,
                                         bool supportListOfContentControls = false,
                                         bool supportListOfBookmarks = false,
                                         bool embedImagesIntoHtmlForWordFiles = false,
                                         string instanceId = null,
                                         string locale = null)
        {
            string pdfDownloadUrl = null;
            string filename = Path.GetFileName(path);
            string[] imageUrls = null;

            string downloadUrl = urlsCreator.GetFileUrl(path, false, false, fileDisplayName);
            pdfDownloadUrl = urlsCreator.GetFileUrl(path, true, false, fileDisplayName,
                                                    watermarkText, watermarkColor,
                                                    watermarkPosition, watermarkWidth,
                                                    ignoreDocumentAbsence,
                                                    useHtmlBasedEngine, supportPageRotation,
                                                    null);

            string pdfPrintUrl = urlsCreator.GetFileUrl(path, true, true, fileDisplayName,
                watermarkText, watermarkColor,
                watermarkPosition, watermarkWidth,
                ignoreDocumentAbsence,
                useHtmlBasedEngine, supportPageRotation,
                null);

            string[] pageHtml = null, pageCss = null;
            string sharedCss = null;

            int pageCount;
            if (useHtmlBasedEngine)
                pageCount = _viewingService.GenerateHtml(path, null, null, null, null, null, true, false, true, false, false, false, false, false);
            else
                pageCount = _viewingService.GeneratePageImages(path, new ViewingOptions());

            if (useHtmlBasedEngine)
            {
                    _viewingService.GetPagesHtml(path, 0, pageCount, out pageHtml, out pageCss);
                    sharedCss = _viewingService.GetPagesSharedCss(path);
            }
            else
            {
                imageUrls = urlsCreator.GetImageUrlsInternal(path, 0, pageCount, width, quality, usePdf,
                    watermarkText, watermarkColor, watermarkPosition, watermarkWidth,
                    ignoreDocumentAbsence,
                    useHtmlBasedEngine, supportPageRotation,
                    null, locale);
            }

            string javaScriptDescFileContents = _viewingService.GenerateJavaScriptDescription(path, null, true, useHtmlBasedEngine, !useHtmlBasedEngine && !usePdf, false, true);

            string extension = Path.GetExtension(path);
            var data = new
            {
                path,
                id = "",
                doc_type = TypesMapper.GetDocumentTypes(extension).FirstOrDefault().ToString(),
                fileType = TypesMapper.GetFileType(extension).ToString(),
                pageCount = pageCount,
                url = downloadUrl,
                pdfDownloadUrl,
                name = filename,
                imageUrls,
                token = "",
                pdfPrintUrl,
                pageHtml,
                pageCss,
                documentDescription = javaScriptDescFileContents,
                sharedCss
            };

            return data;
        }


        public FileBrowserTreeDataJS LoadFileBrowserTreeData(string path, int pageIndex = 0, int pageSize = -1, string orderBy = null, bool orderAsc = true, string filter = null, string fileTypes = null, bool extended = false, string callback = null, string instanceId = null)
        {
            FileBrowserTreeDataJS data = new FileBrowserTreeDataJS();
            data.nodes = new JsTreeNode[] { new JsTreeNode() {name = "candy.pdf", docType = "Pdf", fileType = "Pdf", size = 123} };
            return data;
        }

        public object GetImageUrls(IUrlsCreator urlsCreator,
                                    string path, string dimension, int firstPage = 0, int pageCount = 0,
                                         int? quality = null, bool usePdf = true,
                                         string watermarkText = null, int? watermarkColor = null,
                                         WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                         bool ignoreDocumentAbsence = false,
                                         bool useHtmlBasedEngine = false,
                                         bool supportPageRotation = false,
                                         string instanceId = null,
                                         string locale = null)
        {
            double width;
            bool isParsed = Double.TryParse(dimension.Substring(0, dimension.Length - 1), out width);
            if (!isParsed)
                return null;

            string[] pageImageUrls;

            pageImageUrls = urlsCreator.GetImageUrlsInternal(path, firstPage, pageCount, (int)width, quality, usePdf,
                                                                  watermarkText, watermarkColor,
                                                                  watermarkPosition,
                                                                  watermarkWidth,
                                                                  ignoreDocumentAbsence,
                                                                  useHtmlBasedEngine, supportPageRotation,
                                                                  instanceId,
                                                                  locale);
            var data = new
            {
                image_urls = pageImageUrls
            };

            return data;
        }


        public byte[] GetDocumentPageImage(string path, int pageIndex, int? width, int? quality, bool usePdf = true,
                                                 string watermarkText = null, int? watermarkColor = null,
                                                 WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                                 float watermarkFontSize = 0,
                                                 bool ignoreDocumentAbsence = false,
                                                 bool useHtmlBasedEngine = false,
                                                 bool rotate = false,
                                                 string instanceId = null, string locale = null)
        {
            byte[] imageBytes = _viewingService.GetCachedImage(path, pageIndex, width, quality, null, usePdf,
                                                        watermarkText, watermarkColor,
                                                        watermarkPosition,
                                                        watermarkFontSize,
                                                        useHtmlBasedEngine,
                                                        rotate);
            return imageBytes;
        }


        public void GetDocumentPageHtml(IUrlsCreator urlsCreator,
                                            string path, int pageIndex, bool usePngImages,
                                            bool embedImagesIntoHtmlForWordFiles,
                                            out string pageHtml, out string pageCss, string instanceId = null, string locale = null)
        {
            throw new NotImplementedException();
        }

        public byte[] GetResourceForHtml(string documentPath, string resourcePath,
                                           DateTime? clientModifiedSince, out bool isModified, out DateTime? fileModificationDateTime,
                                           bool relativeToOriginal = false, string instanceId = null)
        {
            if (relativeToOriginal)
            {
                resourcePath = HttpUtility.UrlDecode(resourcePath);
            }
            else
            {
                string resourceFileName = Path.GetFileName(resourcePath);
                resourcePath = Path.Combine(CommonConstants.HtmlResourceDirectory, resourceFileName);
            }
            byte[] resourceBytes = _viewingService.GetResourceForHtml(documentPath, resourcePath, clientModifiedSince, out isModified, out fileModificationDateTime, relativeToOriginal);
            return resourceBytes;
        }

        public string GetScript(string name)
        {
            throw new NotImplementedException();
        }


        public string GetCss(string name)
        {
            throw new NotImplementedException();
        }

        public void GetEmbeddedImage(string name, out byte[] bytes, out string mimeType)
        {
            throw new NotImplementedException();
        }

        public void GetFont(string name, out byte[] bytes, out string mimeType)
        {
            throw new NotImplementedException();
        }


        public bool GetFile(string path, bool getPdf, bool isPrintable,
                                      out byte[] bytes, out string mimeType,
                                      string displayName = null,
                                      string watermarkText = null, int? watermarkColor = null,
                                      WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                      float watermarkFontSize = 0,
                                      bool ignoreDocumentAbsence = false,
                                      bool useHtmlBasedEngine = false,
                                      bool supportPageRotation = false,
                                      string instanceId = null)
        {
            throw new NotImplementedException();
        }


        public string[] GetPrintableHtml(IImageUrlCreator imageUrlCreator,
                                             string path, bool useHtmlBasedEngine = false,
                                             string displayName = null,
                                             string watermarkText = null, int? watermarkColor = null,
                                             WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal,
                                             float watermarkWidth = 0,
                                             bool ignoreDocumentAbsence = false,
                                             string instanceId = null,
                                             string locale = null)
        {
            throw new NotImplementedException();
        }

        public void ReorderPage(string path, int oldPosition, int newPosition, string instanceId = null)
        {
            throw new NotImplementedException();
        }

        public int RotatePage(string path, int pageNumber, int rotationAmount, string instanceId = null)
        {
            throw new NotImplementedException();
        }

        public string[] GetPageImageUrlsOnThirdPartyStorage(string path, int pageCount, int? quality, int? width,
            int? height, bool usePdf)
        {
            throw new NotImplementedException();
        }
    }
}
