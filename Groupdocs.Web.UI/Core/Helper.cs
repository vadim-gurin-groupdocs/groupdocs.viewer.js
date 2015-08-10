using Groupdocs.Storage;
using Groupdocs.Threading;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Web;

namespace Groupdocs.Web.UI
{
    public interface IHelper
    {
        string GetImageMimeTypeFromFilename(string filename);
        string GetFontMimeType(string filename);
        bool IsRequestHandlingEnabled(string requestKey);
        DateTime? GetDateTimeFromClientHeader(string stringClientModifiedSince);
        SupportedStorageProvider GetStorageProvider();
        IStorageProvider GetCustomStorageProvider();
        IStorageProvider GetCustomTempStorageProvider();
        bool AreExceptionDetailsShownOnClient();
        string GetBase64ForVerticalText(string text);
    }

    public class Helper : IHelper
    {
        private readonly Logger _logger;
        private IRootPathFinder _rootPathFinder;

        public Helper()
        {
            _rootPathFinder = new RootPathFinder();
            _logger = new Logger(_rootPathFinder.GetLogFilePath());
        }

        public string GetImageMimeTypeFromFilename(string filename)
        {
            string fileExtension = Path.GetExtension(filename);
            if (!String.IsNullOrWhiteSpace(fileExtension) && fileExtension.StartsWith("."))
                fileExtension = fileExtension.Remove(0, 1);
            string mimeType;
            switch (fileExtension)
            {
                case "svg":
                    mimeType = "image/svg+xml";
                    break;
                case "css":
                    mimeType = "text/css";
                    break;
                case "woff":
                    mimeType = "application/font-woff";
                    break;
                case "htm":
                    mimeType = "text/html";
                    break;
                default:
                    mimeType = String.Format("image/{0}", fileExtension);
                    break;
            }
            return mimeType;
        }

        public string GetFontMimeType(string filename)
        {
            var ext = Path.GetExtension(filename);
            return (String.Compare(ext, ".woff", true) == 0 ?
                String.Format("application/font-{0}", ext.TrimStart('.')) : "application/octet-stream");
        }

        public bool IsRequestHandlingEnabled(string requestKey)
        {
            HttpContext currentContext = HttpContext.Current;
            if (currentContext == null)
                return true;
            else
            {
                HttpApplicationState application = currentContext.Application;
                object oRequestHandlingEnabled = application[requestKey];
                bool requestHandlingEnabled = (bool)(oRequestHandlingEnabled ?? true);
                return requestHandlingEnabled;
            }
        }


        public DateTime? GetDateTimeFromClientHeader(string stringClientModifiedSince)
        {
            if (String.IsNullOrEmpty(stringClientModifiedSince))
            {
                return null;
            }
            else
            {
                CultureInfo provider = CultureInfo.InvariantCulture;
                DateTime clientModifiedSince =
                    DateTime.ParseExact(stringClientModifiedSince, "r", provider).ToLocalTime();
                return clientModifiedSince;
            }
        }
     

        public SupportedStorageProvider GetStorageProvider()
        {
            SupportedStorageProvider storageProvider = SupportedStorageProvider.Local;
            HttpContext context = System.Web.HttpContext.Current;
            if (context != null)
            {
                object objectStorageProvider = context.Application[Constants.StorageProvider];
                if (objectStorageProvider != null)
                    storageProvider = (SupportedStorageProvider)objectStorageProvider;
            }
            return storageProvider;
        }

        public IStorageProvider GetCustomStorageProvider()
        {
            IStorageProvider customStorageProvider = null;
            HttpContext context = System.Web.HttpContext.Current;
            if (context != null)
            {
                object objectStorageProvider = context.Application[Constants.CustomStorageProvider];
                if (objectStorageProvider != null)
                    customStorageProvider = (IStorageProvider)objectStorageProvider;
            }
            return customStorageProvider;
        }

        public IStorageProvider GetCustomTempStorageProvider()
        {
            IStorageProvider customStorageProvider = null;
            HttpContext context = System.Web.HttpContext.Current;
            if (context != null)
            {
                object objectStorageProvider = context.Application[Constants.CustomTempStorageProvider];
                if (objectStorageProvider != null)
                    customStorageProvider = (IStorageProvider)objectStorageProvider;
            }
            return customStorageProvider;
        }

        public bool AreExceptionDetailsShownOnClient()
        {
            bool areDetailsShown = true;
            HttpContext context = System.Web.HttpContext.Current;
            if (context != null)
            {
                object objectValue = context.Application[Constants.GroupdocsShowExceptionDetailsOnClient];
                if (objectValue != null)
                    areDetailsShown = (bool)objectValue;
            }
            return areDetailsShown;
        }

        public string GetBase64ForVerticalText(string text)
        {
            string base64String;
            const int width = 45, height = 120;
            using (Bitmap bitmap = new Bitmap(width, height))
            {
                using (Graphics graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.Transparent);
                    FontFamily fontFamily = FontFamily.GenericSansSerif;
                    using (Font font = new Font(fontFamily, 14, FontStyle.Bold, GraphicsUnit.Point))
                    {
                        SizeF textSize = graphics.MeasureString(text, font);
                        PointF pointF = new PointF(-textSize.Width - (height - textSize.Width) / 2, (width - textSize.Height) / 2);
                        using (SolidBrush solidBrush = new SolidBrush(Color.FromArgb(255, Color.White)))
                        {
                            graphics.RotateTransform(-90);
                            graphics.DrawString(text, font, solidBrush, pointF);
                        }
                    }

                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        bitmap.Save(memoryStream, ImageFormat.Png);
                        memoryStream.Position = 0;
                        byte[] byteBuffer = memoryStream.ToArray();
                        base64String = Convert.ToBase64String(byteBuffer);
                    }
                }
            }
            return base64String;
        }
    }
}
