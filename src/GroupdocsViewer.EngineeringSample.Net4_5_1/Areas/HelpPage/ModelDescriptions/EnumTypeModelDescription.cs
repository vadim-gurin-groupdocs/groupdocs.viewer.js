using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace GroupdocsViewer.EngineeringSample.Net4_5_1.Areas.HelpPage.ModelDescriptions
{
    public class EnumTypeModelDescription : ModelDescription
    {
        public EnumTypeModelDescription()
        {
            Values = new Collection<EnumValueDescription>();
        }

        public Collection<EnumValueDescription> Values { get; private set; }
    }
}