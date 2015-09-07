using Groupdocs.Web.UI;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace Groupdocs.Viewer.UI.Handlers
{
    public class GetPrintableHtmlHandler : BaseAspNetHandler, IHttpHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>
        private readonly IUrlsCreator _urlsCreator;

        public GetPrintableHtmlHandler()
        {
            _urlsCreator = new UrlsCreator();
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
                if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                    return;

                JavaScriptSerializer serializer = new JavaScriptSerializer();

                string path = null;
                string displayName = null;
                string watermarkText = null;
                int? watermarkColor = null;
                WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal;
                float? watermarkWidth = 0;
                bool ignoreDocumentAbsence = false;
                string instanceId = null;
                string locale = null;

                string json;
                bool isJsonP = (context.Request.HttpMethod == "GET");

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                    json = new StreamReader(context.Request.InputStream).ReadToEnd();
                Dictionary<string, string> inputParameters = serializer.Deserialize<Dictionary<string, string>>(json);
                path = inputParameters["path"];
                GetParameter<string>(inputParameters, "displayName", ref displayName);
                GetParameter<string>(inputParameters, "watermarkText", ref watermarkText);
                GetParameter<int?>(inputParameters, "watermarkColor", ref watermarkColor);
                GetParameter<WatermarkPosition?>(inputParameters, "watermarkPosition", ref watermarkPosition);
                GetParameter<float?>(inputParameters, "watermarkWidth", ref watermarkWidth);
                GetParameter<bool>(inputParameters, "ignoreDocumentAbsence", ref ignoreDocumentAbsence);
                GetParameter<string>(inputParameters, Constants.InstanceIdRequestKey, ref instanceId);
                GetParameter<string>(inputParameters, "locale", ref locale);

                string[] pageArray = GetPrintableHtml(_urlsCreator,
                                                              path, false,
                                                              displayName,
                                                              watermarkText, watermarkColor,
                                                              watermarkPosition,
                                                              watermarkWidth ?? 0,
                                                              ignoreDocumentAbsence,
                                                              instanceId,
                                                              locale);

                context.Response.ContentType = "application/json";
                context.Response.ContentEncoding = Encoding.UTF8;
                string serializedData = serializer.Serialize(pageArray);
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
