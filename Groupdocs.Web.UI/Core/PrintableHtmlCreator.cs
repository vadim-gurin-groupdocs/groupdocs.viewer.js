using Groupdocs.Engine.Viewing;
using System;
using System.Drawing;
using System.IO;
using System.Text;

namespace Groupdocs.Web.UI
{
    public interface IImageUrlCreator
    {
        string[] GetImageUrlsInternal(string path, int startingPageNumber, int pageCount, int? pageWidth, int? quality,
                                 bool usePdf = true,
                                 string watermarkText = null, int? watermarkColor = null,
                                 WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal,
                                 float? watermarkFontSize = 0,
                                 bool ignoreDocumentAbsence = false,
                                 bool useHtmlBasedEngine = false,
                                 bool supportPageRotation = false,
                                 string instanceId = null, string locale = null);
    }


    internal interface IPrintableHtmlCreator
    {
        string GetPrintableHtmlForImageBasedEngine(string path,
                                                   IImageUrlCreator urlCreator,
                                                   string displayName = null,
                                                   string watermarkText = null,
                                                   int? watermarkColor = null,
                                                   WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                                   float watermarkFontSize = 0);

        string GetPrintableHtmlForHtmlBasedEngine(string path,
                                                  Func<string, int, int, string[]> pageHtmlCreator,
                                                  string css,
                                                  string displayName = null);

        string GetHtmlWithImage(string path);

        string GetHtmlWithImage(string path, IImageUrlCreator urlCreator);
    }

    internal class PrintableHtmlCreator : IPrintableHtmlCreator
    {
        private readonly IViewingService _viewingService;
        private readonly IUrlsCreator _urlsCreator;
        private readonly string _rootStoragePath;
        private readonly string _cachePath;
        private readonly IViewingServiceCreator _viewingServiceCreator;
        private IRootPathFinder _rootPathFinder;

        public PrintableHtmlCreator()
        {
            _urlsCreator = new UrlsCreator();
            _rootPathFinder = new RootPathFinder();
            _rootStoragePath = _rootPathFinder.GetRootStoragePath();
            _cachePath = _rootPathFinder.GetCachePath();

            _viewingServiceCreator = new ViewingServiceCreator();
            _viewingService = _viewingServiceCreator.GetViewingService(_rootStoragePath, _cachePath);

        }


        public string GetPrintableHtmlForImageBasedEngine(string path,
                                       IImageUrlCreator urlCreator,
                                       string displayName = null, string watermarkText = null, int? watermarkColor = null,
                                       WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                       float watermarkFontSize = 0)
        {
            return GetPrintableHtml(path, false, urlCreator, null, null, displayName, watermarkText, watermarkColor, watermarkPosition, watermarkFontSize);
        }

        public string GetPrintableHtmlForHtmlBasedEngine(string path,
                                       Func<string, int, int, string[]> pageHtmlCreator,
                                       string css,
                                       string displayName = null)
        {
            return GetPrintableHtml(path, true, null, pageHtmlCreator, css, displayName);
        }

        private string GetPrintableHtml(string path,
            bool useHtmlBasedEngine,
            IImageUrlCreator urlCreator,
            Func<string, int, int, string[]> pageHtmlCreator,
            string css,
            string displayName = null,
            string watermarkText = null, int? watermarkColor = null,
            WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
            float watermarkFontSize = 0)
        {
            throw new NotImplementedException();
        }

        public string GetHtmlWithImage(string path)
        {
            return GetHtmlWithImage(path, _urlsCreator);
        }

        public string GetHtmlWithImage(string path, IImageUrlCreator urlCreatorParam)
        {
            throw new NotImplementedException();
        }
    }
}