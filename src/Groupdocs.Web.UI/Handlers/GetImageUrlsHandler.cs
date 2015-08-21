using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

namespace Groupdocs.Web.UI.Handlers
{
    public class GetImageUrlsHandler : CoreHandler, IHttpHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>

        private readonly IUrlsCreator _urlsCreator;

        public GetImageUrlsHandler()
            : this(new UrlsCreator())
        {
        }

        protected GetImageUrlsHandler(IUrlsCreator urlsCreator)
        {
            _urlsCreator = urlsCreator;
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
                JavaScriptSerializer serializer = new JavaScriptSerializer();
                string path = null;
                string dimension = null;
                string token = null;
                int firstPage = 0;
                int pageCount = 0;
                int? quality = null;
                bool usePdf = true;
                string watermarkText = null;
                int? watermarkColor = null;
                WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal;
                float? watermarkWidth = 0;
                bool ignoreDocumentAbsence = false;
                bool useHtmlBasedEngine = false;
                bool supportPageRotation = false;
                string instanceId = null;
                string locale = null;

                string json;
                bool isJsonP = context.Request.HttpMethod == "GET";

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                    json = new StreamReader(context.Request.InputStream).ReadToEnd();
                Dictionary<string, string> inputParameters = serializer.Deserialize<Dictionary<string, string>>(json);
                GetParameter(inputParameters, "path", ref path);
                GetParameter(inputParameters, "dimension", ref dimension);
                GetParameter(inputParameters, "token", ref token);
                GetParameter(inputParameters, "firstPage", ref firstPage);
                GetParameter(inputParameters, "pageCount", ref pageCount);
                GetParameter(inputParameters, "quality", ref quality);
                GetParameter(inputParameters, "usePdf", ref usePdf);
                GetParameter(inputParameters, "useHtmlBasedEngine", ref useHtmlBasedEngine);
                GetParameter(inputParameters, "supportPageRotation", ref supportPageRotation);

                GetParameter(inputParameters, "watermarkText", ref watermarkText);
                GetParameter(inputParameters, "watermarkColor", ref watermarkColor);
                GetParameter(inputParameters, "watermarkPosition", ref watermarkPosition);
                GetParameter(inputParameters, "watermarkWidth", ref watermarkWidth);

                GetParameter(inputParameters, "ignoreDocumentAbsence", ref ignoreDocumentAbsence);
                GetParameter(inputParameters, Constants.InstanceIdRequestKey, ref instanceId);
                GetParameter(inputParameters, "locale", ref locale);

                object data = GetImageUrls(_urlsCreator,
                                                       path, dimension, firstPage, pageCount,
                                                       quality, usePdf,
                                                       watermarkText, watermarkColor,
                                                       watermarkPosition ?? WatermarkPosition.Diagonal, watermarkWidth ?? 0,
                                                       ignoreDocumentAbsence,
                                                       useHtmlBasedEngine,
                                                       supportPageRotation,
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
