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
                GetDocumentPageImageViewModel viewModel = new GetDocumentPageImageViewModel();
                NameValueCollection parameters = context.Request.Params;
                viewModel.Path = GetParameter<string>(parameters, "path");
                viewModel.PageIndex = GetParameter<int>(parameters, "pageIndex");
                viewModel.Width = GetParameter<int?>(parameters, "width");
                viewModel.Quality = GetParameter<int?>(parameters, "quality");
                viewModel.UsePdf = GetParameter<bool>(parameters, "usePdf");
                viewModel.WatermarkText = GetParameter<string>(parameters, "watermarkText");
                viewModel.WatermarkColor = GetParameter<int?>(parameters, "watermarkColor");
                viewModel.WatermarkPosition = GetParameter<WatermarkPosition>(parameters, "watermarkPosition");
                viewModel.WatermarkWidth = GetParameter<float>(parameters, "watermarkWidth");
                viewModel.IgnoreDocumentAbsence = GetParameter<bool>(parameters, "ignoreDocumentAbsence");
                viewModel.UseHtmlBasedEngine = GetParameter<bool>(parameters, "useHtmlBasedEngine");
                viewModel.Rotate = GetParameter<bool>(parameters, "rotate");
                viewModel.InstanceIdToken = GetParameter<string>(parameters, Constants.InstanceIdRequestKey);
                viewModel.Locale = GetParameter<string>(parameters, "locale");

                byte[] imageBytes = GetDocumentPageImage(viewModel);
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