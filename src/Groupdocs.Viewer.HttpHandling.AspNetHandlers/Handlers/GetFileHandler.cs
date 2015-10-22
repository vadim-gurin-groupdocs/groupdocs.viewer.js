using System;
using System.Collections.Specialized;
using System.Web;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.ViewModels;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class GetFileHandler : BaseAspNetHandler
    {
        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>
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
                GetFileParameters parameters = new GetFileParameters();
                NameValueCollection requestParameters = context.Request.Params;
                parameters.Path = GetParameter<string>(requestParameters, "path");
                parameters.DisplayName = GetParameter<string>(requestParameters, "displayName");
                parameters.GetPdf = GetParameter<bool>(requestParameters, "getPdf");
                parameters.WatermarkText = GetParameter<string>(requestParameters, "watermarkText");
                parameters.WatermarkColor = GetParameter<int?>(requestParameters, "watermarkColor");
                parameters.WatermarkPosition = GetParameter<WatermarkPosition>(requestParameters, "watermarkPosition");
                parameters.WatermarkWidth = GetParameter<float>(requestParameters, "watermarkWidth");
                parameters.IgnoreDocumentAbsence = GetParameter<bool>(requestParameters, "ignoreDocumentAbsence");
                parameters.UseHtmlBasedEngine = GetParameter<bool>(requestParameters, "useHtmlBasedEngine");
                parameters.SupportPageRotation = GetParameter<bool>(requestParameters, "supportPageRotation");
                parameters.InstanceIdToken = GetParameter<string>(requestParameters, Constants.InstanceIdRequestKey);

                context.Response.ContentType = "application/octet-stream";
                byte[] bytes;
                string fileDisplayName;
                bool isSuccessful = GetFile(parameters, out bytes, out fileDisplayName);
                if (!isSuccessful || bytes == null)
                    return;

                context.Response.AddHeader("Content-Disposition",
                                           String.Format("attachment;filename=\"{0}\"", fileDisplayName));

                HttpCookie jqueryFileDownloadCookie = new HttpCookie(Constants.JqueryFileDownloadCookieName);
                jqueryFileDownloadCookie.Path = "/";
                jqueryFileDownloadCookie.Value = "true";
                context.Response.Cookies.Add(jqueryFileDownloadCookie);
                context.Response.BinaryWrite(bytes);
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }

        #endregion
    }
}
