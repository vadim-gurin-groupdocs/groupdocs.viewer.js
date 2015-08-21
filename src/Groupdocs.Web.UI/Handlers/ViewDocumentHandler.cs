using Groupdocs.Common.InstallableViewer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

namespace Groupdocs.Web.UI.Handlers
{
    public class ViewDocumentHandler : CoreHandler, IHttpHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>

        private readonly IUrlsCreator _urlsCreator;
        private readonly IPrintableHtmlCreator _printableHtmlCreator;

        public ViewDocumentHandler()
            : this(new UrlsCreator())
        {
        }

        protected ViewDocumentHandler(IUrlsCreator urlsCreator)
        {
            _urlsCreator = urlsCreator;
            _printableHtmlCreator = new PrintableHtmlCreator();
        }

        #region IHttpHandler Members

        public bool IsReusable
        {
            // Return false in case your Managed Handler cannot be reused for another request.
            // Usually this would be false in case you have some state information preserved per request.
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            try
            {
                JavaScriptSerializer serializer = new JavaScriptSerializer()
                {
                    MaxJsonLength = CommonConstants.MaxJsonLength
                };

                string path = null;
                bool useHtmlBasedEngine = false;
                bool usePngImagesForHtmlBasedEngine = false;
                int? count = null;
                int? width = null;
                int? quality = null;
                bool usePdf = true;
                int? preloadPagesCount = null;
                bool convertWordDocumentsCompletely = false;
                string fileDisplayName = null;
                string watermarkText = null;
                int? watermarkColor = null;
                WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal;
                float? watermarkWidth = 0;
                bool ignoreDocumentAbsence = false;
                bool supportPageRotation = false;
                bool supportListOfContentControls = false;
                bool supportListOfBookmarks = false;
                bool embedImagesIntoHtmlForWordFiles = false;
                string instanceId = null;
                string locale = null;

                string json;
                bool isJsonP = context.Request.HttpMethod == "GET";

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                {
                    using (StreamReader streamReader = new StreamReader(context.Request.InputStream))
                    {
                        json = streamReader.ReadToEnd();
                    }
                }
                Dictionary<string, string> inputParameters = serializer.Deserialize<Dictionary<string, string>>(json);
                GetParameter(inputParameters, "path", ref path);
                GetParameter(inputParameters, "useHtmlBasedEngine", ref useHtmlBasedEngine);
                GetParameter(inputParameters, "usePngImagesForHtmlBasedEngine", ref usePngImagesForHtmlBasedEngine);
                GetParameter(inputParameters, "convertWordDocumentsCompletely", ref convertWordDocumentsCompletely);
                GetParameter(inputParameters, "count", ref count);
                GetParameter(inputParameters, "preloadPagesCount", ref preloadPagesCount);
                GetParameter(inputParameters, "width", ref width);
                GetParameter(inputParameters, "locale", ref locale);
                GetParameter(inputParameters, "quality", ref quality);
                GetParameter(inputParameters, "usePdf", ref usePdf);

                GetParameter(inputParameters, "fileDisplayName", ref fileDisplayName);
                GetParameter(inputParameters, "ignoreDocumentAbsence", ref ignoreDocumentAbsence);
                GetParameter(inputParameters, "supportPageRotation", ref supportPageRotation);
                GetParameter(inputParameters, "supportListOfContentControls", ref supportListOfContentControls);
                GetParameter(inputParameters, "supportListOfBookmarks", ref supportListOfBookmarks);
                GetParameter(inputParameters, "embedImagesIntoHtmlForWordFiles", ref embedImagesIntoHtmlForWordFiles);

                GetParameter(inputParameters, "watermarkText", ref watermarkText);
                GetParameter(inputParameters, "watermarkColor", ref watermarkColor);
                GetParameter(inputParameters, "watermarkPosition", ref watermarkPosition);
                GetParameter(inputParameters, "watermarkWidth", ref watermarkWidth);
                GetParameter(inputParameters, Constants.InstanceIdRequestKey, ref instanceId);

                object data = ViewDocument(_urlsCreator, _printableHtmlCreator,
                                           path, useHtmlBasedEngine, usePngImagesForHtmlBasedEngine,
                                           count, width,
                                           quality, usePdf,
                                           preloadPagesCount, convertWordDocumentsCompletely,
                                           fileDisplayName,
                                           watermarkText, watermarkColor,
                                           watermarkPosition ?? WatermarkPosition.Diagonal, watermarkWidth ?? 0,
                                           ignoreDocumentAbsence,
                                           supportPageRotation,
                                           supportListOfContentControls,
                                           supportListOfBookmarks,
                                           embedImagesIntoHtmlForWordFiles,
                                           null,
                                           instanceId,
                                           locale);

                string serializedData = serializer.Serialize(data);
                CreateJsonOrJsonpResponse(context, serializedData);
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }
        #endregion
    }
}