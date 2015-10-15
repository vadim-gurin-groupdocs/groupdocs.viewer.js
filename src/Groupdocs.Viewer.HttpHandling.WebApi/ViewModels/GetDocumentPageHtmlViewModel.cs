namespace Groupdocs.Viewer.HttpHandling.WebApi.ViewModels
{
    public class GetDocumentPageHtmlViewModel
    {
        public string path { get; set; }
        public int pageIndex { get; set; }
        public bool usePngImages { get; set; }
        public bool embedImagesIntoHtmlForWordFiles { get; set; }
        public string instanceIdToken { get; set; }
        public string locale { get; set; }
    }
}
