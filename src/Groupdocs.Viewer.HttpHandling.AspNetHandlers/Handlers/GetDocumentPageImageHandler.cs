using System;
using System.Collections.Specialized;
using System.Globalization;
using System.Web;
using Groupdocs.Web.UI.ViewModels;
using Groupdocs.Web.UI;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class GetDocumentPageImageHandler : BaseAspNetHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>
        private HttpContext _context;

        public GetDocumentPageImageHandler() : this(string.Empty) { }

        public GetDocumentPageImageHandler(string productName)
            : base(productName)
        {
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
                GetDocumentPageImageParameters parameters = new GetDocumentPageImageParameters();
                NameValueCollection requestParameters = context.Request.Params;
                parameters.Path = GetParameter<string>(requestParameters, "path");
                parameters.PageIndex = GetParameter<int>(requestParameters, "pageIndex");
                parameters.Width = GetParameter<int?>(requestParameters, "width");
                parameters.Quality = GetParameter<int?>(requestParameters, "quality");
                parameters.UsePdf = GetParameter<bool>(requestParameters, "usePdf");
                parameters.WatermarkText = GetParameter<string>(requestParameters, "watermarkText");
                parameters.WatermarkColor = GetParameter<int?>(requestParameters, "watermarkColor");
                parameters.WatermarkPosition = GetParameter<WatermarkPosition>(requestParameters, "watermarkPosition");
                parameters.WatermarkWidth = GetParameter<float>(requestParameters, "watermarkWidth");
                parameters.IgnoreDocumentAbsence = GetParameter<bool>(requestParameters, "ignoreDocumentAbsence");
                parameters.UseHtmlBasedEngine = GetParameter<bool>(requestParameters, "useHtmlBasedEngine");
                parameters.Rotate = GetParameter<bool>(requestParameters, "rotate");
                parameters.InstanceIdToken = GetParameter<string>(requestParameters, Constants.InstanceIdRequestKey);
                parameters.Locale = GetParameter<string>(requestParameters, "locale");

                byte[] imageBytes = GetDocumentPageImage(parameters);
                context.Response.ContentType = "image/jpeg";
                context.Response.BinaryWrite(imageBytes);
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }
        #endregion

    }
}