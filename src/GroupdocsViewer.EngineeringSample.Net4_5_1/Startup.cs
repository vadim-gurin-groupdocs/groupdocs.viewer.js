using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(GroupdocsViewer.EngineeringSample.Net4_5_1.Startup))]

namespace GroupdocsViewer.EngineeringSample.Net4_5_1
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
