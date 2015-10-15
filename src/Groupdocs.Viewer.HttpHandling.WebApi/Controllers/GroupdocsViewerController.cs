using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mime;
using System.Text;
using System.Web.Http;
using System.Web.Http.Routing;
using System.Web.Script.Serialization;
using Groupdocs.Viewer.HttpHandling.WebApi.ViewModels;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.Core;

namespace Groupdocs.Viewer.HttpHandling.WebApi.Controllers
{
    public class GroupdocsViewerApiController : ApiController, IUrlsCreator
    {
        private readonly IApplicationPathFinder _applicationPathFinder;
        private readonly IPrintableHtmlCreator _printableHtmlCreator;
        private readonly IHelper _helper;
        private readonly IRootPathFinder _rootPathFinder;
        private readonly ICoreHandler _coreHandler;

        public GroupdocsViewerApiController()
        {
            _rootPathFinder = new RootPathFinder();
            _applicationPathFinder = new ApplicationPathFinder();
            _printableHtmlCreator = new PrintableHtmlCreator();
            _helper = new Helper();
            _coreHandler = new CoreHandler();
        }

        public GroupdocsViewerApiController(IRootPathFinder rootPathFinder,
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
        
        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public HttpResponseMessage LoadFileBrowserTreeData(LoadFileBrowserTreeDataViewModel viewModel )
        {
            object data = _coreHandler.LoadFileBrowserTreeData(viewModel.path, viewModel.pageIndex, viewModel.pageSize, viewModel.orderBy, viewModel.orderAsc, viewModel.filter,
                                                              viewModel.fileTypes, viewModel.extended, viewModel.instanceIdToken);
            if (data == null)
                return new HttpResponseMessage(HttpStatusCode.NoContent);

            return CreateJsonOrJsonpResponse(data, viewModel.callback);
        }
        

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        [Route("document-viewer/ViewDocument")]
        public HttpResponseMessage ViewDocument(ViewDocumentViewModel viewModel)
        {
            object data = _coreHandler.ViewDocument(this, _printableHtmlCreator,
                viewModel.path, viewModel.useHtmlBasedEngine, viewModel.usePngImagesForHtmlBasedEngine,
                viewModel.count, viewModel.width,
                viewModel.quality, viewModel.usePdf,
                viewModel.preloadPagesCount, viewModel.convertWordDocumentsCompletely,
                viewModel.fileDisplayName,
                viewModel.watermarkText, viewModel.watermarkColor,
                viewModel.watermarkPosition, viewModel.watermarkWidth,
                viewModel.ignoreDocumentAbsence,
                viewModel.supportPageRotation,
                viewModel.supportListOfContentControls,
                viewModel.supportListOfBookmarks,
                viewModel.embedImagesIntoHtmlForWordFiles,
                viewModel.instanceIdToken,
                viewModel.locale);
            return CreateJsonOrJsonpResponse(data, viewModel.callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public HttpResponseMessage GetImageUrls(GetImageUrlsViewModel viewModel)
        {
            object data = _coreHandler.GetImageUrls(this,
                                                   viewModel.path, viewModel.width, viewModel.firstPage, viewModel.pageCount,
                                                   viewModel.quality, viewModel.usePdf,
                                                   viewModel.watermarkText, viewModel.watermarkColor,
                                                   viewModel.watermarkPosition, viewModel.watermarkWidth,
                                                   viewModel.ignoreDocumentAbsence,
                                                   viewModel.useHtmlBasedEngine,
                                                   viewModel.supportPageRotation,
                                                   viewModel.instanceIdToken, viewModel.locale);

            return CreateJsonOrJsonpResponse(data, viewModel.callback);
        }

        [HttpGet]
        public HttpResponseMessage GetDocumentPageImage([FromUri]GetDocumentPageImageViewModel viewModel)
        {
            byte[] imageBytes = _coreHandler.GetDocumentPageImage(viewModel.path, viewModel.pageIndex, viewModel.width, viewModel.quality, viewModel.usePdf,
                                                               viewModel.watermarkText, viewModel.watermarkColor,
                                                               viewModel.watermarkPosition,
                                                               viewModel.watermarkWidth,
                                                               viewModel.ignoreDocumentAbsence,
                                                               viewModel.useHtmlBasedEngine,
                                                               viewModel.rotate,
                                                               viewModel.instanceIdToken,
                                                               viewModel.locale);
            HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new ByteArrayContent(imageBytes);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
            return response;
        }


        public HttpResponseMessage GetDocumentPageHtml(string path, int pageIndex, bool usePngImages,
                                                bool embedImagesIntoHtmlForWordFiles, string instanceIdToken = null, string locale = null)
        {
            string pageHtml, pageCss;
            _coreHandler.GetDocumentPageHtml(this, path, pageIndex, usePngImages, embedImagesIntoHtmlForWordFiles, out pageHtml, out pageCss, instanceIdToken, locale);
            var data = new { pageHtml, pageCss };
            return CreateJsonOrJsonpResponse(data, null);
        }

        public HttpResponseMessage GetResourceForHtml(string documentPath, string resourcePath, bool relativeToOriginal = false, string instanceIdToken = null)
        {
            DateTime? clientModifiedSince = GetClientModifiedSince();
            bool isModified;
            DateTime? fileModificationDateTime;
            byte[] resourceBytes = _coreHandler.GetResourceForHtml(documentPath, resourcePath, clientModifiedSince, out isModified, out fileModificationDateTime, relativeToOriginal, instanceIdToken);
            if (!isModified)
                return new HttpResponseMessage(HttpStatusCode.NotModified); ;


            if (resourceBytes == null)
                return new HttpResponseMessage(HttpStatusCode.Gone);
            else
            {
                HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK);
                response.Content = new ByteArrayContent(resourceBytes);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue(_helper.GetImageMimeTypeFromFilename(resourcePath));
                SetLastModified(response, fileModificationDateTime);
                return response;
            }
        }


        public HttpResponseMessage GetFile(string path, bool getPdf = false, string displayName = null,
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
                return new HttpResponseMessage(HttpStatusCode.NoContent);

            HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK);
            if (bytes == null)
            {
                response.Content = new StringContent("File not found", Encoding.UTF8);
                return response;
            }

            response.Content = new ByteArrayContent(bytes);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            string contentDispositionString = new ContentDisposition { FileName = fileDisplayName, Inline = true }.ToString();
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue(contentDispositionString);
            return response;
        }

        public HttpResponseMessage GetPdfWithPrintDialog(string path, string displayName = null,
                                      string watermarkText = null, int? watermarkColor = null,
                                      WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                      float watermarkWidth = 0,
                                      bool useHtmlBasedEngine = false,
                                      bool supportPageRotation = false,
                                      string instanceIdToken = null)
        {
            if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                return new HttpResponseMessage(HttpStatusCode.NoContent);

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
                return new HttpResponseMessage(HttpStatusCode.NoContent);

            HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK);
            if (bytes == null)
            {
                response.Content = new StringContent("File not found", Encoding.UTF8);
                return response;
            }

            response.Content = new ByteArrayContent(bytes);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            string contentDispositionString = new ContentDisposition { FileName = fileDisplayName, Inline = true }.ToString();
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue(contentDispositionString);
            return response;
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public HttpResponseMessage GetPrintableHtml(string path, bool useHtmlBasedEngine = false,
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
                return new HttpResponseMessage(HttpStatusCode.NoContent);

            if (path == null)
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest);
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
        public HttpResponseMessage ReorderPage(string path, int oldPosition, int newPosition, string callback = null, string instanceIdToken = null)
        {
            _coreHandler.ReorderPage(path, oldPosition, newPosition, instanceIdToken);
            var data = new { success = true };
            return CreateJsonOrJsonpResponse(data, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public HttpResponseMessage RotatePage(string path, int pageNumber, int rotationAmount, string callback = null, string instanceIdToken = null)
        {
            int resultAngle = _coreHandler.RotatePage(path, pageNumber, rotationAmount, instanceIdToken);
            var data = new { resultAngle, success = true };
            return CreateJsonOrJsonpResponse(data, callback);
        }

        #region IUrlsCreator implementation

        [NonAction]
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
            UrlHelper url = Url;
            string applicationHost = _applicationPathFinder.GetApplicationHost();
            if (applicationHost.EndsWith("/"))
            {
                applicationHost = applicationHost.Substring(0, applicationHost.Length - 1);
            }

            pageUrls = new string[pageCount];
            if (_helper.GetStorageProvider() == SupportedStorageProvider.Local)
            {
                Dictionary<string, object> routeValueDictionary = new Dictionary<string, object>(){
                                                                    {"action", "GetDocumentPageImage"},
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
                                                url.Route("genericRoute", routeValueDictionary));
                }
            }
            else
            {
                pageUrls = _coreHandler.GetPageImageUrlsOnThirdPartyStorage(path, pageCount, quality, pageWidth, null, true);
            }

            return pageUrls;
        }

        [NonAction]
        public string GetFileUrl(string path, bool getPdf, bool isPrintable, string fileDisplayName = null,
                                 string watermarkText = null, int? watermarkColor = null,
                                 WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                 bool ignoreDocumentAbsence = false,
                                 bool useHtmlBasedEngine = false,
                                 bool supportPageRotation = false,
                                 string instanceId = null)
        {
            //string displayNameEncoded = HttpUtility.UrlEncode(fileDisplayName);
            string instanceIdToken = instanceId;
            string fileUrl = ConvertUrlToAbsolute(Url.Route("genericRoute",
                                                  new
                                                  {
                                                      action = isPrintable ? "GetPdfWithPrintDialog" : "GetFile",
                                                      path,
                                                      displayName = fileDisplayName,
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

        [NonAction]
        public string GetResourceForHtmlUrl(string documentPath, string resourcePath,
                                            bool relativeToOriginal = false, string instanceId = null)
        {
            string instanceIdToken = instanceId;
            string urlForResourcesInHtml = ConvertUrlToAbsolute(Url.Route("genericRoute", new { action = "GetResourceForHtml", documentPath, relativeToOriginal, resourcePath, instanceIdToken }));
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

        private HttpResponseMessage CreateJsonOrJsonpResponse(object data, string callback, bool serialize = true)
        {
            bool isJsonP = Request != null && Request.Method == HttpMethod.Get;

            string serializedData;
            if (isJsonP)
            {
                if (serialize)
                    serializedData = new JavaScriptSerializer().Serialize(data);
                else
                    serializedData = (string)data;
                string serializedDataWithCallback = String.Format("{0}({1})", callback, serializedData);

                HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK);
                response.Content = new StringContent(serializedDataWithCallback, Encoding.UTF8, "application/javascript");
                return response;
            }
            else
            {
                if (serialize)
                {
                    HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK, data);
                    return response;
                }
                else
                {
                    serializedData = (string)data;
                    HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.OK);
                    response.Content = new StringContent(serializedData, Encoding.UTF8, "application/json");
                    return response;
                }
            }
        }

        private DateTime? GetClientModifiedSince()
        {
            var headerValue = Request.Headers.IfModifiedSince;
            DateTime? clientModifiedSince = headerValue.HasValue ? headerValue.Value.DateTime : (DateTime?)null;
            return clientModifiedSince;
        }
        

        private void SetLastModified(HttpResponseMessage response, DateTime? fileModificationDateTime)
        {
            if (fileModificationDateTime.HasValue)
            {
                DateTime now = DateTime.Now;
                if (fileModificationDateTime > now)
                    fileModificationDateTime = now;
                response.Content.Headers.LastModified = fileModificationDateTime;
            }
        }

        #endregion
    }
}