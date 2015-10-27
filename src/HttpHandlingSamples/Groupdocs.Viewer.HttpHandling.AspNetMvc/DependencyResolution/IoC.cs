using Groupdocs.Web.UI.Core;
using StructureMap;

namespace Groupdocs.Viewer.HttpHandling.AspNetMvc.DependencyResolution
{
    public static class IoC
    {
        public static IContainer Initialize()
        {
            ObjectFactory.Initialize(x =>
                        {
                            x.Scan(scan =>
                                    {
                                        scan.TheCallingAssembly();
                                        scan.WithDefaultConventions();
                                        scan.AssemblyContainingType<ICoreHandler>();
                                    });
                            x.For<ICoreHandler>().Use<CoreHandler>().Ctor<string>("productName").Is((string)null);
                            //                x.For<IExample>().Use<Example>();
                        });
            return ObjectFactory.Container;
        }
    }
}