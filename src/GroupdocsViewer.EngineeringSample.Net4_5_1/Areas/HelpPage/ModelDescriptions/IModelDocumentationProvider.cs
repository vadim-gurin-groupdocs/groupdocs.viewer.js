using System;
using System.Reflection;

namespace GroupdocsViewer.EngineeringSample.Net4_5_1.Areas.HelpPage.ModelDescriptions
{
    public interface IModelDocumentationProvider
    {
        string GetDocumentation(MemberInfo member);

        string GetDocumentation(Type type);
    }
}