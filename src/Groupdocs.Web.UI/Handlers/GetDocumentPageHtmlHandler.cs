using Groupdocs.Common.InstallableViewer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

namespace Groupdocs.Web.UI.Handlers
{
    public class GetDocumentPageHtmlHandler : CoreHandler, IHttpHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>

        private readonly IUrlsCreator _urlsCreator;

        public GetDocumentPageHtmlHandler() : this(string.Empty) { }

        public GetDocumentPageHtmlHandler(string productName)
            : base(productName)
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
                var serializer = new JavaScriptSerializer { MaxJsonLength = CommonConstants.MaxJsonLength };

                string path;
                int pageIndex;
                bool usePngImages;
                bool embedImagesIntoHtmlForWordFiles;
                string instanceId = null;
                string locale = null;

                string json;
                bool isJsonP = (context.Request.HttpMethod == "GET");

                if (isJsonP)
                    json = context.Request.Params["data"];
                else
                    json = new StreamReader(context.Request.InputStream).ReadToEnd();
                Dictionary<string, string> inputParameters = serializer.Deserialize<Dictionary<string, string>>(json);
                GetMandatoryParameter(inputParameters, "path", out path);
                GetMandatoryParameter(inputParameters, "pageIndex", out pageIndex);
                GetMandatoryParameter(inputParameters, "usePngImages", out usePngImages);
                GetMandatoryParameter(inputParameters, "embedImagesIntoHtmlForWordFiles", out embedImagesIntoHtmlForWordFiles);
                GetParameter(inputParameters, Constants.InstanceIdRequestKey, ref instanceId);
                GetParameter(inputParameters, "locale", ref locale);

                string pageHtml, pageCss;
                GetDocumentPageHtml(_urlsCreator, path, pageIndex, usePngImages, embedImagesIntoHtmlForWordFiles, out pageHtml, out pageCss, instanceId, locale);
                var data = new { pageHtml, pageCss };
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
