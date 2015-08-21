using System;
using System.Collections.Specialized;
using System.Globalization;
using System.Web;

namespace Groupdocs.Web.UI
{
    public interface IUrlsCreator : IImageUrlCreator
    {
        string GetFileUrl(string path, bool getPdf, bool isPrintable, string fileDisplayName = null,
                        string watermarkText = null, int? watermarkColor = null,
                        WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                        bool ignoreDocumentAbsence = false,
                        bool useHtmlBasedEngine = false,
                        bool supportPageRotation = false,
                        string instanceId = null);

        string GetResourceForHtmlUrl(string documentPath, string resourcePath, bool relativeToOriginal = false, string instanceId = null);
    }


    public class UrlsCreator : IUrlsCreator
    {
        protected IApplicationPathFinder ApplicationPathFinder;

        public UrlsCreator()
        {
            ApplicationPathFinder = new ApplicationPathFinder();
        }

        protected virtual string EndpointPrefix
        {
            get
            {
                return String.Format("{0}document-viewer", ApplicationPathFinder.GetApplicationPath());
            }
        }

        protected virtual string UrlSuffix
        {
            get { return "Handler"; }
        }

        protected virtual string Version
        {
            get { return string.Empty; }
        }

        public string[] GetImageUrlsInternal(string path, int startingPageNumber, int pageCount, int? pageWidth,
                                     int? quality, bool usePdf = true,
                                     string watermarkText = null, int? watermarkColor = null,
                                     WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal, float? watermarkWidth = 0,
                                     bool ignoreDocumentAbsence = false,
                                     bool useHtmlBasedEngine = false,
                                     bool supportPageRotation = false,
                                     string instanceId = null, string locale = null)
        {
            NameValueCollection queryString = HttpUtility.ParseQueryString(string.Empty);
            queryString["path"] = path;
            queryString["width"] = pageWidth.ToString();
            queryString["quality"] = quality.ToString();
            queryString["usePdf"] = usePdf.ToString();
            if (!String.IsNullOrEmpty(watermarkText))
            {
                queryString["watermarkText"] = watermarkText;
                queryString["watermarkColor"] = watermarkColor.ToString();
                queryString["watermarkPosition"] = (watermarkPosition ?? WatermarkPosition.Diagonal).ToString();
                queryString["watermarkWidth"] = (watermarkWidth ?? 0).ToString(CultureInfo.InvariantCulture);
            }

            if (ignoreDocumentAbsence)
                queryString["ignoreDocumentAbsence"] = ignoreDocumentAbsence.ToString();
            queryString["useHtmlBasedEngine"] = useHtmlBasedEngine.ToString();
            queryString["rotate"] = supportPageRotation.ToString();

            if (!string.IsNullOrEmpty(Version))
            {
                queryString["v"] = Version;
            }
            if (!string.IsNullOrWhiteSpace(instanceId))
            {
                queryString[Constants.InstanceIdRequestKey] = instanceId;
            }

            if (!string.IsNullOrWhiteSpace(locale))
                queryString["locale"] = locale;

            var pageUrls = new string[pageCount];

            var handler = String.Format("GetDocumentPageImage{0}", UrlSuffix);

            for (int i = 0; i < pageCount; i++)
            {
                queryString["pageIndex"] = (startingPageNumber + i).ToString(CultureInfo.InvariantCulture);
                pageUrls[i] = String.Format("{0}/{1}?{2}", EndpointPrefix, handler, queryString);
            }

            return pageUrls;
        }

        public string GetFileUrl(string path, bool getPdf, bool isPrintable, string fileDisplayName = null,
                                 string watermarkText = null, int? watermarkColor = null,
                                 WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal, float watermarkWidth = 0,
                                 bool ignoreDocumentAbsence = false,
                                 bool useHtmlBasedEngine = false,
                                 bool supportPageRotation = false,
                                 string instanceId = null)
        {
            NameValueCollection queryString = HttpUtility.ParseQueryString(string.Empty);
            queryString["path"] = path;
            if (!isPrintable)
            {
                queryString["getPdf"] = getPdf.ToString().ToLower();
                if (fileDisplayName != null)
                    queryString["displayName"] = fileDisplayName;
            }

            if (watermarkText != null)
            {
                queryString["watermarkText"] = watermarkText;
                queryString["watermarkColor"] = watermarkColor.ToString();
                queryString["watermarkPosition"] = watermarkPosition.ToString();
                queryString["watermarkWidth"] = watermarkWidth.ToString(CultureInfo.InvariantCulture);
            }

            if (ignoreDocumentAbsence)
            {
                queryString["ignoreDocumentAbsence"] = ignoreDocumentAbsence.ToString().ToLower();
            }

            queryString["useHtmlBasedEngine"] = useHtmlBasedEngine.ToString().ToLower();
            queryString["supportPageRotation"] = supportPageRotation.ToString().ToLower();
            if (!string.IsNullOrWhiteSpace(instanceId))
            {
                queryString[Constants.InstanceIdRequestKey] = instanceId;
            }
            string handlerName;
            if (isPrintable)
                handlerName = "GetPdfWithPrintDialogHandler";
            else
                handlerName = "GetFileHandler";

            string fileUrl = String.Format("{0}/{1}?{2}", EndpointPrefix, handlerName, queryString);
            return fileUrl;
        }

        public string GetResourceForHtmlUrl(string documentPath, string resourcePath,
                                            bool relativeToOriginal = false, string instanceId = null)
        {
            NameValueCollection queryString = HttpUtility.ParseQueryString(string.Empty);
            queryString["documentPath"] = documentPath;
            queryString["resourcePath"] = resourcePath;
            queryString["relativeToOriginal"] = relativeToOriginal.ToString().ToLower();
            //queryString["fileNameOnly"] = fileNameOnly.ToString().ToLower();
            if (!string.IsNullOrWhiteSpace(instanceId))
            {
                queryString[Constants.InstanceIdRequestKey] = instanceId;
            }
            string printUrl = String.Format("{0}/GetResourceForHtmlHandler?{1}", EndpointPrefix, queryString);
            return printUrl;
        }
    }

    public class UrlsCreatorForCOntrollers : UrlsCreator
    {
        protected override string UrlSuffix
        {
            get { return String.Empty; }
        }
    }
}
