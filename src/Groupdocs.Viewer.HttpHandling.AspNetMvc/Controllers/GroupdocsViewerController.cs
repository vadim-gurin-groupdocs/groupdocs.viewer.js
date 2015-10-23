using System;
using System.Net;
using System.Net.Mime;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Script.Serialization;
using Groupdocs.Viewer.HttpHandling.AspNetMvc.ActionFilters;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.Core;
using Groupdocs.Web.UI.DataTransferObjects;
using Groupdocs.Web.UI.DataTransferObjects.Responses.Statuses;

namespace Groupdocs.Viewer.HttpHandling.AspNetMvc.Controllers
{
    [AllowCrossDomain]
    public class GroupdocsViewerController : Controller, IUrlsCreator
    {
        private readonly IApplicationPathFinder _applicationPathFinder;
        private readonly IPrintableHtmlCreator _printableHtmlCreator;
        private readonly IHelper _helper;
        private readonly IRootPathFinder _rootPathFinder;
        private readonly ICoreHandler _coreHandler;

        public GroupdocsViewerController(IRootPathFinder rootPathFinder,
                                        IApplicationPathFinder applicationPathFinder,
                                        IPrintableHtmlCreator printableHtmlCreator,
                                        IHelper helper,
                                        ICoreHandler coreHandler)
        {
            _rootPathFinder = rootPathFinder;
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
        public ActionResult LoadFileBrowserTreeData(LoadFileBrowserTreeDataParameters parameters)
        {
            object data = _coreHandler.LoadFileBrowserTreeData(parameters);
            if (data == null)
                return new EmptyResult();

            return CreateJsonOrJsonpResponse(data, parameters.Callback);
        }


        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ViewDocument(ViewDocumentParameters parameters)
        {
            OperationStatusResponse data = _coreHandler.ViewDocument(this, parameters);
            return CreateJsonOrJsonpResponse(data, parameters.Callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetImageUrls(GetImageUrlsParameters parameters)
        {
            OperationStatusResponse data = _coreHandler.GetImageUrls(this, parameters);
            return CreateJsonOrJsonpResponse(data, parameters.Callback);
        }


        public ActionResult GetDocumentPageImage(GetDocumentPageImageParameters parameters)
        {
            byte[] imageBytes = _coreHandler.GetDocumentPageImage(parameters);
            return File(imageBytes, "image/jpeg");
        }


        public ActionResult GetDocumentPageHtml(GetDocumentPageHtmlParameters parameters)
        {
            string pageHtml, pageCss;
            _coreHandler.GetDocumentPageHtml(this, parameters, out pageHtml, out pageCss);
            var data = new { pageHtml, pageCss };
            return CreateJsonOrJsonpResponse(data, null);
        }

        public ActionResult GetResourceForHtml(GetResourceForHtmlParameters parameters)
        {
            DateTime? clientModifiedSince = GetClientModifiedSince();
            bool isModified;
            DateTime? fileModificationDateTime;
            byte[] resourceBytes = _coreHandler.GetResourceForHtml(parameters, clientModifiedSince, out isModified, out fileModificationDateTime);
            if (!isModified)
                return new HttpStatusCodeResult(304, "Not Modified");

            SetLastModified(fileModificationDateTime);

            if (resourceBytes == null)
                return new HttpStatusCodeResult((int)HttpStatusCode.Gone);
            else
                return File(resourceBytes, _helper.GetImageMimeTypeFromFilename(parameters.ResourcePath));
        }

        public ActionResult GetFile(GetFileParameters parameters)
        {
            byte[] bytes;
            string fileDisplayName;
            bool isSuccessful = _coreHandler.GetFile(parameters,
                                                    out bytes, out fileDisplayName);
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

        public ActionResult GetPdfWithPrintDialog(GetFileParameters parameters)
        {
            if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                return new EmptyResult();

            byte[] bytes;
            string fileDisplayName;
            bool isSuccessful = _coreHandler.GetFile(parameters,
                                    out bytes, out fileDisplayName);
            if (!isSuccessful)
                return new EmptyResult();
            string contentDispositionString = new ContentDisposition { FileName = fileDisplayName, Inline = true }.ToString();
            Response.AddHeader("Content-Disposition", contentDispositionString);
            return File(bytes, "application/pdf");
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetPrintableHtml(GetPrintableHtmlParameters parameters)
        {
            if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                return new EmptyResult();

            if (parameters.Path == null)
            {
                return new HttpStatusCodeResult(400);
            }

            string[] pageArray = _coreHandler.GetPrintableHtml(this, parameters);
            return CreateJsonOrJsonpResponse(pageArray, parameters.Callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ReorderPage(ReorderPageParameters parameters)
        {
            _coreHandler.ReorderPage(parameters);
            var data = new { success = true };
            return CreateJsonOrJsonpResponse(data, parameters.Callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult RotatePage(RotatePageParameters parameters)
        {
            int resultAngle = _coreHandler.RotatePage(parameters);
            var data = new { resultAngle, success = true };
            return CreateJsonOrJsonpResponse(data, parameters.Callback);
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
                                 WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal, float? watermarkWidth = 0,
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