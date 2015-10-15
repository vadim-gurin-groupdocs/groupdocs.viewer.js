namespace Groupdocs.Viewer.HttpHandling.WebApi.ViewModels
{
    public class LoadFileBrowserTreeDataViewModel
    {
        public string path { get; set; }
        public int pageIndex { get; set; }
        public int pageSize { get; set; }
        public string orderBy { get; set; }
        public bool orderAsc { get; set; }
        public string filter { get; set; }
        public string fileTypes { get; set; }
        public bool extended { get; set; }
        public string callback { get; set; }
        public string instanceIdToken { get; set; }
    }
}
