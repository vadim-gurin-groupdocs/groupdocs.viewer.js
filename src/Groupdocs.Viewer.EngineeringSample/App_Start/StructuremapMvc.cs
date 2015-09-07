using System.Web.Mvc;

[assembly: WebActivator.PreApplicationStartMethod(typeof(Groupdocs.Viewer.UI.App_Start.StructuremapMvc), "Start")]

namespace Groupdocs.Viewer.UI.App_Start
{
    public static class StructuremapMvc
    {
        public static void Start()
        {
            Viewer.InitDependencyInjection();
        }
    }
}