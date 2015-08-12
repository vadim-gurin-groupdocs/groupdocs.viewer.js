using System;
using System.IO;
using System.Text;
using System.Web;
using Groupdocs.Common;
using Groupdocs.Engine.Viewing;
using Groupdocs.Threading;

namespace Groupdocs.Web.UI.Handlers
{
    public class GetFileHandler : BaseHandler, IHttpHandler
    {
        public GetFileHandler()
        {
        }


        /// <summary>
        /// You will need to configure this handler in the web.config file of your 
        /// web and register it with IIS before being able to use it. For more information
        /// see the following link: http://go.microsoft.com/?linkid=8101007
        /// </summary>
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
                string path;
                string displayName = null;
                path = (string) context.Request.Params["path"];
                displayName = context.Request.Params["displayName"];
                bool getPdf = false;
                string getPdfString = context.Request.Params["getPdf"];
                if (getPdfString != null)
                    getPdf = Boolean.Parse(getPdfString);

                string watermarkText = null;
                int? watermarkColor = null;
                WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal;
                float watermarkWidth = 0;

                bool ignoreDocumentAbsence = false;
                bool useHtmlBasedEngine = false;
                bool supportPageRotation = false;
                
                watermarkText = context.Request.Params["watermarkText"];
                watermarkColor = ExtractIntParameter(context, "watermarkColor");

                string stringValue;
                stringValue = context.Request.Params["watermarkPosition"];
                if (!String.IsNullOrEmpty(stringValue))
                    watermarkPosition = (WatermarkPosition?)Enum.Parse(watermarkPosition.GetType(), stringValue) ?? WatermarkPosition.Diagonal;

                stringValue = context.Request.Params["watermarkWidth"];
                if (!String.IsNullOrEmpty(stringValue))
                    watermarkWidth = float.Parse(stringValue);

                stringValue = context.Request.Params["useHtmlBasedEngine"];
                if (!String.IsNullOrEmpty(stringValue))
                    useHtmlBasedEngine = Boolean.Parse(stringValue);

                stringValue = context.Request.Params["ignoreDocumentAbsence"];
                if (!String.IsNullOrEmpty(stringValue))
                    ignoreDocumentAbsence = Boolean.Parse(stringValue);

                stringValue = context.Request.Params["supportPageRotation"];
                if (!String.IsNullOrEmpty(stringValue))
                    supportPageRotation = Boolean.Parse(stringValue);

                context.Response.ContentType = "application/octet-stream";
                string instanceId = context.Request.Params[Constants.InstanceIdRequestKey];

                byte[] bytes;
                string fileDisplayName;
                bool isSuccessful = GetFile(path, getPdf, false,
                                    out bytes, out fileDisplayName,
                                    displayName,
                                    watermarkText, watermarkColor,
                                    watermarkPosition, watermarkWidth,
                                    ignoreDocumentAbsence,
                                    useHtmlBasedEngine, supportPageRotation, instanceId);
                if (!isSuccessful || bytes == null)
                    return;

                context.Response.AddHeader("Content-Disposition",
                                           String.Format("attachment;filename=\"{0}\"", fileDisplayName));

                HttpCookie jqueryFileDownloadCookie = new HttpCookie(Constants.JqueryFileDownloadCookieName);
                jqueryFileDownloadCookie.Path = "/";
                jqueryFileDownloadCookie.Value = "true";
                //aCookie.Expires = DateTime.Now.AddDays(1);
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
