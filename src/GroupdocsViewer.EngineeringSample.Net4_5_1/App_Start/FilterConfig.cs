using System.Web;
using System.Web.Mvc;

namespace GroupdocsViewer.EngineeringSample.Net4_5_1
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }
    }
}
