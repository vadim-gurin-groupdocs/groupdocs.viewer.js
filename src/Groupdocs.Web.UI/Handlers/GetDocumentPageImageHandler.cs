using System;
using System.Globalization;
using System.Web;

namespace Groupdocs.Web.UI.Handlers
{
    public class GetDocumentPageImageHandler : CoreHandler, IHttpHandler
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
                int pageIndex;
                int? width = null;
                int? quality = null;
                bool usePdf;
                string watermarkText = null;
                int? watermarkColor = null;
                WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal;
                float watermarkWidth = 0;
                bool ignoreDocumentAbsence = false;
                bool useHtmlBasedEngine = false;
                bool rotate = false;

                _context = context;
                path = (string)context.Request.Params["path"];
                pageIndex = Int32.Parse(context.Request.Params["pageIndex"]);

                string stringValue;
                stringValue = _context.Request.Params["width"];
                if (!String.IsNullOrEmpty(stringValue))
                    width = Int32.Parse(stringValue);
                quality = ExtractIntParameter(context, "quality");
                usePdf = Boolean.Parse(context.Request.Params["usePdf"]);
                watermarkText = context.Request.Params["watermarkText"];
                watermarkColor = ExtractIntParameter(context, "watermarkColor");

                stringValue = _context.Request.Params["watermarkPosition"];
                if (!String.IsNullOrEmpty(stringValue))
                    watermarkPosition = (WatermarkPosition?)Enum.Parse(watermarkPosition.GetType(), stringValue) ?? WatermarkPosition.Diagonal;

                stringValue = _context.Request.Params["watermarkWidth"];
                if (!String.IsNullOrEmpty(stringValue))
                    watermarkWidth = float.Parse(stringValue, NumberStyles.Float, CultureInfo.InvariantCulture);

                stringValue = _context.Request.Params["ignoreDocumentAbsence"];
                if (!String.IsNullOrEmpty(stringValue))
                    ignoreDocumentAbsence = Boolean.Parse(stringValue);

                useHtmlBasedEngine = Boolean.Parse(context.Request.Params["useHtmlBasedEngine"]);
                rotate = Boolean.Parse(context.Request.Params["rotate"]);
                string instanceId = context.Request.Params[Constants.InstanceIdRequestKey];

                var locale = !string.IsNullOrEmpty(_context.Request.Params["locale"]) ? _context.Request.Params["locale"] : null;

                byte[] imageBytes = GetDocumentPageImage(path, pageIndex, width, quality, usePdf,
                                                               watermarkText, watermarkColor,
                                                               watermarkPosition,
                                                               watermarkWidth,
                                                               ignoreDocumentAbsence,
                                                               useHtmlBasedEngine,
                                                               rotate,
                                                               instanceId,
                                                               locale);
                context.Response.ContentType = "image/jpeg";
                context.Response.BinaryWrite(imageBytes);

                //TODO: add support of a "Last-Modified" header along with HTTP 304 Not Modified response
                /*
                //obtaining and adding the last modification datetime of a file
                IFileStorage storage = base._viewingService.GetStorage();
                DateTime lastModificationDateTime = storage.GetFileDateTime(path);
                context.Response.Cache.SetLastModified(lastModificationDateTime);
                */
            }
            catch (Exception exception)
            {
                OnException(exception, context);
            }
        }
        #endregion

    }
}