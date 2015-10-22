using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
using Groupdocs.Common.InstallableViewer;
using Groupdocs.Web.UI.ViewModels;
using Groupdocs.Web.UI;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class GetDocumentPageHtmlHandler : BaseAspNetHandler
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

        public override bool IsReusable
        {
            // Return false in case your Managed Handler cannot be reused for another request.
            // Usually this would be false in case you have some state information preserved per request.
            get { return true; }
        }

        public override void ProcessRequest(HttpContext context)
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

                GetDocumentPageHtmlParameters parameters = serializer.Deserialize<GetDocumentPageHtmlParameters>(json);
                string pageHtml, pageCss;
                GetDocumentPageHtml(_urlsCreator, parameters, out pageHtml, out pageCss);
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
