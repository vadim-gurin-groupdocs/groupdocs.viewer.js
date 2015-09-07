using Groupdocs.Viewer.UI.ActionFilters;
using System;
using System.Net;
using System.Net.Mime;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Script.Serialization;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.Core;

namespace Groupdocs.Viewer.UI.Controllers
{
    [AllowCrossDomain]
    public class GroupdocsViewerController : Controller, IUrlsCreator
    {
        private readonly IApplicationPathFinder _applicationPathFinder;
        private readonly IPrintableHtmlCreator _printableHtmlCreator;
        private readonly IHelper _helper;
        //private readonly IRootPathFinder _rootPathFinder;
        private readonly ICoreHandler _coreHandler;

        public GroupdocsViewerController()
        {
            //_rootPathFinder = new RootPathFinder();
            _applicationPathFinder = new ApplicationPathFinder();
            _printableHtmlCreator = new PrintableHtmlCreator();
            _helper = new Helper();
            _coreHandler = new CoreHandler();
        }

        public GroupdocsViewerController(IRootPathFinder rootPathFinder,
                                        IApplicationPathFinder applicationPathFinder,
                                        IPrintableHtmlCreator printableHtmlCreator,
                                        IHelper helper,
                                        ICoreHandler coreHandler)
        {
            //_rootPathFinder = rootPathFinder;
            _applicationPathFinder = applicationPathFinder;
            _printableHtmlCreator = printableHtmlCreator;
            _helper = helper;
            _coreHandler = coreHandler;
        }

        //protected override void OnException(ExceptionContext filterContext)
        //{
        //    string pathsMessage = String.Format("Exception\r\nRoot Storage Path:{0}\r\nProcessing Path:{1}",
        //        _rootPathFinder.GetRootStoragePath(), _rootPathFinder.GetCachePath());
        //    _logger.LogMessage(pathsMessage);
        //    _logger.LogException(filterContext.Exception);
        //    if (!_helper.AreExceptionDetailsShownOnClient())
        //    {
        //        filterContext.Result =
        //            CreateJsonOrJsonpResponse(new { success = false, Reason = filterContext.Exception.Message }, null);
        //        filterContext.ExceptionHandled = true;
        //    }
        //}


        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult LoadFileBrowserTreeData(string path, int pageIndex = 0, int pageSize = -1, string orderBy = null,
                                                    bool orderAsc = true, string filter = null, string fileTypes = null,
                                                    bool extended = false, string callback = null, string instanceIdToken = null)
        {
            object data = _coreHandler.LoadFileBrowserTreeData(path, pageIndex, pageSize, orderBy, orderAsc, filter,
                                                              fileTypes, extended, callback, instanceIdToken);
            if (data == null)
                return new EmptyResult();

            return CreateJsonOrJsonpResponse(data, callback);
        }


        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ViewDocument(string path, bool useHtmlBasedEngine = false, bool usePngImagesForHtmlBasedEngine = false,
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
                                         string instanceIdToken = null,
                                         string locale = null,
                                         string callback = null)
        {
            //throw new ArgumentException("test exception");
            //return CreateJsonOrJsonpResponse(new { success = false, Reason = "test Message test Message test Message" }, callback);

            object data = _coreHandler.ViewDocument(this, _printableHtmlCreator,
                                           path, useHtmlBasedEngine, usePngImagesForHtmlBasedEngine,
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
        public ActionResult GetImageUrls(string path, string dimension, string token, int firstPage = 0, int pageCount = 0,
                                         int? quality = null, bool usePdf = true,
                                         string watermarkText = null, int? watermarkColor = null,
                                         WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                         bool ignoreDocumentAbsence = false,
                                         bool useHtmlBasedEngine = false,
                                         bool supportPageRotation = false,
                                         string callback = null,
                                         string instanceIdToken = null, string locale = null)
        {
            object data = _coreHandler.GetImageUrls(this,
                                                   path, dimension, firstPage, pageCount,
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
            byte[] imageBytes = _coreHandler.GetDocumentPageImage(path, pageIndex, width, quality, usePdf,
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
            _coreHandler.GetDocumentPageHtml(this, path, pageIndex, usePngImages, embedImagesIntoHtmlForWordFiles, out pageHtml, out pageCss, instanceIdToken, locale);
            var data = new { pageHtml, pageCss };
            return CreateJsonOrJsonpResponse(data, null);
        }

        public ActionResult GetResourceForHtml(string documentPath, string resourcePath, bool relativeToOriginal = false, string instanceIdToken = null)
        {
            DateTime? clientModifiedSince = GetClientModifiedSince();
            bool isModified;
            DateTime? fileModificationDateTime;
            byte[] resourceBytes = _coreHandler.GetResourceForHtml(documentPath, resourcePath, clientModifiedSince, out isModified, out fileModificationDateTime, relativeToOriginal, instanceIdToken);
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
            string script = _coreHandler.GetScript(name);
            return new JavaScriptResult() { Script = script };
        }

        public ActionResult GetCss(string name)
        {
            string css = _coreHandler.GetCss(name);
            return Content(css, "text/css");
        }

        //public ActionResult GetEmbeddedImage(string name)
        //{
        //    ActionResult result = CheckIfCached();
        //    if (result != null)
        //        return result;

        //    byte[] bytes;
        //    string mimeType;
        //    _baseHandler.GetEmbeddedImage(name, out bytes, out mimeType);
        //    return File(bytes, mimeType);
        //}

        //public ActionResult GetFont(string name)
        //{
        //    ActionResult result = CheckIfCached();
        //    if (result != null)
        //        return result;

        //    byte[] bytes;
        //    string mimeType;
        //    _baseHandler.GetFont(name, out bytes, out mimeType);
        //    return File(bytes, mimeType);
        //}

        public ActionResult GetFile(string path, bool getPdf = false, string displayName = null,
                                      string watermarkText = null, int? watermarkColor = null,
                                      WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                      float watermarkWidth = 0,
                                      bool ignoreDocumentAbsence = false,
                                      bool useHtmlBasedEngine = false,
                                      bool supportPageRotation = false,
                                      string instanceIdToken = null)
        {
            byte[] bytes;
            string fileDisplayName;
            bool isSuccessful = _coreHandler.GetFile(path, getPdf, false,
                                                    out bytes, out fileDisplayName,
                                                    displayName,
                                                    watermarkText, watermarkColor,
                                                    watermarkPosition, watermarkWidth,
                                                    ignoreDocumentAbsence,
                                                    useHtmlBasedEngine, supportPageRotation,
                                                    instanceIdToken);
            if (!isSuccessful)
            {
                return new EmptyResult();
            }
            if (bytes == null)
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
            return File(bytes, "application/octet-stream", fileDisplayName);
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

            byte[] bytes;
            string fileDisplayName;
            bool isSuccessful = _coreHandler.GetFile(path, true, true,
                                    out bytes, out fileDisplayName,
                                    displayName,
                                    watermarkText, watermarkColor,
                                    watermarkPosition, watermarkWidth,
                                    false,
                                    useHtmlBasedEngine, supportPageRotation,
                                    instanceIdToken);

            if (!isSuccessful)
                return new EmptyResult();
            //string filename = Path.GetFileName(pdfPath);
            string contentDispositionString = new ContentDisposition { FileName = fileDisplayName, Inline = true }.ToString();
            Response.AddHeader("Content-Disposition", contentDispositionString);
            //Response.AppendHeader("Content-Disposition", "inline; filename=" + bytesAndFileName.Item2);
            return File(bytes, "application/pdf");
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
                return new HttpStatusCodeResult(400);
            }

            string[] pageArray = _coreHandler.GetPrintableHtml(this,
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
            _coreHandler.ReorderPage(path, oldPosition, newPosition, null, instanceIdToken);
            var data = new { success = true };
            return CreateJsonOrJsonpResponse(data, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult RotatePage(string path, int pageNumber, int rotationAmount, string callback = null, string instanceIdToken = null)
        {
            int resultAngle = _coreHandler.RotatePage(path, pageNumber, rotationAmount, null, instanceIdToken);
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
                pageUrls = _coreHandler.GetPageImageUrlsOnThirdPartyStorage(path, pageCount, quality, pageWidth, null, true);
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

        #endregion
    }
}