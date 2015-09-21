using System.Web.Mvc;
using Groupdocs.Viewer.HttpHandling.AspNetMvc.Core;

[assembly: WebActivator.PreApplicationStartMethod(typeof(Groupdocs.Viewer.UI.App_Start.StructuremapMvc), "Start")]

namespace Groupdocs.Viewer.UI.App_Start
{
    public static class StructuremapMvc
    {
        public static void Start()
        {
            ViewerMvc.InitDependencyInjection();
        }
    }
}