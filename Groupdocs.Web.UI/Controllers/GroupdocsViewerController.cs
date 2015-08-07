using Groupdocs.Web.UI.ActionFilters;
using Groupdocs.Web.UI.Handlers;
using System;
using System.Net;
using System.Net.Mime;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Script.Serialization;

namespace Groupdocs.Web.UI.Controllers
{
    [AllowCrossDomain]
    public class GroupdocsViewerController : Controller, IUrlsCreator
    {
        private readonly IApplicationPathFinder _applicationPathFinder;
        private readonly IPrintableHtmlCreator _printableHtmlCreator;
        private readonly IHelper _helper;
        private readonly IUrlsCreator _urlsCreator;
        private readonly Logger _logger;
        private readonly IRootPathFinder _rootPathFinder;
        private readonly BaseHandler _baseHandler;

        public GroupdocsViewerController(IRootPathFinder rootPathFinder)
        {
        }

        public GroupdocsViewerController()
        {
            _rootPathFinder = new RootPathFinder();

            _applicationPathFinder = new ApplicationPathFinder();
            _printableHtmlCreator = new PrintableHtmlCreator();
            _urlsCreator = new UrlsCreator();
            _helper = new Helper();
            _logger = new Logger(_rootPathFinder.GetLogFilePath());
            _baseHandler = new BaseHandler();

            var lic = new LicenseApplier();
            lic.Apply(true);
        }

        protected override void OnException(ExceptionContext filterContext)
        {
            string pathsMessage = String.Format("Exception\r\nRoot Storage Path:{0}\r\nProcessing Path:{1}",
                _rootPathFinder.GetRootStoragePath(), _rootPathFinder.GetCachePath());
            _logger.LogMessage(pathsMessage);
            _logger.LogException(filterContext.Exception);
            if (!_helper.AreExceptionDetailsShownOnClient())
            {
                filterContext.Result =
                    CreateJsonOrJsonpResponse(new { success = false, Reason = filterContext.Exception.Message }, null);
                filterContext.ExceptionHandled = true;
                //base.OnException(filterContext);
            }
        }


        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult LoadFileBrowserTreeData(string path, int pageIndex = 0, int pageSize = -1, string orderBy = null,
                                                    bool orderAsc = true, string filter = null, string fileTypes = null,
                                                    bool extended = false, string callback = null, string instanceIdToken = null)
        {
            object data = _baseHandler.LoadFileBrowserTreeData(path, pageIndex, pageSize, orderBy, orderAsc, filter,
                                                              fileTypes, extended, callback, instanceIdToken);
            if (data == null)
                return new EmptyResult();

            return CreateJsonOrJsonpResponse(data, callback);
        }


        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ViewDocument(string guid, bool useHtmlBasedEngine = false, bool usePngImagesForHtmlBasedEngine = false,
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
                                         string callback = null,
                                         string instanceIdToken = null,
                                         string locale = null)
        {
            //throw new ArgumentException("test exception");
            //return CreateJsonOrJsonpResponse(new { success = false, Reason = "test Message test Message test Message" }, callback);

            object data = _baseHandler.ViewDocument(this, _printableHtmlCreator,
                                           guid, useHtmlBasedEngine, usePngImagesForHtmlBasedEngine,
                                           count, width,
                                           quality, usePdf,
                                           preloadPagesCount, convertWordDocumentsCompletely,
                                           fileDisplayName,
                                           watermarkText, watermarkColor,
                                           watermarkPosition, watermarkWidth,
                                           ignoreDocumentAbsence,
                                           supportPageRotation,
                                           supportListOfContentControls,
                                           supportListOfBookmarks,
                                           embedImagesIntoHtmlForWordFiles,
                                           callback,
                                           instanceIdToken,
                                           locale);
            return CreateJsonOrJsonpResponse(data, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetImageUrls(string guid, string dimension, string token, int firstPage = 0, int pageCount = 0,
                                         int? quality = null, bool usePdf = true,
                                         string watermarkText = null, int? watermarkColor = null,
                                         WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                         bool ignoreDocumentAbsence = false,
                                         bool useHtmlBasedEngine = false,
                                         bool supportPageRotation = false,
                                         string callback = null,
                                         string instanceIdToken = null, string locale = null)
        {
            object data = _baseHandler.GetImageUrls(this,
                                                   guid, dimension, firstPage, pageCount,
                                                   quality, usePdf,
                                                   watermarkText, watermarkColor,
                                                   watermarkPosition, watermarkWidth,
                                                   ignoreDocumentAbsence,
                                                   useHtmlBasedEngine,
                                                   supportPageRotation,
                                                   callback, instanceIdToken, locale);

            return CreateJsonOrJsonpResponse(data, callback);
        }


        public ActionResult GetDocumentPageImage(string path, int pageIndex, int? width, int? quality, bool usePdf = true,
                                                 string watermarkText = null, int? watermarkColor = null,
                                                 WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                                 float watermarkWidth = 0,
                                                 bool ignoreDocumentAbsence = false,
                                                 bool useHtmlBasedEngine = false,
                                                 bool rotate = false,
                                                 string instanceIdToken = null, string locale = null)
        {
            byte[] imageBytes = _baseHandler.GetDocumentPageImage(path, pageIndex, width, quality, usePdf,
                                                               watermarkText, watermarkColor,
                                                               watermarkPosition,
                                                               watermarkWidth,
                                                               ignoreDocumentAbsence,
                                                               useHtmlBasedEngine,
                                                               rotate,
                                                               instanceIdToken,
                                                               locale);
            return File(imageBytes, "image/jpeg");
        }


        public ActionResult GetDocumentPageHtml(string path, int pageIndex, bool usePngImages,
                                                bool embedImagesIntoHtmlForWordFiles, string instanceIdToken = null, string locale = null)
        {
            string pageHtml, pageCss;
            _baseHandler.GetDocumentPageHtml(this, path, pageIndex, usePngImages, embedImagesIntoHtmlForWordFiles, out pageHtml, out pageCss, instanceIdToken, locale);
            var data = new { pageHtml, pageCss };
            return CreateJsonOrJsonpResponse(data, null);
        }

        public ActionResult GetResourceForHtml(string documentPath, string resourcePath, bool relativeToOriginal = false, string instanceIdToken = null)
        {
            DateTime? clientModifiedSince = GetClientModifiedSince();
            bool isModified;
            DateTime? fileModificationDateTime;
            byte[] resourceBytes = _baseHandler.GetResourceForHtml(documentPath, resourcePath, clientModifiedSince, out isModified, out fileModificationDateTime, relativeToOriginal, instanceIdToken);
            if (!isModified)
                return new HttpStatusCodeResult(304, "Not Modified");

            SetLastModified(fileModificationDateTime);

            if (resourceBytes == null)
                return new HttpStatusCodeResult((int)HttpStatusCode.Gone);
            else
                return File(resourceBytes, _helper.GetImageMimeTypeFromFilename(resourcePath));
        }

        public ActionResult GetScript(string name)
        {
            string script = _baseHandler.GetScript(name);
            return new JavaScriptResult() { Script = script };
        }

        public ActionResult GetCss(string name)
        {
            ActionResult result = CheckIfCached();
            if (result != null)
                return result;

            string css = _baseHandler.GetCss(name);
            return Content(css, "text/css");
        }

        public ActionResult GetEmbeddedImage(string name)
        {
            ActionResult result = CheckIfCached();
            if (result != null)
                return result;

            Tuple<byte[], string> bytesAndMime = _baseHandler.GetEmbeddedImage(name);
            byte[] imageBody = bytesAndMime.Item1;
            string mimeType = bytesAndMime.Item2;
            return File(imageBody, mimeType);
        }

        public ActionResult GetFont(string name)
        {
            ActionResult result = CheckIfCached();
            if (result != null)
                return result;

            Tuple<byte[], string> bytesAndMime = _baseHandler.GetFont(name);
            byte[] fontContent = bytesAndMime.Item1;
            string mimeType = bytesAndMime.Item2;
            return File(fontContent, mimeType);
        }

        public ActionResult GetFile(string path, bool getPdf = false, string displayName = null,
                                      string watermarkText = null, int? watermarkColor = null,
                                      WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                      float watermarkWidth = 0,
                                      bool ignoreDocumentAbsence = false,
                                      bool useHtmlBasedEngine = false,
                                      bool supportPageRotation = false,
                                      string instanceIdToken = null)
        {
            Tuple<byte[], string> bytesAndFileName = _baseHandler.GetFile(path, getPdf, false, displayName,
                                                                        watermarkText, watermarkColor,
                                                                        watermarkPosition, watermarkWidth,
                                                                        ignoreDocumentAbsence,
                                                                        useHtmlBasedEngine, supportPageRotation,
                                                                        instanceIdToken);
            if (bytesAndFileName == null)
            {
                return new EmptyResult();
            }
            if (bytesAndFileName.Item1 == null)
            {
                if (Request != null)
                {
                    if (Request.Cookies[Constants.JqueryFileDownloadCookieName] != null)
                    {
                        var httpCookie = Response.Cookies[Constants.JqueryFileDownloadCookieName];
                        if (httpCookie != null)
                            httpCookie.Expires = DateTime.Now.AddYears(-1);
                    }
                }
                return Content("File not found");
            }

            if (Response != null)
            {
                //jquery.fileDownload uses this cookie to determine that a file download has completed successfully
                Response.SetCookie(new HttpCookie(Constants.JqueryFileDownloadCookieName, "true") { Path = "/" });
            }
            return File(bytesAndFileName.Item1, "application/octet-stream", bytesAndFileName.Item2);
        }

        public ActionResult GetPdfWithPrintDialog(string path, string displayName = null,
                                      string watermarkText = null, int? watermarkColor = null,
                                      WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                      float watermarkWidth = 0,
                                      bool useHtmlBasedEngine = false,
                                      bool supportPageRotation = false,
                                      string instanceIdToken = null)
        {
            if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                return new EmptyResult();

            //string pdfPath = _viewingService.GetPdfWithPrintDialog(path);
            Tuple<byte[], string> bytesAndFileName = _baseHandler.GetFile(path, true, true, displayName,
                                                                        watermarkText, watermarkColor,
                                                                        watermarkPosition, watermarkWidth,
                                                                        false,
                                                                        useHtmlBasedEngine, supportPageRotation,
                                                                        instanceIdToken);

            if (bytesAndFileName == null)
                return new EmptyResult();
            //string filename = Path.GetFileName(pdfPath);
            string contentDispositionString = new ContentDisposition { FileName = bytesAndFileName.Item2, Inline = true }.ToString();
            Response.AddHeader("Content-Disposition", contentDispositionString);
            //Response.AppendHeader("Content-Disposition", "inline; filename=" + bytesAndFileName.Item2);
            return File(bytesAndFileName.Item1, "application/pdf");
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetPrintableHtml(string path, bool useHtmlBasedEngine = false,
                                             string displayName = null,
                                             string watermarkText = null, int? watermarkColor = null,
                                             WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal,
                                             float watermarkWidth = 0,
                                             bool ignoreDocumentAbsence = false,
                                             string callback = null,
                                             string instanceIdToken = null, 
                                             string locale = null)
        {
            if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                return new EmptyResult();

            if (path == null)
            {
                _logger.LogMessage("The path to the document being printed is null");
                return new HttpStatusCodeResult(400);
            }

            string[] pageArray = _baseHandler.GetPrintableHtml(this,
                                                              path, useHtmlBasedEngine,
                                                              displayName,
                                                              watermarkText, watermarkColor,
                                                              watermarkPosition,
                                                              watermarkWidth,
                                                              ignoreDocumentAbsence,
                                                              instanceIdToken, 
                                                              locale);
            return CreateJsonOrJsonpResponse(pageArray, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ReorderPage(string path, int oldPosition, int newPosition, string callback = null, string instanceIdToken = null)
        {
            _baseHandler.ReorderPage(path, oldPosition, newPosition, null, instanceIdToken);
            var data = new { success = true };
            return CreateJsonOrJsonpResponse(data, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult RotatePage(string path, int pageNumber, int rotationAmount, string callback = null, string instanceIdToken = null)
        {
            int resultAngle = _baseHandler.RotatePage(path, pageNumber, rotationAmount, null, instanceIdToken);
            var data = new { resultAngle, success = true };
            return CreateJsonOrJsonpResponse(data, callback);
        }

        #region IUrlsCreator implementation

        public string[] GetImageUrlsInternal(string path, int startingPageNumber, int pageCount, int? pageWidth, int? quality, bool usePdf = true,
                                              string watermarkText = null, int? watermarkColor = null,
                                              WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal, float? watermarkWidth = 0,
                                              bool ignoreDocumentAbsence = false,
                                              bool useHtmlBasedEngine = false,
                                              bool supportPageRotation = false,
                                              string instanceId = null,
                                              string locale = null)
        {
            string[] pageUrls;
            //if (ControllerContext == null)
            //{
            //    pageUrls = _urlsCreator.GetImageUrlsInternal(path, startingPageNumber, pageCount, pageWidth, quality, usePdf,
            //                                         watermarkText, watermarkColor, watermarkPosition ?? WatermarkPosition.Diagonal, watermarkWidth ?? 0,
            //                                         useHtmlBasedEngine, supportPageRotation);
            //}
            //else
            //{
            UrlHelper url = new UrlHelper(ControllerContext.RequestContext);
            string applicationHost = _applicationPathFinder.GetApplicationHost();
            if (applicationHost.EndsWith("/"))
            {
                applicationHost = applicationHost.Substring(0, applicationHost.Length - 1);
            }

            pageUrls = new string[pageCount];
            if (_helper.GetStorageProvider() == SupportedStorageProvider.Local)
            {
                RouteValueDictionary routeValueDictionary = new RouteValueDictionary(){
                                                                    {"path", path},
                                                                    {"width", pageWidth},
                                                                    {"quality", quality},
                                                                    {"usePdf", usePdf},
                                                                       
                                                                    {"useHtmlBasedEngine", useHtmlBasedEngine},
                                                                    {"rotate", supportPageRotation}
                                                                };

                if (!string.IsNullOrEmpty(locale))
                    routeValueDictionary.Add("locale", locale);

                if (!string.IsNullOrEmpty(watermarkText))
                {
                    routeValueDictionary.Add("watermarkText", watermarkText);
                    routeValueDictionary.Add("watermarkColor", watermarkColor);
                    routeValueDictionary.Add("watermarkPosition", watermarkPosition);
                    routeValueDictionary.Add("watermarkWidth", watermarkWidth);
                }
                if (!string.IsNullOrWhiteSpace(instanceId))
                {
                    routeValueDictionary.Add(Constants.InstanceIdRequestKey, instanceId);
                }
                if (ignoreDocumentAbsence)
                    routeValueDictionary.Add("ignoreDocumentAbsence", ignoreDocumentAbsence);

                for (int i = 0; i < pageCount; i++)
                {
                    routeValueDictionary["pageIndex"] = startingPageNumber + i;
                    pageUrls[i] = string.Format("{0}{1}", applicationHost,
                                                url.Action("GetDocumentPageImage", routeValueDictionary));
                }
            }
            else
            {
                pageUrls = _baseHandler.GetPageImageUrlsOnThirdPartyStorage(path, pageCount, quality, pageWidth, null, true);
            }

            return pageUrls;
        }

        public string GetFileUrl(string path, bool getPdf, bool isPrintable, string fileDisplayName = null,
                                 string watermarkText = null, int? watermarkColor = null,
                                 WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                 bool ignoreDocumentAbsence = false,
                                 bool useHtmlBasedEngine = false,
                                 bool supportPageRotation = false,
                                 string instanceId = null)
        {
            UrlHelper urlHelper = new UrlHelper(ControllerContext.RequestContext);
            string displayNameEncoded = Server.UrlEncode(fileDisplayName);
            string instanceIdToken = instanceId;
            string fileUrl = ConvertUrlToAbsolute(urlHelper.Action(isPrintable ? "GetPdfWithPrintDialog" : "GetFile",
                                                  new
                                                  {
                                                      path,
                                                      displayName = displayNameEncoded,
                                                      getPdf,
                                                      isPrintable,
                                                      watermarkText,
                                                      watermarkColor,
                                                      watermarkPosition,
                                                      watermarkWidth,
                                                      ignoreDocumentAbsence,
                                                      useHtmlBasedEngine,
                                                      supportPageRotation,
                                                      instanceIdToken
                                                  }));
            return fileUrl;
        }

        public string GetResourceForHtmlUrl(string documentPath, string resourcePath,
                                            bool relativeToOriginal = false, string instanceId = null)
        {
            UrlHelper urlHelper = new UrlHelper(ControllerContext.RequestContext);
            string instanceIdToken = instanceId;
            string urlForResourcesInHtml = ConvertUrlToAbsolute(urlHelper.Action("GetResourceForHtml", new { documentPath, relativeToOriginal, resourcePath, instanceIdToken }));
            return urlForResourcesInHtml;
        }
        #endregion

        #region Private methods

        private string ConvertUrlToAbsolute(string inputUrl)
        {
            string applicationHost = _applicationPathFinder.GetApplicationHost();
            if (applicationHost.EndsWith("/"))
            {
                applicationHost = applicationHost.Substring(0, applicationHost.Length - 1);
            }
            string result = string.Format("{0}{1}", applicationHost, inputUrl);
            return result;
        }

        private ActionResult CreateJsonOrJsonpResponse(object data, string callback, bool serialize = true)
        {
            bool isJsonP = Request != null && Request.HttpMethod == "GET";

            string serializedData;
            if (isJsonP)
            {
                if (serialize)
                    serializedData = new JavaScriptSerializer().Serialize(data);
                else
                    serializedData = (string)data;
                string serializedDataWithCallback = String.Format("{0}({1})", callback, serializedData);
                return Content(serializedDataWithCallback, "application/javascript");
            }
            else
            {
                if (serialize)
                {
                    return new LargeJsonResult() { Data = data };
                }
                else
                {
                    serializedData = (string)data;
                    return Content(serializedData, "application/json");
                }
            }
        }

        private DateTime? GetClientModifiedSince()
        {
            string stringClientModifiedSince = Request.Headers["If-Modified-Since"];
            DateTime? clientModifiedSince = _helper.GetDateTimeFromClientHeader(stringClientModifiedSince);
            return clientModifiedSince;
        }

        private void SetLastModified(DateTime? fileModificationDateTime)
        {
            if (fileModificationDateTime.HasValue)
            {
                DateTime now = DateTime.Now;
                if (fileModificationDateTime > now)
                    fileModificationDateTime = now;
                Response.Cache.SetLastModified((DateTime)fileModificationDateTime);
            }
        }


        private ActionResult CheckIfCached()
        {
            string stringClientModifiedSince = Request.Headers["If-Modified-Since"];
            DateTime assemblyModificationDateTime = _helper.GetAssemblyLastModificationTime();
            if (!_helper.IsCachedResourceModified(stringClientModifiedSince))
                return new HttpStatusCodeResult(304, "Not Modified");

            Response.Cache.SetCacheability(HttpCacheability.Public);
            DateTime now = DateTime.Now;
            if (assemblyModificationDateTime > now)
                assemblyModificationDateTime = now;
            Response.Cache.SetLastModified(assemblyModificationDateTime);
            return null;
        }

        #endregion
    }
}