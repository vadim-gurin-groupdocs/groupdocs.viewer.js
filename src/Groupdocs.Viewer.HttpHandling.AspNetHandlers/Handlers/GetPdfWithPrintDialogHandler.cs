using System;
using System.Web;
using Groupdocs.Web.UI;

namespace Groupdocs.Viewer.HttpHandling.AspNetHandlers.Handlers
{
    public class GetPdfWithPrintDialogHandler : BaseAspNetHandler
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
                if (!_helper.IsRequestHandlingEnabled(Constants.GroupdocsPrintRequestHandlingIsEnabled))
                    return;

                string path = (string) context.Request.Params["path"];

                string watermarkText = null;
                int? watermarkColor = null;
                WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal;
                float watermarkWidth = 0;

                bool useHtmlBasedEngine = false;
                bool supportPageRotation = false;

                watermarkText = context.Request.Params["watermarkText"];
                watermarkColor = ExtractIntParameter(context, "watermarkColor");

                string stringValue = context.Request.Params["watermarkPosition"];
                if (!String.IsNullOrEmpty(stringValue))
                    watermarkPosition = (WatermarkPosition?)Enum.Parse(watermarkPosition.GetType(), stringValue) ?? WatermarkPosition.Diagonal;

                stringValue = context.Request.Params["watermarkWidth"];
                if (!String.IsNullOrEmpty(stringValue))
                    watermarkWidth = float.Parse(stringValue);

                stringValue = context.Request.Params["useHtmlBasedEngine"];
                if (!String.IsNullOrEmpty(stringValue))
                    useHtmlBasedEngine = Boolean.Parse(stringValue);

                stringValue = context.Request.Params["supportPageRotation"];
                if (!String.IsNullOrEmpty(stringValue))
                    supportPageRotation = Boolean.Parse(stringValue);

                string instanceId = context.Request.Params[Constants.InstanceIdRequestKey];

                //string pdfPath = _viewingService.GetPdfWithPrintDialog(path);

                byte[] bytes;
                string fileDisplayName;
                bool isSuccessful = GetFile(path, true, true,
                                    out bytes, out fileDisplayName,
                                    null,
                                    watermarkText, watermarkColor,
                                    watermarkPosition, watermarkWidth,
                                    false,
                                    useHtmlBasedEngine, supportPageRotation, instanceId);
                if (!isSuccessful || bytes == null)
                    return;

                context.Response.ContentType = "application/pdf";
                //context.Response.AddHeader("Content-Disposition", String.Format("attachment;filename={0}", Path.GetFileName(pdfPath)));
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
