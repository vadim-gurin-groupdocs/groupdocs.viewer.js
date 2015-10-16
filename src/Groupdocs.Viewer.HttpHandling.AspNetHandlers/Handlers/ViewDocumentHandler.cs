using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
using Groupdocs.Common.InstallableViewer;
using Groupdocs.Viewer.HttpHandling.WebApi.ViewModels;
using Groupdocs.Web.UI;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class ViewDocumentHandler : BaseAspNetHandler
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
                JavaScriptSerializer serializer = new JavaScriptSerializer()
                {
                    MaxJsonLength = CommonConstants.MaxJsonLength
                };

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
                ViewDocumentViewModel viewModel = serializer.Deserialize<ViewDocumentViewModel>(json);

                object data = ViewDocument(_urlsCreator, _printableHtmlCreator, viewModel);
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